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
  const payload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d", // Token expires in 7 days
  });
};

// Verify JWT token
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
};

// Set JWT token in cookies
export const setTokenCookie = (response: NextResponse, token: string): void => {
  response.cookies.set({
    name: "token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
};

// Get JWT token from cookies
export const getTokenFromCookies = async (): Promise<string | undefined> => {
  try {
    const cookieStore = await cookies();
    return cookieStore.get("token")?.value;
  } catch (error) {
    console.error("Error getting token from cookies:", error);
    return undefined;
  }
};

// Authentication middleware
export const authenticate = async (
  req: NextRequest,
  requiredRole?: "user" | "admin"
): Promise<{ userId: string; role: string } | null> => {
  // Get token from cookies or authorization header
  const token =
    req.cookies.get("token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return null;
  }

  // Verify token
  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  // Check role if required
  if (
    requiredRole &&
    payload.role !== requiredRole &&
    payload.role !== "admin"
  ) {
    return null;
  }

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
  const token = generateToken(user);
  const response = NextResponse.json(data, { status });
  setTokenCookie(response, token);
  return response;
};
