import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyTokenEdge } from "./lib/auth-edge";

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
  console.log("Edge middleware processing path:", pathname);

  // Handle common typo: /dashboard/users -> /dashboard/user
  if (pathname === "/dashboard/users") {
    console.log("Redirecting from /dashboard/users to /dashboard/user");
    return NextResponse.redirect(new URL("/dashboard/user", request.url));
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
    // Get token from cookies
    const token = request.cookies.get("token")?.value;
    console.log("Auth token exists:", !!token);

    // Get session token from cookies (for NextAuth)
    const sessionToken =
      request.cookies.get("next-auth.session-token")?.value ||
      request.cookies.get("__Secure-next-auth.session-token")?.value;
    console.log("NextAuth session token exists:", !!sessionToken);

    // Check if we have any valid authentication
    let isAuthenticated = false;
    let userRole = "user";
    console.log("Verifying custom token Before NextAuth", token);
    // First try to verify the custom token
    if (token) {
      console.log("Verifying custom token");
      const payload = await verifyTokenEdge(token);

      console.log("Custom token verified, payload", payload);
      if (payload) {
        console.log("Custom token verified, user role:", payload.role);
        isAuthenticated = true;
        userRole = payload.role;
      } else {
        console.log("Custom token verification failed");
      }
    }

    // If we have a NextAuth session token, assume it's valid
    // (NextAuth validation happens in the API routes)
    if (!isAuthenticated && sessionToken) {
      console.log("NextAuth session token found, assuming authenticated");
      isAuthenticated = true;
      // We don't know the role from the session token alone,
      // but we'll check it when accessing admin paths
    }

    // If authenticated, check role permissions for admin paths
    if (isAuthenticated) {
      const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));
      console.log("Is admin path:", isAdminPath);

      // For admin paths, we need to verify the role
      if (isAdminPath) {
        // If we already know the role from the custom token
        if (token && userRole !== "admin" && userRole !== "regionAdmin") {
          console.log(
            `Access denied: User role '${userRole}' is not admin or regionAdmin`
          );
          // Redirect non-admin users to user dashboard
          return NextResponse.redirect(new URL("/dashboard/user", request.url));
        }

        // If we're using NextAuth and don't know the role yet,
        // let the request through and let the page handle the role check
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
    // Exclude API routes from middleware to prevent interference
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
