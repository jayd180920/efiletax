# Authentication Fix for 401 Unauthorized Error

## Problem Description

Users were experiencing 401 unauthorized errors when accessing the `/api/submissions` endpoint after successfully logging in with Google OAuth. The API worked fine locally but failed on the production server (https://app.efiletax.in).

## Root Cause Analysis

The issue was caused by improper NextAuth cookie configuration for production environments:

1. **Cookie Security Settings**: Local development used `secure: false` cookies, but production HTTPS requires `secure: true`
2. **Cookie Names**: Production environments should use `__Secure-` prefixed cookie names for enhanced security
3. **Domain Configuration**: Production cookies needed proper domain configuration for `.efiletax.in`
4. **Environment Variables**: Missing or incorrect `NEXTAUTH_URL` and related environment variables on the server

## Changes Made

### 1. Updated NextAuth Configuration (`src/app/api/auth/[...nextauth]/route.ts`)

```javascript
cookies: {
  sessionToken: {
    name: process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token",
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      domain: process.env.NODE_ENV === "production"
        ? ".efiletax.in"
        : undefined, // Set domain for production
    },
  },
}
```

### 2. Enhanced Middleware Logging (`src/middleware.ts`)

- Added environment detection logging
- Better cookie detection for both development and production cookie names

### 3. Improved API Authentication (`src/app/api/submissions/route.ts`)

- Enhanced debugging information
- Better error messages with debug information
- Detailed logging for authentication flow
- Fixed authOptions import to use the correct NextAuth configuration

### 4. Created Robust Authentication Function (`src/lib/auth-server.ts`)

- Multi-method authentication approach
- Fallback mechanisms for different authentication scenarios
- Manual JWT token decoding when NextAuth fails
- Comprehensive logging for debugging

## Required Server Environment Variables

Ensure these environment variables are properly set on your production server:

```bash
# Production Environment Variables
NODE_ENV=production
NEXTAUTH_URL=https://app.efiletax.in
NEXTAUTH_SECRET=your-secure-nextauth-secret-key
NEXT_PUBLIC_BASE_URL=https://app.efiletax.in

# Database
MONGODB_URI=your-production-mongodb-connection-string

# Google OAuth (same as local)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT Secret (same as local)
JWT_SECRET=your-jwt-secret-key
```

## Deployment Checklist

### 1. Environment Variables

- [ ] Set `NODE_ENV=production`
- [ ] Set `NEXTAUTH_URL=https://app.efiletax.in`
- [ ] Set `NEXT_PUBLIC_BASE_URL=https://app.efiletax.in`
- [ ] Verify `NEXTAUTH_SECRET` is set and secure
- [ ] Verify `MONGODB_URI` points to production database
- [ ] Verify Google OAuth credentials are correct

### 2. Google OAuth Configuration

- [ ] Add `https://app.efiletax.in` to authorized JavaScript origins
- [ ] Add `https://app.efiletax.in/api/auth/callback/google` to authorized redirect URIs
- [ ] Verify domain verification in Google Console

### 3. SSL/HTTPS Configuration

- [ ] Ensure SSL certificate is valid and properly configured
- [ ] Verify HTTPS redirects are working
- [ ] Test cookie security in browser developer tools

### 4. Testing Steps

1. Clear all browser cookies for the domain
2. Navigate to `https://app.efiletax.in`
3. Login with Google OAuth
4. Verify successful redirect to dashboard
5. Test API calls to `/api/submissions`
6. Check browser developer tools for cookie presence:
   - Look for `__Secure-next-auth.session-token` cookie
   - Verify cookie has `Secure` and `HttpOnly` flags

## Debugging Commands

### Check Server Logs

Look for these log messages in your server logs:

```
Submissions API: Checking authentication
NextAuth session exists: true/false
Environment: production
User authenticated via NextAuth session: {...}
```

### Test API Endpoint Directly

```bash
# Test with curl (replace with actual session cookie)
curl -H "Cookie: __Secure-next-auth.session-token=your-session-token" \
     https://app.efiletax.in/api/submissions?page=1&limit=10
```

### Browser Console Testing

```javascript
// Check cookies in browser console
document.cookie;

// Test API call
fetch("/api/submissions?page=1&limit=10", {
  credentials: "include",
})
  .then((r) => r.json())
  .then(console.log);
```

## Common Issues and Solutions

### Issue 1: Still getting 401 after deployment

**Solution**: Clear browser cookies completely and try logging in again. Old cookies with incorrect settings may persist.

### Issue 2: Google OAuth redirect fails

**Solution**: Verify Google OAuth settings include the production domain in authorized origins and redirect URIs.

### Issue 3: Cookies not being set

**Solution**: Check that `NEXTAUTH_URL` exactly matches your production domain including protocol (https://).

### Issue 4: Mixed content errors

**Solution**: Ensure all API calls use HTTPS and no HTTP resources are loaded on HTTPS pages.

## Verification Steps

After deployment, verify the fix by:

1. **Login Flow Test**:

   - Go to https://app.efiletax.in
   - Click "Login with Google"
   - Complete OAuth flow
   - Verify redirect to dashboard

2. **API Access Test**:

   - Navigate to submissions page
   - Check that submissions load without 401 errors
   - Verify network tab shows successful API calls

3. **Cookie Inspection**:
   - Open browser developer tools
   - Go to Application/Storage tab
   - Check cookies for app.efiletax.in domain
   - Verify `__Secure-next-auth.session-token` exists with Secure flag

## Additional Security Considerations

1. **CSRF Protection**: NextAuth includes built-in CSRF protection
2. **Secure Cookies**: Production cookies are now properly secured
3. **Domain Restriction**: Cookies are restricted to .efiletax.in domain
4. **HttpOnly**: Session cookies cannot be accessed via JavaScript

## Rollback Plan

If issues persist, you can temporarily rollback by:

1. Setting `NODE_ENV=development` on the server
2. Using the old cookie configuration
3. This should restore the previous behavior while investigating further

## Support

If you continue experiencing issues:

1. Check server logs for detailed error messages
2. Verify all environment variables are correctly set
3. Test the authentication flow step by step
4. Contact the development team with specific error messages and logs
