# Password Reset Token System

## Overview

The password reset token system allows users to set or reset their passwords using a secure token. This document explains how the system works and recent changes made to improve usability.

## How It Works

1. **Token Generation**:

   - Tokens are generated using the `reset-user-token.js` script
   - Each token is a 32-byte random hex string
   - Tokens expire after 72 hours (3 days)

2. **Token Usage**:
   - Users receive a link with the token and their email
   - Example: `http://localhost:3000/auth/set-password?token=7955dd745bc344d79599da9b8b55a3d4498d3ed9c5ed59f16808af09f8301c73&email=upendra.0825%40gmail.com`
   - The frontend validates the token before allowing password reset
   - After validation, users can set a new password

## Recent Changes

### Token Reusability (Implemented on [Current Date])

Previously, tokens were one-time use only. Once a user set their password, the token was cleared from the database and could not be used again. This created issues when:

- Administrators needed to help users reset passwords multiple times
- Users needed to make multiple password changes within the token's validity period

**Change Made**: Tokens now remain valid until they expire (72 hours after creation), even after being used to set a password. This means:

- The same reset link can be used multiple times within the 72-hour window
- No need to generate a new token for each password reset attempt
- Administrators can send the same link to users who need multiple attempts

## Generating Reset Tokens

To generate a reset token for a user:

```bash
node src/scripts/reset-user-token.js <email>
```

Example:

```bash
node src/scripts/reset-user-token.js upendra.0825@gmail.com
```

This will:

1. Generate a new token for the specified user
2. Set the token expiry to 72 hours from now
3. Output the reset link that can be sent to the user

## Security Considerations

While tokens are now reusable, they still maintain security through:

1. **Expiration**: Tokens automatically expire after 72 hours
2. **User-specific**: Tokens are tied to a specific email address
3. **Secure generation**: Tokens are generated using cryptographically secure random bytes

## Future Improvements

Consider implementing:

1. A self-service password reset flow where users can request resets themselves
2. Email integration to automatically send reset links
3. Admin UI for generating and managing reset tokens
