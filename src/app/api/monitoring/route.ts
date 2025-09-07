// Monitoring API endpoint for system health and metrics
import { NextRequest, NextResponse } from "next/server";
import { RequestMonitor } from "@/lib/monitoring";
import { RateLimitManager } from "@/lib/security-config";
import { auth } from "@clerk/nextjs/server";

// GET /api/monitoring - Get system monitoring data
export async function GET(req: NextRequest) {
  try {
    // Check authentication for monitoring endpoint
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required for monitoring access" },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "all";
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const format = url.searchParams.get("format") || "json";

    // Validate parameters
    const validTypes = [
      "requests",
      "security",
      "performance",
      "auth",
      "stats",
      "all",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 1000" },
        { status: 400 }
      );
    }

    // Prepare response data based on type
    let responseData: any = {};

    switch (type) {
      case "stats":
        responseData = {
          monitoring: RequestMonitor.getMonitoringStats(),
          performance: RequestMonitor.getPerformanceInsights(),
          rateLimit: RateLimitManager.getRateLimitStats(),
          timestamp: new Date().toISOString(),
        };
        break;

      case "security":
        responseData = {
          securityEvents: RequestMonitor.getRecentSecurityEvents(limit),
          timestamp: new Date().toISOString(),
        };
        break;

      case "performance":
        responseData = {
          performanceInsights: RequestMonitor.getPerformanceInsights(),
          timestamp: new Date().toISOString(),
        };
        break;

      case "requests":
      case "auth":
      case "all":
        // For these types, use the export functionality
        const exportData = RequestMonitor.exportLogs(type as any);
        if (format === "raw") {
          return new NextResponse(exportData, {
            headers: {
              "Content-Type": "application/json",
              "Content-Disposition": `attachment; filename="monitoring-${type}-${Date.now()}.json"`,
            },
          });
        }
        responseData = JSON.parse(exportData);
        break;

      default:
        responseData = {
          monitoring: RequestMonitor.getMonitoringStats(),
          performance: RequestMonitor.getPerformanceInsights(),
          timestamp: new Date().toISOString(),
        };
    }

    // Add metadata to response
    responseData.metadata = {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      limit,
      userId,
      version: "1.0.0",
    };

    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Monitoring-Response": "true",
      },
    });
  } catch (error) {
    console.error("Monitoring API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST /api/monitoring - Manual event logging (for testing or external integrations)
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required for monitoring access" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { type, severity, description, metadata } = body;

    // Validate required fields
    if (!type || !severity || !description) {
      return NextResponse.json(
        { error: "Missing required fields: type, severity, description" },
        { status: 400 }
      );
    }

    // Validate severity
    const validSeverities = ["low", "medium", "high", "critical"];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        {
          error: `Invalid severity. Must be one of: ${validSeverities.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Log the manual event
    const requestId = crypto.randomUUID();
    RequestMonitor.logSecurityEvent(
      type,
      severity,
      req,
      requestId,
      `Manual event: ${description}`,
      userId,
      {
        ...metadata,
        manualEvent: true,
        submittedBy: userId,
      }
    );

    return NextResponse.json({
      success: true,
      eventId: requestId,
      message: "Event logged successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Monitoring POST API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// OPTIONS /api/monitoring - CORS preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
