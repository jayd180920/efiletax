import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";
import { getToken } from "next-auth/jwt";

// Paths that require authentication
const protectedPaths = [
  "/dashboard/user",
  "/dashboard/admin",
  "/services/gst-filing/new-registration",
  // Add other protected paths here
];

// Paths that require admin role
const adminPaths = ["/dashboard/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle common typo: /dashboard/users -> /dashboard/user
  if (pathname === "/dashboard/users") {
    return NextResponse.redirect(new URL("/dashboard/user", request.url));
  }

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // If not a protected path, allow the request
  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // Try to get NextAuth.js session token
  const nextAuthToken = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Get custom token from cookies
  const customToken = request.cookies.get("token")?.value;

  // If no tokens, redirect to login
  if (!nextAuthToken && !customToken) {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // If we have a NextAuth token, use that
  if (nextAuthToken) {
    // Log token for debugging
    console.log("NextAuth token:", nextAuthToken);

    // Check if admin path and user is not admin
    const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));

    // Get role from token, default to 'user' if not present
    const userRole =
      (nextAuthToken as any).role ||
      (nextAuthToken as any).user?.role ||
      "user";

    if (isAdminPath && userRole !== "admin") {
      console.log(`Access denied: User role '${userRole}' is not admin`);
      // Redirect non-admin users to user dashboard
      return NextResponse.redirect(new URL("/dashboard/user", request.url));
    }

    // Allow the request
    return NextResponse.next();
  }

  // Otherwise, verify custom token
  const payload = customToken ? verifyToken(customToken) : null;
  if (!payload) {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Check if admin path and user is not admin
  const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));
  if (isAdminPath && payload.role !== "admin") {
    // Redirect non-admin users to user dashboard
    return NextResponse.redirect(new URL("/dashboard/user", request.url));
  }

  // Allow the request
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/services/:path*",
    // Add other paths that should be checked by the middleware
  ],
};
