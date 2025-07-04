import { NextAuthOptions } from "next-auth";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "./mongodb-client";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

// Define the token payload type
interface TokenPayload {
  id: string;
  email: string;
  role: string;
  region?: string;
  iat?: number;
  exp?: number;
}

// Define the authentication result type
interface AuthResult {
  userId: string;
  role: string;
  region?: string;
}

// Define the user type for token generation
interface UserForToken {
  _id: string;
  email: string;
  role: string;
  region?: string;
}

declare module "next-auth" {
  interface User {
    id: string;
    role?: string;
    email?: string;
    isPasswordSet?: boolean;
    resetToken?: string;
    region?: string;
  }
  interface Session {
    user: User & {
      id: string;
      role?: string;
      email?: string;
      isPasswordSet?: boolean;
      resetToken?: string;
      region?: string;
    };
  }
  interface JWT {
    role?: string;
    isPasswordSet?: boolean;
    resetToken?: string;
    region?: string;
  }
}

/**
 * Generate a JWT token for a user
 * @param user The user object to generate a token for
 * @returns The generated JWT token
 */
export function generateToken(user: UserForToken): string {
  const secret = process.env.JWT_SECRET || "default_secret";
  const payload: TokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    region: user.region,
  };

  return jwt.sign(payload, secret, { expiresIn: "24m" });
}

/**
 * Authenticate a request using JWT token from cookies
 * @param req The Next.js request object
 * @returns Authentication result with userId and role, or null if authentication fails
 */
export async function authenticate(
  req: NextRequest
): Promise<AuthResult | null> {
  // Get token from cookies
  const token = req.cookies.get("token")?.value;

  // If no token, authentication fails
  if (!token) {
    return null;
  }

  // Verify the token
  const payload = verifyToken(token);

  // If token is invalid, authentication fails
  if (!payload) {
    return null;
  }

  // Return authentication result
  return {
    userId: payload.id,
    role: payload.role,
    region: payload.region,
  };
}

/**
 * Verify JWT tokens
 * @param token The JWT token to verify
 * @returns The decoded token payload, or null if verification fails
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const secret = process.env.JWT_SECRET || "default_secret";
    const decoded = jwt.verify(token, secret) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.sub!;
        // Add role to the session from token
        if (token.role) {
          session.user.role = token.role as string;
        }
        // Add isPasswordSet to the session from token
        if (token.isPasswordSet !== undefined) {
          session.user.isPasswordSet = token.isPasswordSet as boolean;
        }
        // Add resetToken to the session from token
        if (token.resetToken) {
          session.user.resetToken = token.resetToken as string;
        }
        // Add region to the session from token
        if (token.region) {
          session.user.region = token.region as string;
        }
      }
      return session;
    },
    jwt: async ({ token, user }) => {
      // Add user properties to the token when a user signs in
      if (user) {
        token.role = user.role;
        token.isPasswordSet = user.isPasswordSet;
        token.resetToken = user.resetToken;
        token.region = user.region;
      }
      return token;
    },
  },
};
