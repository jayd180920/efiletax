import NextAuth, { type SessionStrategy } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken, generateToken } from "@/lib/auth";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log(
          "NextAuth: authorize called with credentials:",
          credentials?.email
        );

        if (!credentials?.email || !credentials?.password) {
          console.log("NextAuth: Missing email or password");
          return null;
        }

        try {
          await dbConnect();
          console.log("NextAuth: Connected to database");

          const user = await User.findOne({ email: credentials.email }).select(
            "+password"
          );
          if (!user) {
            console.log(
              "NextAuth: User not found with email:",
              credentials.email
            );
            return null;
          }
          console.log("NextAuth: User found:", {
            id: user._id,
            role: user.role,
          });

          // Use the User model's comparePassword method for consistency
          const isPasswordValid = await user.comparePassword(
            credentials.password
          );

          if (!isPasswordValid) {
            console.log(
              "NextAuth: Invalid password for user:",
              credentials.email
            );
            return null;
          }
          console.log("NextAuth: Password validated successfully");

          const userData = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };

          console.log("NextAuth: Returning user data:", userData);
          return userData;
        } catch (error) {
          console.error("NextAuth: Error in authorize function:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }: any) {
      // Allow relative URLs (internal redirects)
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Allow redirects to the same host
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default fallback
      return baseUrl;
    },
    async jwt({ token, user, account }: any) {
      // Initial sign in
      if (account && user) {
        // For Google sign in
        if (account.provider === "google") {
          await dbConnect();

          // Check if user exists
          let dbUser = await User.findOne({ email: user.email });

          // If user doesn't exist, create a new one
          if (!dbUser) {
            dbUser = await User.create({
              name: user.name,
              email: user.email,
              role: "user", // Default role
              provider: "google",
              // Set a random password for Google users (they'll never use it)
              password:
                Math.random().toString(36).slice(-10) +
                Math.random().toString(36).toUpperCase().slice(-2) +
                "!@#",
            });
          }

          token.id = dbUser._id.toString();
          token.role = dbUser.role;
        } else {
          // For credentials sign in
          token.id = user.id;
          token.role = user.role;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        // Ensure user object exists
        if (!session.user) {
          session.user = {};
        }

        // Set user properties from token
        session.user.id = token.id;
        session.user.role = token.role || "user"; // Default to 'user' if role is not set

        // Log session for debugging
        console.log("Session data:", {
          id: session.user.id,
          role: session.user.role,
          email: session.user.email,
          name: session.user.name,
        });
      }
      return session;
    },
    async signIn({ user, account, profile }: any) {
      console.log("NextAuth signIn callback:", { user, account, profile });

      if (account?.provider === "google") {
        try {
          await dbConnect();

          // Check if user exists
          let dbUser = await User.findOne({ email: user.email });

          // If user doesn't exist, create a new one
          if (!dbUser) {
            console.log("Creating new Google user:", user.email);
            dbUser = await User.create({
              name: user.name,
              email: user.email,
              role: "user", // Default role
              provider: "google",
              // Set a random password for Google users (they'll never use it)
              password:
                Math.random().toString(36).slice(-10) +
                Math.random().toString(36).toUpperCase().slice(-2) +
                "!@#",
            });
            console.log("Google user created successfully:", dbUser._id);
          } else {
            console.log("Existing Google user found:", dbUser._id);
          }

          return true;
        } catch (error) {
          console.error("Error in Google signIn callback:", error);
          return false;
        }
      }

      return true; // Allow all other sign ins
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt" as SessionStrategy,
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production", // Use secure cookies in production
        domain:
          process.env.NODE_ENV === "production" ? ".efiletax.in" : undefined, // Set domain for production
      },
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
