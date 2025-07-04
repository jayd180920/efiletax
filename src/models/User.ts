import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: "user" | "admin" | "regionAdmin";
  region?: mongoose.Types.ObjectId;
  provider?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  isPasswordSet?: boolean;
  twoFactorSecret?: string;
  twoFactorEnabled?: boolean;
  twoFactorTempSecret?: string;
  failedLoginAttempts?: number;
  lastFailedLogin?: Date;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword?: (candidatePassword: string) => Promise<boolean>;
  isAccountLocked?: () => boolean;
  incrementFailedAttempts?: () => Promise<void>;
  resetFailedAttempts?: () => Promise<void>;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please provide a valid email",
      ],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      match: [
        /^(\+\d{1,3}[- ]?)?\d{10}$/,
        "Please provide a valid phone number",
      ],
    },
    isPasswordSet: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false, // Don't return by default in queries
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorTempSecret: {
      type: String,
      select: false, // Don't return by default in queries
    },
    password: {
      type: String,
      select: false, // Don't return password by default in queries
    },
    provider: {
      type: String,
      enum: ["google", "github", null],
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin", "regionAdmin"],
      default: "user",
    },
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
    },
    resetToken: {
      type: String,
      select: false, // Don't return reset token by default in queries
    },
    resetTokenExpiry: {
      type: Date,
      select: false, // Don't return token expiry by default in queries
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lastFailedLogin: {
      type: Date,
    },
    lockedUntil: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  // Skip password hashing if provider is set, password is not modified, or password is undefined/null
  if (this.provider || !this.isModified("password") || !this.password)
    return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
    // Set isPasswordSet to true when password is set
    this.isPasswordSet = true;
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    // If user has no password (e.g., regionAdmin before setting password), return false
    if (!this.password) {
      console.log("User has no password set, authentication failed");
      return false;
    }

    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log("Password comparison result:", isMatch);
    return isMatch;
  } catch (error) {
    console.error("Error comparing passwords:", error);
    throw error;
  }
};

// Method to check if account is locked
UserSchema.methods.isAccountLocked = function (): boolean {
  return !!(this.lockedUntil && this.lockedUntil > new Date());
};

// Method to increment failed login attempts with exponential backoff
UserSchema.methods.incrementFailedAttempts = async function (): Promise<void> {
  // If we have a previous failed attempt, check if it's been more than 2 hours
  // If so, reset the counter
  if (this.lastFailedLogin) {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    if (this.lastFailedLogin < twoHoursAgo) {
      this.failedLoginAttempts = 0;
    }
  }

  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  this.lastFailedLogin = new Date();

  // Implement exponential backoff lockout periods
  let lockoutDuration = 0;

  if (this.failedLoginAttempts >= 3) {
    // 3 attempts: 5 minutes
    if (this.failedLoginAttempts === 3) {
      lockoutDuration = 5 * 60 * 1000; // 5 minutes
    }
    // 4 attempts: 15 minutes
    else if (this.failedLoginAttempts === 4) {
      lockoutDuration = 15 * 60 * 1000; // 15 minutes
    }
    // 5 attempts: 30 minutes
    else if (this.failedLoginAttempts === 5) {
      lockoutDuration = 30 * 60 * 1000; // 30 minutes
    }
    // 6 attempts: 1 hour
    else if (this.failedLoginAttempts === 6) {
      lockoutDuration = 60 * 60 * 1000; // 1 hour
    }
    // 7+ attempts: 24 hours
    else {
      lockoutDuration = 24 * 60 * 60 * 1000; // 24 hours
    }

    this.lockedUntil = new Date(Date.now() + lockoutDuration);
  }

  await this.save();
};

// Method to reset failed login attempts
UserSchema.methods.resetFailedAttempts = async function (): Promise<void> {
  this.failedLoginAttempts = 0;
  this.lastFailedLogin = undefined;
  this.lockedUntil = undefined;
  await this.save();
};

// Check if model exists before creating a new one (for hot reloading in development)
const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
