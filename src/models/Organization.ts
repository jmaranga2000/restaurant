import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 600 },
    logoUrl: { type: String },
    logoPublicId: { type: String },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    defaultCurrency: { type: String, required: true, default: "KES" },
    defaultTimezone: { type: String, required: true, default: "Africa/Nairobi" },
    settings: {
      taxRatePercent: { type: Number, default: 0 },
      serviceChargePercent: { type: Number, default: 0 },
      taxLabel: { type: String, default: "VAT" },
      pricesIncludeTax: { type: Boolean, default: false },
      serviceTypes: [{ type: String, enum: ["DINE_IN", "TAKEAWAY", "DELIVERY", "PICKUP"] }],
      paymentMethods: [{
        code: { type: String, enum: ["CASH", "MPESA", "CARD", "BANK", "OTHER"] },
        label: { type: String },
        enabled: { type: Boolean, default: true },
      }],
      kitchenStations: [{ type: String, trim: true }],
      kitchenDelayAlertMinutes: { type: Number, default: 15, min: 1, max: 180 },
      kitchenSoundEnabled: { type: Boolean, default: true },
      kitchenNotificationsEnabled: { type: Boolean, default: true },
      kitchenDisplayDensity: { type: String, enum: ["COMFORTABLE", "COMPACT"], default: "COMFORTABLE" },
    },
    receipt: {
      header: { type: String, trim: true, maxlength: 240 },
      footer: { type: String, trim: true, maxlength: 500 },
      prefix: { type: String, trim: true, maxlength: 24 },
    },
    businessRegistration: {
      legalName: { type: String, trim: true, maxlength: 160 },
      registrationNumber: { type: String, trim: true, maxlength: 80 },
      taxNumber: { type: String, trim: true, maxlength: 80 },
    },
    subscription: {
      plan: { type: String, enum: ["TRIAL", "STARTER", "PROFESSIONAL", "ENTERPRISE"], default: "TRIAL" },
      status: { type: String, enum: ["TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED"], default: "TRIAL" },
      enabledModules: [{ type: String, trim: true }],
      currentPeriodEndsAt: { type: Date },
    },
    onboarding: {
      status: { type: String, enum: ["IN_PROGRESS", "PAUSED", "COMPLETED"], default: "IN_PROGRESS" },
      completedAt: { type: Date },
      skippedSteps: [{ type: String }],
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export type Organization = InferSchemaType<typeof organizationSchema>;
export const OrganizationModel: Model<Organization> = models.Organization || model<Organization>("Organization", organizationSchema);
