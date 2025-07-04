import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";
import {
  apiHandler,
  ValidationError,
  UnauthorizedError,
} from "@/lib/api-utils";
import rateLimiter, { getClientIP, RATE_LIMIT_CONFIG } from "@/lib/rate-limit";
import {
  logLoginSuccess,
  logLoginFailed,
  logLoginBlocked,
} from "@/lib/auth-logger";
import fingerprintService, {
  createFingerprintFromClient,
  FINGERPRINT_RISK_THRESHOLDS,
} from "@/lib/fingerprint";
import {
  initializeEmergencySecurity,
  isEmergencyBlocked,
} from "@/lib/emergency-security";

// Function to verify reCAPTCHA token
async function verifyRecaptcha(token: string): Promise<boolean> {
  try {
    const secretKey =
      process.env.GOOGLE_RECAPTCHA_SECRET_KEY ||
      "6Ld96FcrAAAAAEmoXHTpTZSrWxzrYXw-BTN0d6Ct";
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`,
      {
        method: "POST",
      }
    );

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    console.log("Login API route called");

    // Get client IP for rate limiting and logging
    const clientIP = getClientIP(req);
    console.log("Client IP:", clientIP);

    // EMERGENCY: Initialize emergency security if this is a localhost attack
    if (clientIP === "::1" || clientIP === "127.0.0.1") {
      console.error(
        `[EMERGENCY] Localhost attack detected from ${clientIP}, initializing emergency security`
      );
      initializeEmergencySecurity();
    }

    // EMERGENCY: Check if IP is emergency blocked
    if (isEmergencyBlocked(clientIP)) {
      console.error(
        `[EMERGENCY] Emergency blocked IP ${clientIP} attempted login`
      );
      await logLoginBlocked(
        req,
        "unknown",
        "Emergency IP block active",
        "rate_limit"
      );
      throw new ValidationError(
        "Your IP address has been temporarily blocked due to automated attack detection. This is an emergency security measure."
      );
    }

    // EMERGENCY: Check if IP is blocked first
    const ipBlockStatus = rateLimiter.isIPBlocked(clientIP);
    if (ipBlockStatus.blocked) {
      console.error(
        `[SECURITY] Blocked IP ${clientIP} attempted login. Reason: ${ipBlockStatus.reason}`
      );
      await logLoginBlocked(
        req,
        "unknown",
        `IP blocked: ${ipBlockStatus.reason}`,
        "rate_limit"
      );
      throw new ValidationError(
        `Your IP address has been temporarily blocked due to suspicious activity. Please try again in ${Math.ceil(
          (ipBlockStatus.retryAfter || 0) / 60
        )} minutes.`
      );
    }

    // Connect to database
    await dbConnect();
    console.log("Connected to database");

    // Parse request body
    const body = await req.json();
    const { email, password, recaptchaToken, browserFingerprint } = body;
    console.log("Login attempt for email:", email);

    // Validate input
    if (!email || !password) {
      console.log("Validation error: Missing email or password");
      await logLoginFailed(
        req,
        email || "unknown",
        "Missing email or password"
      );
      throw new ValidationError("Please provide email and password");
    }

    // Check IP-based rate limiting first
    const ipRateLimit = rateLimiter.checkLimit(
      clientIP,
      RATE_LIMIT_CONFIG.LOGIN.IP_LIMIT,
      RATE_LIMIT_CONFIG.LOGIN.WINDOW_MS,
      "ip"
    );

    if (!ipRateLimit.allowed) {
      console.log("IP rate limit exceeded for:", clientIP);

      // EMERGENCY: Check for rapid attempts and auto-block if threshold exceeded
      const wasBlocked = rateLimiter.checkRapidAttempts(clientIP);
      if (wasBlocked) {
        console.error(
          `[EMERGENCY] IP ${clientIP} auto-blocked due to rapid attempts`
        );
      }

      await logLoginBlocked(req, email, "IP rate limit exceeded", "rate_limit");
      throw new ValidationError(
        `Too many login attempts from this IP. Please try again in ${Math.ceil(
          (ipRateLimit.retryAfter || 0) / 60
        )} minutes.`
      );
    }

    // Check user-based rate limiting
    const userRateLimit = rateLimiter.checkLimit(
      email,
      RATE_LIMIT_CONFIG.LOGIN.USER_LIMIT,
      RATE_LIMIT_CONFIG.LOGIN.WINDOW_MS,
      "user"
    );

    if (!userRateLimit.allowed) {
      console.log("User rate limit exceeded for:", email);
      await logLoginBlocked(
        req,
        email,
        "User rate limit exceeded",
        "rate_limit"
      );
      throw new ValidationError(
        `Too many login attempts for this account. Please try again in ${Math.ceil(
          (userRateLimit.retryAfter || 0) / 60
        )} minutes.`
      );
    }

    // Verify reCAPTCHA token
    if (recaptchaToken) {
      const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
      if (!isRecaptchaValid) {
        console.log("reCAPTCHA validation failed");
        await logLoginFailed(req, email, "reCAPTCHA validation failed");
        throw new ValidationError(
          "reCAPTCHA validation failed. Please try again."
        );
      }
    }

    // Find user by email and include password and lockout fields
    const user = await User.findOne({ email }).select(
      "+password +failedLoginAttempts +lastFailedLogin +lockedUntil"
    );

    if (!user) {
      console.log("User not found with email:", email);
      await logLoginFailed(req, email, "User not found");
      throw new UnauthorizedError("Invalid credentials");
    }
    console.log("User found:", { id: user._id, role: user.role });

    // Check if account is locked
    if (user.isAccountLocked && user.isAccountLocked()) {
      console.log("Account is locked for user:", email);
      await logLoginBlocked(req, email, "Account locked", "account_locked");

      const lockTimeRemaining = user.lockedUntil
        ? Math.ceil((user.lockedUntil.getTime() - Date.now()) / (1000 * 60))
        : 0;

      throw new UnauthorizedError(
        `Account is temporarily locked due to multiple failed login attempts. Please try again in ${lockTimeRemaining} minutes.`
      );
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log("Invalid password for user:", email);

      // Increment failed attempts
      if (user.incrementFailedAttempts) {
        await user.incrementFailedAttempts();
      }

      await logLoginFailed(req, email, "Invalid password");
      throw new UnauthorizedError("Invalid credentials");
    }
    console.log("Password validated successfully");

    // Reset failed attempts on successful password validation
    if (user.resetFailedAttempts) {
      await user.resetFailedAttempts();
    }

    // Analyze browser fingerprint if provided
    let fingerprintAnalysis = null;
    if (browserFingerprint) {
      try {
        const fingerprint = createFingerprintFromClient(browserFingerprint);
        // In a real implementation, you'd fetch known fingerprints for this user from the database
        const knownFingerprints: string[] = []; // TODO: Fetch from database
        fingerprintAnalysis = fingerprintService.analyzeFingerprint(
          fingerprint,
          knownFingerprints
        );

        console.log("Fingerprint analysis:", {
          hash: fingerprintAnalysis.hash,
          riskScore: fingerprintAnalysis.riskScore,
          isNewDevice: fingerprintAnalysis.isNewDevice,
          suspiciousFeatures: fingerprintAnalysis.suspiciousFeatures,
        });

        // Log high-risk fingerprints
        if (fingerprintAnalysis.riskScore >= FINGERPRINT_RISK_THRESHOLDS.HIGH) {
          console.warn("High-risk fingerprint detected:", fingerprintAnalysis);
        }
      } catch (error) {
        console.error("Error analyzing fingerprint:", error);
      }
    }

    // Check if 2FA is enabled for the user
    // We need to reload the user to get the twoFactorEnabled field
    const userWithTwoFactor = await User.findById(user._id);
    if (userWithTwoFactor?.twoFactorEnabled) {
      console.log("2FA is enabled for user:", email);
      // Return a special response indicating 2FA is required
      return NextResponse.json({
        success: true,
        requiresTwoFactor: true,
        user: {
          email: user.email,
        },
      });
    }

    // Generate JWT token
    const token = generateToken(user);
    console.log("JWT token generated");

    // Log successful login
    await logLoginSuccess(req, user._id.toString(), user.email);

    // Reset rate limits on successful login
    rateLimiter.resetLimit(clientIP, "ip");
    rateLimiter.resetLimit(email, "user");

    // Create response
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    console.log("Returning user data:", userData);

    const response = NextResponse.json({
      success: true,
      user: userData,
      fingerprintAnalysis: fingerprintAnalysis
        ? {
            isNewDevice: fingerprintAnalysis.isNewDevice,
            riskScore: fingerprintAnalysis.riskScore,
          }
        : null,
    });

    // Set cookie
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: false, // Set to false since we don't have SSL
      sameSite: "lax", // Changed to 'lax' to work better with redirects
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    console.log("Auth cookie set successfully");

    return response;
  });
}
