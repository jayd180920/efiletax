import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { verifyTokenEdge } from "./lib/auth-edge";

// Paths that require authentication
const protectedPaths = [
  "/dashboard/user",
  "/dashboard/admin",
  "/services/gst-filing/new-registration",
  // Add other protected paths here
];

// Paths that should bypass middleware completely
const bypassPaths = ["/payment-success", "/payment-failed"];

// Paths that require admin role
const adminPaths = ["/dashboard/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log("Middleware processing path:", pathname);

  // Handle common typo: /dashboard/users -> /dashboard/user
  if (pathname === "/dashboard/users") {
    console.log("Redirecting from /dashboard/users to /dashboard/user");
    return NextResponse.redirect(new URL("/dashboard/user", request.url));
  }

  // Check if the path should bypass middleware completely
  const shouldBypass = bypassPaths.some((path) => pathname.startsWith(path));

  if (shouldBypass) {
    console.log(`Bypassing middleware for path: ${pathname}`);
    return NextResponse.next();
  }

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );
  console.log("Is protected path:", isProtectedPath);

  // If not a protected path, allow the request
  if (!isProtectedPath) {
    console.log("Not a protected path, allowing request");
    return NextResponse.next();
  }

  try {
    // Try to get NextAuth.js session token
    const nextAuthToken = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    console.log("NextAuth token exists:", !!nextAuthToken);

    // Get custom token from cookies
    const customToken = request.cookies.get("token")?.value;
    console.log("Custom token exists:", !!customToken);

    // Check if we have any valid authentication
    let isAuthenticated = false;
    let userRole = "user";

    // Check NextAuth token
    if (nextAuthToken) {
      console.log("Using NextAuth token for authentication");
      isAuthenticated = true;

      // Get role from token, default to 'user' if not present
      userRole =
        (nextAuthToken as any).role ||
        (nextAuthToken as any).user?.role ||
        "user";
      console.log("User role from NextAuth token:", userRole);
    }
    // Check custom token
    else if (customToken) {
      console.log("Verifying custom token");
      const payload = await verifyTokenEdge(customToken);

      if (payload) {
        console.log("Custom token verified, user role:", payload.role);
        isAuthenticated = true;
        userRole = payload.role;
      } else {
        console.log("Custom token verification failed");
      }
    }

    // If authenticated, check role permissions
    if (isAuthenticated) {
      // Check if admin path and user is not admin
      const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));
      console.log("Is admin path:", isAdminPath);

      if (isAdminPath && userRole !== "admin" && userRole !== "regionAdmin") {
        console.log(
          `Access denied: User role '${userRole}' is not admin or regionAdmin`
        );
        // Redirect non-admin users to user dashboard
        return NextResponse.redirect(new URL("/dashboard/user", request.url));
      }

      console.log("Authentication successful, allowing request");
      // Allow the request
      return NextResponse.next();
    }

    // If no valid authentication, redirect to login
    console.log("No valid authentication found, redirecting to login");
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Error in middleware:", error);

    // In case of error, redirect to login for safety
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/services/:path*",
    // Add other paths that should be checked by the middleware
  ],
};
