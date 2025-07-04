import dbConnect from "@/lib/mongodb";
import { NextRequest } from "next/server";
import { getClientIP } from "./rate-limit";

// Authentication event types
export enum AuthEventType {
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILED = "login_failed",
  LOGIN_BLOCKED_RATE_LIMIT = "login_blocked_rate_limit",
  LOGIN_BLOCKED_ACCOUNT_LOCKED = "login_blocked_account_locked",
  LOGOUT = "logout",
  REGISTER_SUCCESS = "register_success",
  REGISTER_FAILED = "register_failed",
  PASSWORD_RESET_REQUEST = "password_reset_request",
  PASSWORD_RESET_SUCCESS = "password_reset_success",
  PASSWORD_CHANGE = "password_change",
  TWO_FACTOR_ENABLED = "two_factor_enabled",
  TWO_FACTOR_DISABLED = "two_factor_disabled",
  TWO_FACTOR_SUCCESS = "two_factor_success",
  TWO_FACTOR_FAILED = "two_factor_failed",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
}

export interface AuthEventData {
  userId?: string;
  email?: string;
  eventType: AuthEventType;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  riskScore?: number;
}

export interface SuspiciousActivityPattern {
  type: string;
  description: string;
  riskScore: number;
  metadata: Record<string, any>;
}

class AuthLogger {
  private events: AuthEventData[] = [];
  private maxInMemoryEvents = 1000;

  // Log an authentication event
  async logEvent(eventData: Partial<AuthEventData>): Promise<void> {
    const event: AuthEventData = {
      timestamp: new Date(),
      success: true,
      ipAddress: "unknown",
      userAgent: "unknown",
      ...eventData,
    } as AuthEventData;

    // Add to in-memory store for immediate analysis
    this.events.push(event);
    if (this.events.length > this.maxInMemoryEvents) {
      this.events.shift(); // Remove oldest event
    }

    // Log to console for development
    console.log(`[AUTH EVENT] ${event.eventType}:`, {
      userId: event.userId,
      email: event.email,
      ipAddress: event.ipAddress,
      success: event.success,
      failureReason: event.failureReason,
      riskScore: event.riskScore,
    });

    // In production, you would save to database here
    // await this.saveToDatabase(event);

    // Check for suspicious patterns
    await this.analyzeSuspiciousActivity(event);
  }

  // Helper method to create event data from request
  createEventFromRequest(
    request: NextRequest,
    eventType: AuthEventType,
    additionalData: Partial<AuthEventData> = {}
  ): Partial<AuthEventData> {
    return {
      eventType,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent") || "unknown",
      timestamp: new Date(),
      ...additionalData,
    };
  }

  // Analyze for suspicious activity patterns
  private async analyzeSuspiciousActivity(event: AuthEventData): Promise<void> {
    const patterns = await this.detectSuspiciousPatterns(event);

    for (const pattern of patterns) {
      console.warn(
        `[SUSPICIOUS ACTIVITY] ${pattern.type}:`,
        pattern.description
      );

      // Log suspicious activity as a separate event
      await this.logEvent({
        eventType: AuthEventType.SUSPICIOUS_ACTIVITY,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        success: false,
        failureReason: pattern.type,
        metadata: pattern.metadata,
        riskScore: pattern.riskScore,
      });

      // Send alert if risk score is high
      if (pattern.riskScore >= 8) {
        await this.sendAlert(pattern, event);
      }
    }
  }

