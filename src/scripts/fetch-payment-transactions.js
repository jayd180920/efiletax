/**
 * Script to fetch payment transactions with proper authentication
 *
 * This script demonstrates how to:
 * 1. Log in as an admin user
 * 2. Use the authenticated session to access the payment transactions API
 */

const fetch = require("node-fetch");

// Configuration
const BASE_URL = "http://localhost:3000";
const LOGIN_URL = `${BASE_URL}/api/auth/login-v2`;
const TRANSACTIONS_URL = `${BASE_URL}/api/payment/transactions`;

// Admin credentials - replace with actual admin credentials
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "your-admin-password";

async function fetchPaymentTransactions() {
  try {
    console.log("Logging in as admin...");

    // Step 1: Login to get authentication cookies
    const loginResponse = await fetch(LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      throw new Error(
        `Login failed: ${errorData.error || loginResponse.statusText}`
      );
    }

    // Extract cookies from login response
    const cookies = loginResponse.headers.get("set-cookie");
    console.log("Login successful, got cookies:", cookies ? "Yes" : "No");

    // Step 2: Fetch payment transactions with the authenticated session
    console.log("Fetching payment transactions...");
    const transactionsResponse = await fetch(TRANSACTIONS_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        Cookie: cookies, // Include the authentication cookies
      },
    });

    if (!transactionsResponse.ok) {
      const errorData = await transactionsResponse.json();
      throw new Error(
        `Failed to fetch transactions: ${
          errorData.message || transactionsResponse.statusText
        }`
      );
    }

    const transactions = await transactionsResponse.json();
    console.log("Successfully fetched payment transactions:");
    console.log(JSON.stringify(transactions, null, 2));

    return transactions;
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
}

// Execute the function
fetchPaymentTransactions()
  .then(() => console.log("Script completed successfully"))
  .catch((error) => console.error("Script failed:", error));
