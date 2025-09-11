import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/index";
import { updateSubscription } from "@/actions/stripe";

const STRIPE_SUBSCRIPTION_EVENTS = new Set([
  "invoice.created",
  "invoice.finalized",
  "invoice.paid",
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

const getStripeEvent = async (
  body: string,
  sig: string | null
): Promise<Stripe.Event | null> => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) {
    throw new Error("Missing Stripe webhook signature or secret");
  }
  return stripe.webhooks.constructEvent(body, sig, webhookSecret);
};

export async function POST(req: NextRequest) {
  console.log("Received Stripe webhook event");
  const body = await req.text();

  const signature = (await headers()).get("Stripe-Signature");
  try {
    const stripeEvent = await getStripeEvent(body, signature);
    if (!stripeEvent) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    if (!STRIPE_SUBSCRIPTION_EVENTS.has(stripeEvent.type)) {
      console.log("Ignoring unhandled Stripe event type", stripeEvent.type);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const event = stripeEvent.data.object as Stripe.Subscription;
    const metadata = event.metadata;

    if (
      metadata.connectAccountPayments ||
      metadata.connectAccountSubscriptions
    ) {
      console.log("Skipping connected account subscription event");
      return NextResponse.json(
        { message: "Skipping connected account subscription event" },
        { status: 200 }
      );
    }

    switch (stripeEvent.type) {
      case "checkout.session.completed":
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await updateSubscription(event);
        console.log("CREATED FROM WEBHOOK ", event);
        return NextResponse.json({ received: true }, { status: 200 });
      default:
        console.log("Unhandled Stripe event type", stripeEvent.type);
        return NextResponse.json({ received: true }, { status: 200 });
    }
  } catch (error: unknown) {
    console.error("Webhook processing error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? (error as { statusCode: number }).statusCode
        : 500;
    return new NextResponse(`Webhook Error: ${errorMessage}`, {
      status: statusCode,
    });
  }
}
