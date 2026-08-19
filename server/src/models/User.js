import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    university: { type: String, required: true, trim: true },
    campus: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["faculty", "hod", "admin"], required: true, default: "faculty" },
    department: { type: String, trim: true },
    designation: { type: String, trim: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
  },
  { timestamps: true, versionKey: false }
);

userSchema.index({ university: 1, campus: 1, email: 1 }, { unique: true });

export const User = mongoose.model("User", userSchema, "users");