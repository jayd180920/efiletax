import { NextRequest, NextResponse } from "next/server";
import rateLimiter from "@/lib/rate-limit";
import authLogger from "@/lib/auth-logger";
import { getEmergencyBlockedIPs } from "@/lib/emergency-security";

export async function GET(req: NextRequest) {
  try {
    // Get authentication statistics
    const hourlyStats = authLogger.getStats("hour");
    const dailyStats = authLogger.getStats("day");

    // Get blocked IPs
    const blockedIPs = rateLimiter.getBlockedIPs();
    const emergencyBlockedIPs = getEmergencyBlockedIPs();

    // Get rate limit stats for localhost
    const localhostStats = rateLimiter.getStats("::1", "ip");
    const localhost4Stats = rateLimiter.getStats("127.0.0.1", "ip");

    // Get recent events for localhost
    const localhostEvents = authLogger.getIPEvents("::1", 20);
    const localhost4Events = authLogger.getIPEvents("127.0.0.1", 20);

    const securityStatus = {
      timestamp: new Date().toISOString(),
      emergencyMode: emergencyBlockedIPs.length > 0,
      statistics: {
        hourly: hourlyStats,
        daily: dailyStats,
      },
      blockedIPs: {
        rateLimited: Object.keys(blockedIPs).length,
        emergencyBlocked: emergencyBlockedIPs.length,
        details: {
          rateLimited: blockedIPs,
          emergencyBlocked: emergencyBlockedIPs,
        },
      },
      localhostActivity: {
        ipv6: {
          stats: localhostStats,
          recentEvents: localhostEvents.slice(0, 10),
        },
        ipv4: {
          stats: localhost4Stats,
          recentEvents: localhost4Events.slice(0, 10),
        },
      },
      alerts: [] as Array<{
        level: string;
        message: string;
        ips?: string[];
      }>,
    };

    // Add alerts based on current status
    if (emergencyBlockedIPs.length > 0) {
      securityStatus.alerts.push({
        level: "CRITICAL",
        message: `Emergency IP blocking active for ${emergencyBlockedIPs.length} IP(s)`,
        ips: emergencyBlockedIPs,
      });
    }

    if (hourlyStats.suspiciousActivities > 0) {
      securityStatus.alerts.push({
        level: "HIGH",
        message: `${hourlyStats.suspiciousActivities} suspicious activities detected in the last hour`,
      });
    }

    if (hourlyStats.failedLogins > 50) {
      securityStatus.alerts.push({
        level: "HIGH",
        message: `High number of failed logins: ${hourlyStats.failedLogins} in the last hour`,
      });
    }

    return NextResponse.json(securityStatus);
  } catch (error) {
    console.error("Error getting security status:", error);
    return NextResponse.json(
      { error: "Failed to get security status" },
      { status: 500 }
    );
  }
}

// Emergency unblock endpoint (for authorized users only)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ip } = body;

    if (action === "unblock" && ip) {
      const success = rateLimiter.unblockIP(ip);
      return NextResponse.json({
        success,
        message: success ? `IP ${ip} unblocked` : `IP ${ip} was not blocked`,
      });
    }

    return NextResponse.json(
      { error: "Invalid action or missing IP" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing security action:", error);
    return NextResponse.json(
      { error: "Failed to process security action" },
      { status: 500 }
    );
  }
}
