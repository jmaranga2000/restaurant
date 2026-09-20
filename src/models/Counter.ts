import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * _id is the fully-qualified counter key, e.g. "order:665f...:2026-09-11".
 * Incrementing via findOneAndUpdate({ $inc }) is atomic, so two POS
 * terminals submitting at the same instant can never receive the same
 * order number.
 */
const counterSchema = new Schema({
  _id: { type: String, required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
  value: { type: Number, required: true, default: 0 },
});

export type Counter = InferSchemaType<typeof counterSchema>;
export const CounterModel: Model<Counter> = models.Counter || model<Counter>("Counter", counterSchema);
