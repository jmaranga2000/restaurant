import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id.");

export const createInventoryItemSchema = z.object({
  branchId: objectId,
  name: z.string().trim().min(1).max(120),
  unit: z.enum(["g", "kg", "ml", "l", "unit"]),
  minimumStock: z.number().min(0).default(0),
  reorderLevel: z.number().min(0).default(0),
});
export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;

export const MANUAL_MOVEMENT_TYPES = ["PURCHASE", "ADJUSTMENT", "WASTE", "OPENING_BALANCE", "RETURN"] as const;

export const recordManualMovementSchema = z.object({
  branchId: objectId,
  inventoryItemId: objectId,
  type: z.enum(MANUAL_MOVEMENT_TYPES),
  // Positive for stock coming in (opening balance, return), negative for
  // stock going out (waste). "ADJUSTMENT" may be either sign.
  quantity: z.number().refine((n) => n !== 0, "Quantity can't be zero."),
  unitCostMinor: z.number().int().min(0).optional(),
  note: z.string().trim().max(280).optional(),
}).superRefine((movement, context) => {
  if (movement.type === "PURCHASE" && (!movement.unitCostMinor || movement.unitCostMinor <= 0)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["unitCostMinor"], message: "Enter the purchase cost per unit." });
  }
});
export type RecordManualMovementInput = z.infer<typeof recordManualMovementSchema>;
