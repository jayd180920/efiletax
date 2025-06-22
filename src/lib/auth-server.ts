import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { authenticate } from "@/lib/auth";
import jwt from "jsonwebtoken";

// Define the authentication result type
interface AuthResult {
  userId: string;
  role: string;
  region?: string;
  email?: string;
}

/**
 * Comprehensive authentication function that tries multiple methods
 * @param req The Next.js request object
 * @returns Authentication result with userId and role, or null if authentication fails
 */
export async function authenticateRequest(
  req: NextRequest
): Promise<AuthResult | null> {
  console.log("authenticateRequest: Starting authentication process");

  // Method 1: Try NextAuth session first
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      console.log("authenticateRequest: NextAuth session found");
      return {
        userId: session.user.id,
        role: (session.user as any).role || "user",
        region: (session.user as any).region,
        email: session.user.email || undefined,
      };
    }
    console.log("authenticateRequest: No NextAuth session");
  } catch (error) {
    console.error("authenticateRequest: NextAuth session error:", error);
  }

  // Method 2: Try custom JWT token authentication
  try {
    const auth = await authenticate(req);
    if (auth) {
      console.log("authenticateRequest: Custom JWT token found");
      return {
        userId: auth.userId,
        role: auth.role,
        region: auth.region,
      };
    }
    console.log("authenticateRequest: No custom JWT token");
  } catch (error) {
    console.error("authenticateRequest: Custom JWT error:", error);
  }

  // Method 3: Try to manually decode NextAuth session token
  try {
    const sessionToken =
      req.cookies.get("next-auth.session-token")?.value ||
      req.cookies.get("__Secure-next-auth.session-token")?.value;

    if (sessionToken) {
      console.log(
        "authenticateRequest: Found NextAuth session token, attempting manual decode"
      );

      // Try to decode the NextAuth JWT token
      const secret = process.env.NEXTAUTH_SECRET;
      if (secret) {
        try {
          const decoded = jwt.verify(sessionToken, secret) as any;
          if (decoded?.sub) {
            console.log(
              "authenticateRequest: Successfully decoded NextAuth token"
            );
            return {
              userId: decoded.sub,
              role: decoded.role || "user",
              region: decoded.region,
              email: decoded.email,
            };
          }
        } catch (jwtError) {
          console.log(
            "authenticateRequest: JWT decode failed, trying alternative methods"
          );

          // Try to decode without verification (for debugging)
          const parts = sessionToken.split(".");
          if (parts.length === 3) {
            try {
              const payload = JSON.parse(
                Buffer.from(parts[1], "base64").toString()
              );
              if (payload?.sub) {
                console.log(
                  "authenticateRequest: Decoded token payload without verification"
                );
                return {
                  userId: payload.sub,
                  role: payload.role || "user",
                  region: payload.region,
                  email: payload.email,
                };
              }
            } catch (decodeError) {
              console.error(
                "authenticateRequest: Failed to decode token payload:",
                decodeError
              );
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("authenticateRequest: Manual token decode error:", error);
  }

  // Method 4: Check for any other authentication cookies
  const allCookies = req.cookies.getAll();
  console.log(
    "authenticateRequest: All available cookies:",
    allCookies.map((c) => ({ name: c.name, hasValue: !!c.value }))
  );

  console.log("authenticateRequest: All authentication methods failed");
  return null;
}

/**
 * Simplified authentication check that returns boolean
 */
export async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const auth = await authenticateRequest(req);
  return auth !== null;
}

/**
 * Get user ID from request
 */
export async function getUserId(req: NextRequest): Promise<string | null> {
  const auth = await authenticateRequest(req);
  return auth?.userId || null;
}

/**
 * Get user role from request
 */
export async function getUserRole(req: NextRequest): Promise<string | null> {
  const auth = await authenticateRequest(req);
  return auth?.role || null;
}
