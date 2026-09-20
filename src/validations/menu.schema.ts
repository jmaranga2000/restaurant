import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id.");

const variantSchema = z.object({
  name: z.string().trim().min(1, "Give each price option a name.").max(80),
  priceMinor: z.number().int().min(0, "A price cannot be negative."),
  isDefault: z.boolean(),
});

const modifierOptionSchema = z.object({
  name: z.string().trim().min(1).max(80),
  priceMinor: z.number().int().min(0),
});

const modifierGroupSchema = z.object({
  name: z.string().trim().min(1, "Name each modifier group.").max(80),
  minSelect: z.number().int().min(0).max(20),
  maxSelect: z.number().int().min(1).max(20),
  options: z.array(modifierOptionSchema).min(1, "Add at least one option to each modifier group.").max(30),
}).refine((group) => group.minSelect <= group.maxSelect, "Minimum selections cannot exceed the maximum.");

export const menuItemSchema = z.object({
  id: objectId.optional(),
  categoryId: objectId,
  name: z.string().trim().min(2, "Give the menu item a name.").max(120),
  description: z.string().trim().max(500).optional(),
  kitchenStation: z.string().trim().max(80).optional(),
  sku: z.string().trim().max(80).optional(),
  barcode: z.string().trim().max(120).optional(),
  taxRatePercent: z.number().min(0).max(100).optional(),
  isAvailable: z.boolean(),
  variants: z.array(variantSchema).min(1, "Add at least one price option.").max(20),
  modifierGroups: z.array(modifierGroupSchema).max(15),
}).superRefine((item, context) => {
  if (!item.variants.some((variant) => variant.isDefault)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Choose one default price option.", path: ["variants"] });
  }
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Give the category a name.").max(80),
});

export const menuAvailabilitySchema = z.object({
  productId: objectId,
  isAvailable: z.boolean(),
});