  // Detect suspicious patterns
  private async detectSuspiciousPatterns(
    event: AuthEventData
  ): Promise<SuspiciousActivityPattern[]> {
    const patterns: SuspiciousActivityPattern[] = [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get recent events for analysis
    const recentEvents = this.events.filter((e) => e.timestamp >= oneHourAgo);
    const dailyEvents = this.events.filter((e) => e.timestamp >= oneDayAgo);

    // Pattern 1: Multiple failed logins from same IP
    const failedLoginsFromIP = recentEvents.filter(
      (e) =>
        e.ipAddress === event.ipAddress &&
        e.eventType === AuthEventType.LOGIN_FAILED
    );

    if (failedLoginsFromIP.length >= 5) {
      patterns.push({
        type: "multiple_failed_logins_same_ip",
        description: `${failedLoginsFromIP.length} failed login attempts from IP ${event.ipAddress} in the last hour`,
        riskScore: Math.min(10, failedLoginsFromIP.length),
        metadata: {
          ipAddress: event.ipAddress,
          attemptCount: failedLoginsFromIP.length,
          timeWindow: "1 hour",
        },
      });
    }

    // Pattern 2: Failed logins across multiple accounts from same IP
    const uniqueEmailsFromIP = new Set(
      recentEvents
        .filter(
          (e) =>
            e.ipAddress === event.ipAddress &&
            e.eventType === AuthEventType.LOGIN_FAILED
        )
        .map((e) => e.email)
        .filter(Boolean)
    );

    if (uniqueEmailsFromIP.size >= 3) {
      patterns.push({
        type: "multiple_accounts_same_ip",
        description: `Failed login attempts on ${uniqueEmailsFromIP.size} different accounts from IP ${event.ipAddress}`,
        riskScore: 9,
        metadata: {
          ipAddress: event.ipAddress,
          accountCount: uniqueEmailsFromIP.size,
          accounts: Array.from(uniqueEmailsFromIP),
        },
      });
    }

    // Pattern 3: Login from new location (simplified - based on IP)
    if (event.eventType === AuthEventType.LOGIN_SUCCESS && event.userId) {
      const userPreviousLogins = dailyEvents.filter(
        (e) =>
          e.userId === event.userId &&
          e.eventType === AuthEventType.LOGIN_SUCCESS &&
          e.ipAddress !== event.ipAddress
      );

      const knownIPs = new Set(userPreviousLogins.map((e) => e.ipAddress));
      if (knownIPs.size > 0 && !knownIPs.has(event.ipAddress)) {
        patterns.push({
          type: "login_from_new_location",
          description: `User ${event.email} logged in from new IP address ${event.ipAddress}`,
          riskScore: 6,
          metadata: {
            userId: event.userId,
            newIP: event.ipAddress,
            knownIPs: Array.from(knownIPs),
          },
        });
      }
    }

    // Pattern 4: Rapid succession of authentication events
    const rapidEvents = recentEvents.filter(
      (e) =>
        e.ipAddress === event.ipAddress &&
        now.getTime() - e.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    );

    if (rapidEvents.length >= 10) {
      patterns.push({
        type: "rapid_authentication_attempts",
        description: `${rapidEvents.length} authentication events from IP ${event.ipAddress} in the last 5 minutes`,
        riskScore: 8,
        metadata: {
          ipAddress: event.ipAddress,
          eventCount: rapidEvents.length,
          timeWindow: "5 minutes",
        },
      });
    }

    // Pattern 5: Unusual time-based activity (simplified)
    const hour = now.getHours();
    if (
      hour >= 2 &&
      hour <= 5 &&
      event.eventType === AuthEventType.LOGIN_SUCCESS
    ) {
      patterns.push({
        type: "unusual_time_login",
        description: `Login at unusual hour: ${hour}:00`,
        riskScore: 4,
        metadata: {
          hour,
          timestamp: event.timestamp,
        },
      });
    }

    return patterns;
  }

  // Send alert for high-risk activities
  private async sendAlert(
    pattern: SuspiciousActivityPattern,
    event: AuthEventData
  ): Promise<void> {
    // In production, implement actual alerting (email, Slack, etc.)
    console.error(`[HIGH RISK ALERT] ${pattern.type}:`, {
      description: pattern.description,
      riskScore: pattern.riskScore,
      event: {
        userId: event.userId,
        email: event.email,
        ipAddress: event.ipAddress,
        timestamp: event.timestamp,
      },
      metadata: pattern.metadata,
    });

    // TODO: Implement actual alerting mechanisms:
    // - Send email to security team
    // - Post to Slack channel
    // - Create incident in monitoring system
    // - Log to external security service
  }

  // Get authentication statistics
  getStats(timeWindow: "hour" | "day" | "week" = "day"): Record<string, any> {
    const now = new Date();
    let cutoff: Date;

    switch (timeWindow) {
      case "hour":
        cutoff = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "day":
        cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "week":
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    const relevantEvents = this.events.filter((e) => e.timestamp >= cutoff);

    const stats = {
      totalEvents: relevantEvents.length,
      successfulLogins: relevantEvents.filter(
        (e) => e.eventType === AuthEventType.LOGIN_SUCCESS
      ).length,
      failedLogins: relevantEvents.filter(
        (e) => e.eventType === AuthEventType.LOGIN_FAILED
      ).length,
      blockedAttempts: relevantEvents.filter(
        (e) =>
          e.eventType === AuthEventType.LOGIN_BLOCKED_RATE_LIMIT ||
          e.eventType === AuthEventType.LOGIN_BLOCKED_ACCOUNT_LOCKED
      ).length,
      suspiciousActivities: relevantEvents.filter(
        (e) => e.eventType === AuthEventType.SUSPICIOUS_ACTIVITY
      ).length,
      uniqueIPs: new Set(relevantEvents.map((e) => e.ipAddress)).size,
      uniqueUsers: new Set(relevantEvents.map((e) => e.userId).filter(Boolean))
        .size,
      timeWindow,
    };

    return stats;
  }

  // Get events for a specific user
  getUserEvents(userId: string, limit: number = 50): AuthEventData[] {
    return this.events
      .filter((e) => e.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get events for a specific IP
  getIPEvents(ipAddress: string, limit: number = 50): AuthEventData[] {
    return this.events
      .filter((e) => e.ipAddress === ipAddress)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

// Singleton instance
const authLogger = new AuthLogger();

export default authLogger;

// Convenience functions for common logging scenarios
export const logLoginSuccess = (
  request: NextRequest,
  userId: string,
  email: string
) =>
  authLogger.logEvent(
    authLogger.createEventFromRequest(request, AuthEventType.LOGIN_SUCCESS, {
      userId,
      email,
      success: true,
    })
  );

export const logLoginFailed = (
  request: NextRequest,
  email: string,
  reason: string
) =>
  authLogger.logEvent(
    authLogger.createEventFromRequest(request, AuthEventType.LOGIN_FAILED, {
      email,
      success: false,
      failureReason: reason,
    })
  );

export const logLoginBlocked = (
  request: NextRequest,
  email: string,
  reason: string,
  type: "rate_limit" | "account_locked"
) =>
  authLogger.logEvent(
    authLogger.createEventFromRequest(
      request,
      type === "rate_limit"
        ? AuthEventType.LOGIN_BLOCKED_RATE_LIMIT
        : AuthEventType.LOGIN_BLOCKED_ACCOUNT_LOCKED,
      {
        email,
        success: false,
        failureReason: reason,
      }
    )
  );

export const logRegisterSuccess = (
  request: NextRequest,
  userId: string,
  email: string
) =>
  authLogger.logEvent(
    authLogger.createEventFromRequest(request, AuthEventType.REGISTER_SUCCESS, {
      userId,
      email,
      success: true,
    })
  );

export const logRegisterFailed = (
  request: NextRequest,
  email: string,
  reason: string
) =>
  authLogger.logEvent(
    authLogger.createEventFromRequest(request, AuthEventType.REGISTER_FAILED, {
      email,
      success: false,
      failureReason: reason,
    })
  );
