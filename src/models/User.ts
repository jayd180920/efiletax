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
    password: {
      type: String,
      // Use a custom validator instead of required function
      validate: [
        {
          validator: function (this: any, value: string) {
            // Password is required only if provider is not set and no reset token
            if (!this.provider && !this.resetToken && !value) {
              return false;
            }
            return true;
          },
          message: "Password is required",
        },
        {
          validator: function (this: any, value: string) {
            // Skip validation if provider is set or if there's a reset token or if no value
            if (this.provider || this.resetToken || !value) return true;

            // Check for at least one uppercase letter
            const hasUppercase = /[A-Z]/.test(value);
            // Check for at least one lowercase letter
            const hasLowercase = /[a-z]/.test(value);
            // Check for at least one special character
            const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
              value
            );

            return hasUppercase && hasLowercase && hasSpecialChar;
          },
          message:
            "Password must contain at least one uppercase letter, one lowercase letter, and one special character",
        },
        {
          validator: function (this: any, value: string) {
            // Skip validation if provider is set or if there's a reset token or if no value
            if (this.provider || this.resetToken || !value) return true;

            // Check minimum length
            return value.length >= 10;
          },
          message: "Password must be at least 10 characters",
        },
      ],
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
  // Skip password hashing if provider is set or password is not modified
  if (this.provider || !this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
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
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Check if model exists before creating a new one (for hot reloading in development)
const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
