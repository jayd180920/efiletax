import * as jose from "jose";

// Define the token payload type
interface TokenPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Verify JWT token using jose library (edge-compatible)
 * This function is designed to work in edge runtime environments
 */
export async function verifyTokenEdge(
  token: string
): Promise<TokenPayload | null> {
  try {
    const secret = process.env.JWT_SECRET || "default_secret";

    // Create a secret key from the JWT_SECRET
    const secretKey = new TextEncoder().encode(secret);

    // Verify the token
    const { payload } = await jose.jwtVerify(token, secretKey);

    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as string,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (error) {
    console.error("Edge token verification failed:", error);
    return null;
  }
}
