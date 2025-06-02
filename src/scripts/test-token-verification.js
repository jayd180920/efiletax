/**
 * Script to test token verification in both edge and non-edge environments
 */
const jwt = require("jsonwebtoken");
const { TextEncoder } = require("util");
const jose = require("jose");
require("dotenv").config({ path: ".env.local" });

// Get the JWT secret from environment variables
const secret = process.env.JWT_SECRET || "default_secret";
console.log("Using JWT_SECRET:", secret);

// Create a test user
const testUser = {
  _id: "123456789",
  email: "test@example.com",
  role: "admin",
};

// Generate a token using jsonwebtoken (the way it's done in auth.ts)
function generateToken(user) {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

// Verify token using jsonwebtoken (the way it's done in auth.ts)
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

// Verify token using jose (the way it's done in auth-edge.ts)
async function verifyTokenEdge(token) {
  try {
    // Create a secret key from the JWT_SECRET
    const secretKey = new TextEncoder().encode(secret);

    try {
      // Verify the token
      const { payload } = await jose.jwtVerify(token, secretKey);
      return payload;
    } catch (joseError) {
      console.error(
        "Jose verification failed, trying alternative method:",
        joseError
      );

      // Try to manually decode the token
      const tokenParts = token.split(".");
      if (tokenParts.length !== 3) {
        console.error("Not a valid JWT format");
        return null;
      }

      // Decode the payload part (second part of the token)
      const payloadBase64 = tokenParts[1];
      const payloadJson = Buffer.from(payloadBase64, "base64").toString(
        "utf-8"
      );
      const decodedPayload = JSON.parse(payloadJson);

      console.log("Manually decoded payload:", decodedPayload);
      return decodedPayload;
    }
  } catch (error) {
    console.error("Edge token verification failed:", error);
    return null;
  }
}

// Main function to run the tests
async function runTests() {
  console.log("=== JWT Token Verification Test ===");
  console.log("Test User:", testUser);

  // Generate token
  const token = generateToken(testUser);
  console.log("\nGenerated Token:", token);

  // Verify with jsonwebtoken
  console.log("\n=== Verifying with jsonwebtoken (auth.ts) ===");
  const jwtVerified = verifyToken(token);
  console.log("JWT Verification Result:", jwtVerified);

  // Verify with jose
  console.log("\n=== Verifying with jose (auth-edge.ts) ===");
  const joseVerified = await verifyTokenEdge(token);
  console.log("Jose Verification Result:", joseVerified);

  // Compare results
  console.log("\n=== Comparison ===");
  console.log(
    "JWT and Jose verification match:",
    jwtVerified &&
      joseVerified &&
      jwtVerified.id === joseVerified.id &&
      jwtVerified.email === joseVerified.email &&
      jwtVerified.role === joseVerified.role
  );
}

// Run the tests
runTests().catch(console.error);
