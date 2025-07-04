import { NextRequest } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastAttempt: number;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

interface BlockedIP {
  blockedUntil: number;
  reason: string;
  attemptCount: number;
}

interface BlockedIPStore {
  [key: string]: BlockedIP;
}

class RateLimiter {
  private store: RateLimitStore = {};
  private blockedIPs: BlockedIPStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });

    // Clean up expired blocked IPs
    Object.keys(this.blockedIPs).forEach((ip) => {
      if (this.blockedIPs[ip].blockedUntil < now) {
        console.log(`[SECURITY] Unblocking IP ${ip} after timeout`);
        delete this.blockedIPs[ip];
      }
    });
  }

  private getKey(identifier: string, type: "ip" | "user" = "ip"): string {
    return `${type}:${identifier}`;
  }

  private isWithinWindow(entry: RateLimitEntry, windowMs: number): boolean {
    const now = Date.now();
    return now - entry.lastAttempt < windowMs;
  }

  public checkLimit(
    identifier: string,
    limit: number = 5,
    windowMs: number = 15 * 60 * 1000, // 15 minutes
    type: "ip" | "user" = "ip"
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const key = this.getKey(identifier, type);
    const now = Date.now();

    let entry = this.store[key];

    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired entry
      entry = {
        count: 0,
        resetTime: now + windowMs,
        lastAttempt: now,
      };
      this.store[key] = entry;
    }

    // Check if we're within the rate limit
    if (entry.count >= limit) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter,
      };
    }

    // Increment counter
    entry.count++;
    entry.lastAttempt = now;

    return {
      allowed: true,
      remaining: limit - entry.count,
      resetTime: entry.resetTime,
    };
  }

  public recordAttempt(identifier: string, type: "ip" | "user" = "ip"): void {
    const key = this.getKey(identifier, type);
    const now = Date.now();

    if (this.store[key]) {
      this.store[key].lastAttempt = now;
    }
  }

  public resetLimit(identifier: string, type: "ip" | "user" = "ip"): void {
    const key = this.getKey(identifier, type);
    delete this.store[key];
  }

  public getStats(
    identifier: string,
    type: "ip" | "user" = "ip"
  ): RateLimitEntry | null {
    const key = this.getKey(identifier, type);
    return this.store[key] || null;
  }

  // Check if IP is blocked
  public isIPBlocked(ip: string): {
    blocked: boolean;
    reason?: string;
    retryAfter?: number;
  } {
    const blockedEntry = this.blockedIPs[ip];
    if (!blockedEntry) {
      return { blocked: false };
    }

    const now = Date.now();
    if (blockedEntry.blockedUntil <= now) {
      // Block has expired, remove it
      delete this.blockedIPs[ip];
      console.log(`[SECURITY] IP ${ip} block expired and removed`);
      return { blocked: false };
    }

    const retryAfter = Math.ceil((blockedEntry.blockedUntil - now) / 1000);
    return {
      blocked: true,
      reason: blockedEntry.reason,
      retryAfter,
    };
  }

  // Block an IP address
  public blockIP(
    ip: string,
    reason: string,
    durationMs: number = RATE_LIMIT_CONFIG.EMERGENCY_BLOCK.BLOCK_DURATION_MS
  ): void {
    const now = Date.now();
    const existingBlock = this.blockedIPs[ip];

    this.blockedIPs[ip] = {
      blockedUntil: now + durationMs,
      reason,
      attemptCount: existingBlock ? existingBlock.attemptCount + 1 : 1,
    };

    console.error(
      `[SECURITY ALERT] IP ${ip} has been blocked for ${Math.ceil(
        durationMs / (1000 * 60)
      )} minutes. Reason: ${reason}`
    );
  }

  // Check for rapid attempts and auto-block if threshold exceeded
  public checkRapidAttempts(ip: string): boolean {
    const now = Date.now();
    const rapidWindowStart =
      now - RATE_LIMIT_CONFIG.EMERGENCY_BLOCK.RAPID_WINDOW_MS;

    // Count attempts in the rapid window
    const ipKey = this.getKey(ip, "ip");
    const entry = this.store[ipKey];

    if (!entry) return false;

    // Check if we have too many attempts in the rapid window
    if (
      entry.count >= RATE_LIMIT_CONFIG.EMERGENCY_BLOCK.RAPID_ATTEMPTS_THRESHOLD
    ) {
      this.blockIP(
        ip,
        `rapid_authentication_attempts: ${entry.count} attempts in ${
          RATE_LIMIT_CONFIG.EMERGENCY_BLOCK.RAPID_WINDOW_MS / 1000
        } seconds`
      );
      return true;
    }

    return false;
  }

  // Get blocked IPs list
  public getBlockedIPs(): { [ip: string]: BlockedIP } {
    return { ...this.blockedIPs };
  }

  // Manually unblock an IP
  public unblockIP(ip: string): boolean {
    if (this.blockedIPs[ip]) {
      delete this.blockedIPs[ip];
      console.log(`[SECURITY] IP ${ip} manually unblocked`);
      return true;
    }
    return false;
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store = {};
    this.blockedIPs = {};
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

export default rateLimiter;

// Helper function to get client IP from request
export function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to unknown if no IP headers are present
  return "unknown";
}

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  LOGIN: {
    IP_LIMIT: 5, // EMERGENCY: Reduced from 10 to 5 attempts per IP per window
    USER_LIMIT: 5, // EMERGENCY: Reduced from 5 to 3 attempts per user per window
    WINDOW_MS: 30 * 60 * 1000, // EMERGENCY: Increased from 15 to 30 minutes
    EMERGENCY_IP_LIMIT: 3, // Emergency limit for suspicious IPs
    EMERGENCY_WINDOW_MS: 60 * 60 * 1000, // 1 hour emergency lockout
  },
  REGISTER: {
    IP_LIMIT: 3, // EMERGENCY: Reduced from 5 to 3 registrations per IP per window
    WINDOW_MS: 2 * 60 * 60 * 1000, // EMERGENCY: Increased from 1 to 2 hours
  },
  PASSWORD_RESET: {
    IP_LIMIT: 2, // EMERGENCY: Reduced from 3 to 2 password reset requests per IP per window
    USER_LIMIT: 2, // EMERGENCY: Reduced from 2 to 1 password reset requests per user per window
    WINDOW_MS: 2 * 60 * 60 * 1000, // EMERGENCY: Increased from 1 to 2 hours
  },
  // Emergency IP blocking
  EMERGENCY_BLOCK: {
    RAPID_ATTEMPTS_THRESHOLD: 20, // Block IP after 20 rapid attempts
    RAPID_WINDOW_MS: 5 * 60 * 1000, // Within 5 minutes
    BLOCK_DURATION_MS: 24 * 60 * 60 * 1000, // Block for 24 hours
  },
};
