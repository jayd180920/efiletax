/**
 * Authentication Debug Script
 *
 * This script helps debug authentication issues on the server.
 * Run this script on your production server to test authentication.
 *
 * Usage: node debug-auth.js
 */

const https = require("https");
const http = require("http");

// Configuration
const BASE_URL = "https://app.efiletax.in"; // Change this to your server URL
const TEST_ENDPOINTS = [
  "/api/auth/session",
  "/api/submissions?page=1&limit=1",
  "/api/payment/check?serviceId=680bb07c9ce1b2f7ef7e680e",
  "/api/auth/providers",
];

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https://");
    const client = isHttps ? https : http;

    const req = client.request(url, options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function testEndpoint(endpoint, cookies = "") {
  log(`\n🔍 Testing: ${endpoint}`, "cyan");

  try {
    const response = await makeRequest(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        Cookie: cookies,
        "User-Agent": "AuthDebugScript/1.0",
        Accept: "application/json",
      },
    });

    log(
      `Status: ${response.statusCode}`,
      response.statusCode === 200 ? "green" : "red"
    );

    // Parse response body
    let parsedBody;
    try {
      parsedBody = JSON.parse(response.body);
    } catch (e) {
      parsedBody = response.body;
    }

    // Log response details
    if (response.statusCode === 200) {
      log("✅ Success", "green");
      if (typeof parsedBody === "object") {
        log(`Response: ${JSON.stringify(parsedBody, null, 2)}`, "blue");
      }
    } else {
      log("❌ Failed", "red");
      log(`Error: ${JSON.stringify(parsedBody, null, 2)}`, "red");
    }

    // Check for Set-Cookie headers
    if (response.headers["set-cookie"]) {
      log("🍪 Cookies set:", "yellow");
      response.headers["set-cookie"].forEach((cookie) => {
        log(`  ${cookie}`, "yellow");
      });
    }

    return response;
  } catch (error) {
    log(`❌ Request failed: ${error.message}`, "red");
    return null;
  }
}

async function testGoogleLogin() {
  log("\n🔐 Testing Google OAuth Flow", "magenta");

  try {
    // Test the Google OAuth initiation
    const response = await makeRequest(`${BASE_URL}/api/auth/signin/google`, {
      method: "GET",
      headers: {
        "User-Agent": "AuthDebugScript/1.0",
      },
    });

    log(
      `Google OAuth Status: ${response.statusCode}`,
      response.statusCode === 200 ? "green" : "red"
    );

    if (response.headers.location) {
      log(`Redirect URL: ${response.headers.location}`, "blue");
    }
  } catch (error) {
    log(`❌ Google OAuth test failed: ${error.message}`, "red");
  }
}

async function checkEnvironment() {
  log("\n🌍 Environment Check", "magenta");

  // Check if we can reach the server
  try {
    const response = await makeRequest(`${BASE_URL}/`, {
      method: "GET",
      headers: {
        "User-Agent": "AuthDebugScript/1.0",
      },
    });

    log(
      `Server reachable: ${response.statusCode === 200 ? "Yes" : "No"}`,
      response.statusCode === 200 ? "green" : "red"
    );
  } catch (error) {
    log(`❌ Cannot reach server: ${error.message}`, "red");
    return false;
  }

  return true;
}

async function main() {
  log("🚀 Starting Authentication Debug Script", "cyan");
  log(`Target Server: ${BASE_URL}`, "blue");

  // Check if server is reachable
  const serverReachable = await checkEnvironment();
  if (!serverReachable) {
    log("❌ Cannot proceed - server not reachable", "red");
    return;
  }

  // Test each endpoint without authentication
  log("\n📋 Testing endpoints without authentication:", "yellow");
  for (const endpoint of TEST_ENDPOINTS) {
    await testEndpoint(endpoint);
  }

  // Test Google OAuth
  await testGoogleLogin();

  // Instructions for manual testing
  log("\n📝 Manual Testing Instructions:", "cyan");
  log("1. Open your browser and go to: " + BASE_URL, "blue");
  log("2. Login with Google OAuth", "blue");
  log("3. Open browser developer tools (F12)", "blue");
  log("4. Go to Application/Storage tab > Cookies", "blue");
  log("5. Look for these cookies:", "blue");
  log("   - __Secure-next-auth.session-token (production)", "yellow");
  log("   - next-auth.session-token (development)", "yellow");
  log("6. Copy the cookie value and test with curl:", "blue");
  log(
    `   curl -H "Cookie: __Secure-next-auth.session-token=YOUR_TOKEN" ${BASE_URL}/api/submissions?page=1&limit=1`,
    "yellow"
  );

  log("\n✅ Debug script completed", "green");
}

// Run the script
main().catch((error) => {
  log(`❌ Script failed: ${error.message}`, "red");
  console.error(error);
});
