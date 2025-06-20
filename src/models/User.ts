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
  createdAt: Date;
  updatedAt: Date;
  comparePassword?: (candidatePassword: string) => Promise<boolean>;
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

// Check if model exists before creating a new one (for hot reloading in development)
const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
