import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { IUser } from "@/models/User";

// JWT token interface
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Get JWT secret from environment variables
const JWT_SECRET =
  process.env.JWT_SECRET || "fallback_secret_not_for_production";

// Generate JWT token
export const generateToken = (user: IUser & { _id: any }): string => {
  console.log("auth.ts: generateToken called for user:", {
    id: user._id,
    email: user.email,
    role: user.role,
  });

  const payload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d", // Token expires in 7 days
  });

  console.log("auth.ts: Token generated successfully");
  return token;
};

// Verify JWT token
export const verifyToken = (token: string): JwtPayload | null => {
  console.log("auth.ts: verifyToken called");
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    console.log("auth.ts: Token verified successfully, payload:", payload);
    return payload;
  } catch (error) {
    console.error("auth.ts: Token verification failed:", error);
    return null;
  }
};

// Set JWT token in cookies
export const setTokenCookie = (response: NextResponse, token: string): void => {
  console.log("auth.ts: setTokenCookie called");

  response.cookies.set({
    name: "token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  console.log("auth.ts: Token cookie set successfully");
};

// Get JWT token from cookies
export const getTokenFromCookies = async (): Promise<string | undefined> => {
  console.log("auth.ts: getTokenFromCookies called");
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    console.log("auth.ts: Token from cookies exists:", !!token);
    return token;
  } catch (error) {
    console.error("auth.ts: Error getting token from cookies:", error);
    return undefined;
  }
};

// Authentication middleware
export const authenticate = async (
  req: NextRequest,
  requiredRole?: "user" | "admin" | "regionAdmin"
): Promise<{ userId: string; role: string } | null> => {
  console.log("auth.ts: authenticate called, requiredRole:", requiredRole);

  // Get token from cookies or authorization header
  const token =
    req.cookies.get("token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  console.log("auth.ts: token exists:", !!token);

  if (!token) {
    console.log("auth.ts: No token found in cookies or headers");
    return null;
  }

  // Verify token
  const payload = verifyToken(token);
  console.log("auth.ts: token verification result:", !!payload);

  if (!payload) {
    console.log("auth.ts: Token verification failed");
    return null;
  }

  console.log("auth.ts: Token payload:", payload);

  // Check role if required
  if (
    requiredRole &&
    payload.role !== requiredRole &&
    payload.role !== "admin"
  ) {
    console.log(
      `auth.ts: Role check failed. Required: ${requiredRole}, Found: ${payload.role}`
    );
    return null;
  }

  console.log(
    "auth.ts: Authentication successful, userId:",
    payload.userId,
    "role:",
    payload.role
  );
  return {
    userId: payload.userId,
    role: payload.role,
  };
};

// Create authenticated response
export const createAuthResponse = (
  data: any,
  user: IUser & { _id: any },
  status = 200
): NextResponse => {
  console.log("auth.ts: createAuthResponse called for user:", {
    id: user._id,
    email: user.email,
    role: user.role,
  });

  const token = generateToken(user);
  const response = NextResponse.json(data, { status });
  setTokenCookie(response, token);

  console.log(
    "auth.ts: Auth response created successfully with status:",
    status
  );
  return response;
};
