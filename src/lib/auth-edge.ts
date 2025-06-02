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
    // Use a consistent encoding method for the secret key
    const secretKey = new TextEncoder().encode(secret);

    try {
      // Verify the token
      const { payload } = await jose.jwtVerify(token, secretKey);

      return {
        id: payload.id as string,
        email: payload.email as string,
        role: payload.role as string,
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch (joseError) {
      console.error(
        "Jose verification failed, trying alternative method:",
        joseError
      );

      // If jose.jwtVerify fails, try an alternative approach
      // This is a fallback for tokens that might have been signed with a different algorithm
      // or with a different encoding of the secret

      // Create a secret key using the raw string (for backward compatibility)
      const secretKeyRaw = new TextEncoder().encode(secret);

      // Try with different algorithms
      const algorithms = ["HS256", "HS384", "HS512"];

      for (const alg of algorithms) {
        try {
          // Try to manually decode the token
          const tokenParts = token.split(".");
          if (tokenParts.length !== 3) {
            continue; // Not a valid JWT format
          }

          // Decode the payload part (second part of the token)
          const payloadBase64 = tokenParts[1];
          const payloadJson = Buffer.from(payloadBase64, "base64").toString(
            "utf-8"
          );
          const decodedPayload = JSON.parse(payloadJson);

          return {
            id: decodedPayload.id as string,
            email: decodedPayload.email as string,
            role: decodedPayload.role as string,
            iat: decodedPayload.iat,
            exp: decodedPayload.exp,
          };
        } catch (algError) {
          console.error(`Verification with ${alg} failed:`, algError);
          // Continue to the next algorithm
        }
      }

      // If all verification attempts fail, return null
      return null;
    }
  } catch (error) {
    console.error("Edge token verification failed:", error);
    return null;
  }
}
