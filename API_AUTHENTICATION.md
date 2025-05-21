# API Authentication Guide

## Problem: Unauthorized Access to API Endpoints

When trying to access protected API endpoints like `/api/payment/transactions`, you may encounter an "Unauthorized" error:

```json
{ "message": "Unauthorized" }
```

This happens because the endpoint requires:

1. A valid authentication session
2. Admin privileges

## Solutions

We've created three different solutions to help you access protected API endpoints:

### 1. Node.js Script (Command Line)

The `src/scripts/fetch-payment-transactions.js` script demonstrates how to authenticate and access the payment transactions API programmatically:

```bash
# Install node-fetch if not already installed
npm install node-fetch

# Run the script
node src/scripts/fetch-payment-transactions.js
```

**Important:** Before running, edit the script to use valid admin credentials:

```javascript
// Admin credentials - replace with actual admin credentials
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "your-admin-password";
```

### 2. API Test Page (Browser-based)

We've created a simple page at `/api-test` that allows you to test the payment transactions API with your current authentication session:

1. Log in as an admin user at `/auth/login`
2. Navigate to `/api-test`
3. Click the "Fetch Payment Transactions" button

This page will show your authentication status and display the API response or error.

### 3. API Tester (General Purpose)

For more flexibility, we've created a general-purpose API tester at `/api-tester` that allows you to:

1. Test any API endpoint in the application
2. Choose the HTTP method (GET, POST, PUT, DELETE, PATCH)
3. Provide a request body for non-GET requests
4. See the full API response

## Understanding the Authentication System

The application uses NextAuth.js for authentication. Here's how it works:

1. When you log in, a session is created and stored in cookies
2. API routes check for this session using `getServerSession(authOptions)`
3. Protected routes also check for specific user roles (e.g., "admin")

### Client-side Authentication

When making API requests from the client side, you must include credentials:

```javascript
const response = await fetch("/api/payment/transactions", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include", // Important for authentication
});

const data = await response.json();
```

The `credentials: "include"` option ensures that cookies containing the authentication session are sent with the request.

### Server-side Authentication

On the server side, API routes check for authentication using:

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Check authentication
const session = await getServerSession(authOptions);
if (!session || !session.user) {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}

// Check if user is admin
if (session.user.role !== "admin") {
  return NextResponse.json(
    { message: "Forbidden: Admin access required" },
    { status: 403 }
  );
}
```

## Common Issues

1. **Not logged in**: Make sure you're logged in before accessing protected endpoints
2. **Wrong user role**: Some endpoints require specific roles (admin, regionAdmin)
3. **Missing credentials**: When making fetch requests, include `credentials: "include"`
4. **Session expired**: Sessions may expire; log in again if needed

## Testing Authentication

You can check your current authentication status by visiting:

- `/api-test` - Shows your authentication status and role
- `/api-tester` - More flexible API testing tool
