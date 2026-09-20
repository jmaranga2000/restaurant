/**
 * Usage:
 *   node scripts/create-platform-admin.mjs "Jane Doe" jane@yourcompany.com "a-strong-password"
 *
 * Platform admins can see and suspend every tenant on the platform, so
 * there's intentionally no public sign-up route for this role — it's
 * created directly against the database by someone who already has infra
 * access.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import "dotenv/config";

const [, , name, email, password] = process.argv;

if (!name || !email || !password) {
  console.error("Usage: node scripts/create-platform-admin.mjs <name> <email> <password>");
  process.exit(1);
}

const platformAdminSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    passwordHash: String,
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set — copy .env.example to .env.local first.");
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const PlatformAdmin = mongoose.models.PlatformAdmin || mongoose.model("PlatformAdmin", platformAdminSchema);

  const existing = await PlatformAdmin.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.error(`A platform admin with email ${email} already exists.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await PlatformAdmin.create({ name, email: email.toLowerCase(), passwordHash });

  console.log(`Platform admin created: ${email}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
