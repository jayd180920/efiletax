/**
 * Debug Script for EFileTax Admin
 *
 * This script provides debugging utilities for the EFileTax Admin application.
 * It can be used to check environment configuration, verify database connections,
 * test API endpoints, and log system information.
 *
 * Usage:
 * - Run with Node.js: node src/scripts/debug.js
 * - Run with specific command: node src/scripts/debug.js [command]
 *
 * Available commands:
 * - env: Check environment configuration
 * - db: Verify database connections
 * - api: Test API endpoints
 * - system: Log system information
 * - all: Run all checks
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");
const axios = require("axios");
const os = require("os");
const fs = require("fs");
const path = require("path");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
};

// Utility functions
const log = {
  info: (message) =>
    console.log(`${colors.cyan}[INFO]${colors.reset} ${message}`),
  success: (message) =>
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`),
  warning: (message) =>
    console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`),
  error: (message) =>
    console.log(`${colors.red}[ERROR]${colors.reset} ${message}`),
  section: (title) =>
    console.log(
      `\n${colors.bright}${colors.magenta}=== ${title} ===${colors.reset}\n`
    ),
};

// Check environment configuration
async function checkEnvironment() {
  log.section("Environment Configuration");

  const requiredEnvVars = [
    "MONGODB_URI",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "JWT_SECRET",
    "S3_ACCESS_KEY",
    "S3_SECRET_KEY",
    "S3_BUCKET_NAME",
    "S3_REGION",
  ];

  let missingVars = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
      log.warning(`Missing environment variable: ${envVar}`);
    } else {
      log.success(`Found environment variable: ${envVar}`);
    }
  }

  if (missingVars.length > 0) {
    log.error(`Missing ${missingVars.length} required environment variables`);
  } else {
    log.success("All required environment variables are set");
  }

  // Check NODE_ENV
  log.info(
    `NODE_ENV: ${process.env.NODE_ENV || "not set (defaulting to development)"}`
  );

  return missingVars.length === 0;
}

// Verify database connections
async function checkDatabase() {
  log.section("Database Connection");

  if (!process.env.MONGODB_URI) {
    log.error("MONGODB_URI environment variable is not set");
    return false;
  }

  try {
    log.info("Attempting to connect to MongoDB...");

    // Try connecting with mongoose
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    log.success("Successfully connected to MongoDB using Mongoose");

    // Check database stats
    const dbStats = await mongoose.connection.db.stats();
    log.info(`Database name: ${mongoose.connection.db.databaseName}`);
    log.info(`Collections: ${dbStats.collections}`);
    log.info(`Documents: ${dbStats.objects}`);

    // Close mongoose connection
    await mongoose.disconnect();
    log.info("Mongoose connection closed");

    // Try connecting with MongoClient
    const client = new MongoClient(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await client.connect();
    log.success("Successfully connected to MongoDB using MongoClient");

    // Close MongoClient connection
    await client.close();
    log.info("MongoClient connection closed");

    return true;
  } catch (error) {
    log.error(`Failed to connect to MongoDB: ${error.message}`);
    return false;
  }
}

// Test API endpoints
async function testApiEndpoints() {
  log.section("API Endpoints");

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const endpoints = [
    { url: "/api/auth/me", method: "GET", name: "Get Current User" },
    { url: "/api/common-services", method: "GET", name: "Get Common Services" },
  ];

  let successCount = 0;

  for (const endpoint of endpoints) {
    try {
      log.info(
        `Testing ${endpoint.method} ${endpoint.url} (${endpoint.name})...`
      );

      const response = await axios({
        method: endpoint.method,
        url: `${baseUrl}${endpoint.url}`,
        validateStatus: () => true, // Don't throw on any status code
      });

      log.info(`Status: ${response.status} ${response.statusText}`);

      if (response.status >= 200 && response.status < 300) {
        log.success(`Endpoint ${endpoint.url} is working`);
        successCount++;
      } else {
        log.warning(
          `Endpoint ${endpoint.url} returned status ${response.status}`
        );
      }
    } catch (error) {
      log.error(`Failed to test endpoint ${endpoint.url}: ${error.message}`);
    }
  }

  if (successCount === endpoints.length) {
    log.success(`All ${endpoints.length} API endpoints are working`);
    return true;
  } else {
    log.warning(
      `${successCount} out of ${endpoints.length} API endpoints are working`
    );
    return false;
  }
}

// Log system information
async function logSystemInfo() {
  log.section("System Information");

  // Node.js info
  log.info(`Node.js version: ${process.version}`);
  log.info(`Process platform: ${process.platform}`);
  log.info(`Process architecture: ${process.arch}`);

  // OS info
  log.info(`OS: ${os.type()} ${os.release()} ${os.arch()}`);
  log.info(`CPU cores: ${os.cpus().length}`);
  log.info(
    `Total memory: ${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`
  );
  log.info(
    `Free memory: ${Math.round(os.freemem() / (1024 * 1024 * 1024))} GB`
  );

  // Project info
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    log.info(`Project name: ${packageJson.name}`);
    log.info(`Project version: ${packageJson.version}`);
    log.info(`Next.js version: ${packageJson.dependencies.next}`);
    log.info(`React version: ${packageJson.dependencies.react}`);

    return true;
  } catch (error) {
    log.error(`Failed to read package.json: ${error.message}`);
    return false;
  }
}

// Run all checks
async function runAllChecks() {
  const results = {
    environment: await checkEnvironment(),
    database: await checkDatabase(),
    api: await testApiEndpoints(),
    system: await logSystemInfo(),
  };

  log.section("Summary");

  for (const [check, result] of Object.entries(results)) {
    if (result) {
      log.success(
        `${check.charAt(0).toUpperCase() + check.slice(1)} check passed`
      );
    } else {
      log.error(
        `${check.charAt(0).toUpperCase() + check.slice(1)} check failed`
      );
    }
  }

  const allPassed = Object.values(results).every((result) => result);

  if (allPassed) {
    log.success("All checks passed!");
  } else {
    log.warning("Some checks failed. See above for details.");
  }

  return allPassed;
}

// Main function
async function main() {
  const command = process.argv[2] || "all";

  log.info(`Running debug script with command: ${command}`);

  switch (command.toLowerCase()) {
    case "env":
      await checkEnvironment();
      break;
    case "db":
      await checkDatabase();
      break;
    case "api":
      await testApiEndpoints();
      break;
    case "system":
      await logSystemInfo();
      break;
    case "all":
      await runAllChecks();
      break;
    default:
      log.error(`Unknown command: ${command}`);
      log.info("Available commands: env, db, api, system, all");
      break;
  }
}

// Run the main function
main().catch((error) => {
  log.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});
