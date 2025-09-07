import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { webhookLogger } from "@/lib/webhook-logger";
import { databaseRetryManager } from "@/lib/webhook-retry";
import { webhookMonitor } from "@/lib/webhook-monitoring";
import { webhookRecoveryManager } from "@/lib/webhook-recovery";
import {
  ClerkWebhookEvent,
  ClerkUserData,
  ClerkDeletedObjectData,
  WebhookResponse,
} from "@/types/webhook";

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest
): Promise<NextResponse<WebhookResponse>> {
  const startTime = Date.now();
  const requestId = `webhook_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 11)}`;

  webhookLogger.info("Webhook request received", {
    webhookType: "clerk",
    requestId,
  });

  try {
    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      webhookLogger.error(
        "Missing required Svix headers",
        "Missing webhook headers",
        { webhookType: "clerk", requestId },
        {
          headers: {
            "svix-id": !!svix_id,
            "svix-timestamp": !!svix_timestamp,
            "svix-signature": !!svix_signature,
          },
        }
      );

      return NextResponse.json(
        {
          success: false,
          error: "Missing required webhook headers",
        },
        { status: 400 }
      );
    }

    // Get the body
    const payload = await req.text();

    try {
      JSON.parse(payload); // Validate JSON format
    } catch (parseError) {
      webhookLogger.error(
        "Failed to parse webhook payload",
        parseError instanceof Error
          ? parseError
          : new Error(String(parseError)),
        { webhookType: "clerk", requestId },
        { payloadLength: payload.length }
      );

      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON payload",
        },
        { status: 400 }
      );
    }

    // Validate webhook secret exists
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      webhookLogger.error(
        "Webhook secret not configured",
        "Missing CLERK_WEBHOOK_SECRET environment variable",
        { webhookType: "clerk", requestId }
      );

      return NextResponse.json(
        {
          success: false,
          error: "Webhook configuration error",
        },
        { status: 500 }
      );
    }

    // Create a new Svix instance with your secret
    const wh = new Webhook(webhookSecret);
    let evt: ClerkWebhookEvent;

    // Verify the payload with the headers
    try {
      const svixHeaders = {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      };
      evt = wh.verify(payload, svixHeaders) as ClerkWebhookEvent;
    } catch (err) {
      webhookLogger.error(
        "Webhook signature verification failed",
        err instanceof Error ? err : new Error(String(err)),
        { webhookType: "clerk", requestId },
        {
          svixId: svix_id,
          timestamp: svix_timestamp,
          hasSignature: !!svix_signature,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error: "Invalid webhook signature",
        },
        { status: 400 }
      );
    }

    // Log the webhook event for monitoring
    webhookLogger.info(
      "Webhook event verified successfully",
      {
        webhookType: "clerk",
        eventId: evt.data.id,
        clerkId: evt.data.id,
        requestId,
      },
      {
        eventType: evt.type,
        timestamp: new Date().toISOString(),
      }
    );

    // Track processing metrics
    const processingStartTime = Date.now();

    try {
      // Handle the webhook event based on type
      switch (evt.type) {
        case "user.created":
          await handleUserCreated(evt, requestId);
          break;
        case "user.updated":
          await handleUserUpdated(evt, requestId);
          break;
        case "user.deleted":
          await handleUserDeleted(evt, requestId);
          break;
        default:
          webhookLogger.warn(
            `Unhandled webhook event type: ${evt.type}`,
            {
              webhookType: "clerk",
              requestId,
            },
            { eventType: evt.type }
          );

          return NextResponse.json(
            {
              success: true,
              message: `Webhook event type ${evt.type} not handled`,
            },
            { status: 200 }
          );
      }

      const processingTime = Date.now() - processingStartTime;
      const totalTime = Date.now() - startTime;

      // Track successful processing metrics
      webhookLogger.trackMetrics({
        eventType: evt.type,
        success: true,
        processingTime: totalTime,
        timestamp: new Date(),
      });

      // Track success in monitoring system
      webhookMonitor.trackWebhookResult(true, evt.type);

      webhookLogger.info(
        `Successfully processed ${evt.type} event`,
        {
          webhookType: "clerk",
          eventId: evt.data.id,
          clerkId: evt.data.id,
          requestId,
        },
        {
          processingTime,
          totalTime,
        }
      );

      return NextResponse.json(
        {
          success: true,
          message: `Successfully processed ${evt.type} event`,
        },
        { status: 200 }
      );
    } catch (error) {
      const processingTime = Date.now() - processingStartTime;
      const totalTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Track failed processing metrics
      webhookLogger.trackMetrics({
        eventType: evt.type,
        success: false,
        processingTime: totalTime,
        timestamp: new Date(),
        error: errorMessage,
      });

      // Track failure in monitoring system
      webhookMonitor.trackWebhookResult(false, evt.type);

      webhookLogger.error(
        `Error processing webhook event ${evt.type}`,
        error instanceof Error ? error : new Error(String(error)),
        {
          webhookType: "clerk",
          eventId: evt.data.id,
          clerkId: evt.data.id,
          requestId,
        },
        {
          processingTime,
          totalTime,
          eventType: evt.type,
          errorDetails: {
            name: error instanceof Error ? error.name : "UnknownError",
            stack: error instanceof Error ? error.stack : undefined,
          },
        }
      );

      return NextResponse.json(
        {
          success: false,
          error: `Failed to process ${evt.type} event`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const totalTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    webhookLogger.error(
      "Unexpected error in webhook processing",
      error instanceof Error ? error : new Error(String(error)),
      { webhookType: "clerk", requestId },
      { totalTime }
    );

    // Track failed request metrics
    webhookLogger.trackMetrics({
      eventType: "unknown",
      success: false,
      processingTime: totalTime,
      timestamp: new Date(),
      error: errorMessage,
    });

    // Track failure in monitoring system
    webhookMonitor.trackWebhookResult(false, "unknown");

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Type guard to check if data is ClerkUserData
function isClerkUserData(
  data: ClerkUserData | ClerkDeletedObjectData
): data is ClerkUserData {
  return "email_addresses" in data && "first_name" in data;
}

// Handler for user.created events
async function handleUserCreated(
  evt: ClerkWebhookEvent,
  requestId: string
): Promise<void> {
  if (!isClerkUserData(evt.data)) {
    throw new Error("Invalid user data for user.created event");
  }

  const {
    id,
    email_addresses,
    first_name,
    last_name,
    image_url,
    primary_email_address_id,
  } = evt.data;

  webhookLogger.debug(
    "Processing user.created event",
    {
      webhookType: "clerk",
      clerkId: id,
      requestId,
    },
    {
      hasEmailAddresses: email_addresses?.length > 0,
      hasName: !!(first_name || last_name),
      hasImage: !!image_url,
    }
  );

  const primaryEmail = email_addresses.find(
    (email) => email.id === primary_email_address_id
  );

  if (!primaryEmail) {
    throw new Error("No primary email address found for user");
  }

  const userData = {
    clerkId: id,
    email: primaryEmail.email_address,
    name:
      first_name && last_name
        ? `${first_name} ${last_name}`
        : first_name || last_name || null,
    profileImage: image_url || null,
  };

  // Create user in database with retry mechanism and recovery
  const user = await databaseRetryManager.retryDatabaseOperation(
    async () => {
      try {
        return await prisma.user.create({
          data: userData,
        });
      } catch (error) {
        // Attempt recovery for specific errors
        if (error instanceof Error) {
          const recovered = await webhookRecoveryManager.attemptRecovery(
            error,
            "user.create",
            requestId
          );

          if (recovered) {
            // Retry the operation after recovery
            return await prisma.user.create({
              data: userData,
            });
          }
        }
        throw error;
      }
    },
    "user.create",
    requestId
  );

  webhookLogger.info(
    "User created successfully",
    {
      webhookType: "clerk",
      userId: user.id,
      clerkId: user.clerkId,
      requestId,
    },
    {
      email: user.email,
      hasName: !!user.name,
      hasProfileImage: !!user.profileImage,
    }
  );
}

// Handler for user.updated events
async function handleUserUpdated(
  evt: ClerkWebhookEvent,
  requestId: string
): Promise<void> {
  if (!isClerkUserData(evt.data)) {
    throw new Error("Invalid user data for user.updated event");
  }

  const {
    id,
    email_addresses,
    first_name,
    last_name,
    image_url,
    primary_email_address_id,
  } = evt.data;

  webhookLogger.debug(
    "Processing user.updated event",
    {
      webhookType: "clerk",
      clerkId: id,
      requestId,
    },
    {
      hasEmailAddresses: email_addresses?.length > 0,
      hasName: !!(first_name || last_name),
      hasImage: !!image_url,
    }
  );

  const primaryEmail = email_addresses.find(
    (email) => email.id === primary_email_address_id
  );

  if (!primaryEmail) {
    throw new Error("No primary email address found for user");
  }

  const updateData = {
    email: primaryEmail.email_address,
    name:
      first_name && last_name
        ? `${first_name} ${last_name}`
        : first_name || last_name || null,
    profileImage: image_url || null,
  };

  // Update user in database with retry mechanism and recovery
  const user = await databaseRetryManager.retryDatabaseOperation(
    async () => {
      try {
        return await prisma.user.update({
          where: { clerkId: id },
          data: updateData,
        });
      } catch (error) {
        // Attempt recovery for specific errors
        if (error instanceof Error) {
          const recovered = await webhookRecoveryManager.attemptRecovery(
            error,
            "user.update",
            requestId
          );

          if (recovered) {
            // Retry the operation after recovery
            return await prisma.user.update({
              where: { clerkId: id },
              data: updateData,
            });
          }
        }
        throw error;
      }
    },
    "user.update",
    requestId
  );

  webhookLogger.info(
    "User updated successfully",
    {
      webhookType: "clerk",
      userId: user.id,
      clerkId: user.clerkId,
      requestId,
    },
    {
      email: user.email,
      hasName: !!user.name,
      hasProfileImage: !!user.profileImage,
    }
  );
}

// Handler for user.deleted events
async function handleUserDeleted(
  evt: ClerkWebhookEvent,
  requestId: string
): Promise<void> {
  const { id } = evt.data;

  webhookLogger.debug("Processing user.deleted event", {
    webhookType: "clerk",
    clerkId: id,
    requestId,
  });

  // Soft delete user by setting deletedAt timestamp with retry mechanism and recovery
  const user = await databaseRetryManager.retryDatabaseOperation(
    async () => {
      try {
        return await prisma.user.update({
          where: { clerkId: id },
          data: {
            deletedAt: new Date(),
          },
        });
      } catch (error) {
        // Attempt recovery for specific errors
        if (error instanceof Error) {
          const recovered = await webhookRecoveryManager.attemptRecovery(
            error,
            "user.softDelete",
            requestId
          );

          if (recovered) {
            // Retry the operation after recovery
            return await prisma.user.update({
              where: { clerkId: id },
              data: {
                deletedAt: new Date(),
              },
            });
          }
        }
        throw error;
      }
    },
    "user.softDelete",
    requestId
  );

  webhookLogger.info(
    "User soft deleted successfully",
    {
      webhookType: "clerk",
      userId: user.id,
      clerkId: user.clerkId,
      requestId,
    },
    {
      deletedAt: user.deletedAt?.toISOString(),
    }
  );
}
