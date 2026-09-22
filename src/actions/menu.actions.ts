"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { loadAuthContext, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { CategoryModel, ProductModel } from "@/models/Product";
import { cloudinaryImageUrl, uploadMenuItemImage } from "@/lib/cloudinary";
import { ConflictError, NotFoundError, toClientError } from "@/lib/errors";
import { categorySchema, menuAvailabilitySchema, menuItemSchema } from "@/validations/menu.schema";
import { barcodeForSequence, menuSkuForSequence } from "@/lib/menu-identifiers";
import type { ActionResult } from "@/actions/auth.actions";
import { InventoryItemModel } from "@/models/InventoryItem";

function refreshMenuSurfaces() {
  revalidatePath("/admin/menu");
  revalidatePath("/admin/menu/new");
  revalidatePath("/admin/menu/categories");
  revalidatePath("/admin/menu/categories/new");
  revalidatePath("/pos");
  revalidatePath("/workspace/menu");
  revalidatePath("/display", "layout");
}

function parseJsonField(value: FormDataEntryValue | null, field: string): unknown {
  if (typeof value !== "string") throw new Error(`Missing ${field}.`);
  try { return JSON.parse(value); } catch { throw new Error(`The ${field} could not be read.`); }
}

export async function saveMenuItemAction(formData: FormData): Promise<ActionResult<{ productId: string; imageUrl?: string }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    requirePermissions(ctx, PERMISSIONS.SETTINGS_MANAGE);
    const variants = parseJsonField(formData.get("variants"), "price options");
    const modifierGroups = parseJsonField(formData.get("modifierGroups"), "modifier groups");
    const taxRate = formData.get("taxRatePercent");
    const autoSku = formData.get("autoSku") === "true";
    const autoBarcode = formData.get("autoBarcode") === "true";
    const parsed = menuItemSchema.parse({
      id: formData.get("id") || undefined,
      categoryId: formData.get("categoryId"),
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      kitchenStation: formData.get("kitchenStation") || undefined,
      sku: formData.get("sku") || undefined,
      barcode: formData.get("barcode") || undefined,
      taxRatePercent: taxRate ? Number(taxRate) : undefined,
      isAvailable: formData.get("isAvailable") === "true",
      variants,
      modifierGroups,
    });
    const category = await CategoryModel.findOne({ _id: parsed.categoryId, organizationId: ctx.organizationId, isActive: true });
    if (!category) throw new NotFoundError("Menu category");
    const categoryName = category.name;

    async function nextAvailableIdentifier(kind: "sku" | "barcode") {
      let sequence = (await ProductModel.countDocuments({ organizationId: ctx.organizationId })) + 1;
      for (let attempt = 0; attempt < 10_000; attempt += 1, sequence += 1) {
        const value = kind === "sku"
          ? menuSkuForSequence(parsed.name, categoryName, sequence)
          : barcodeForSequence(sequence);
        const exists = await ProductModel.exists({ organizationId: ctx.organizationId, [kind]: value, ...(parsed.id ? { _id: { $ne: parsed.id } } : {}) });
        if (!exists) return value;
      }
      throw new ConflictError(`A unique ${kind.toUpperCase()} could not be generated. Please enter one manually.`);
    }

    const sku = autoSku ? await nextAvailableIdentifier("sku") : parsed.sku;
    const barcode = autoBarcode ? await nextAvailableIdentifier("barcode") : parsed.barcode;

    const conflict = await ProductModel.exists({
      organizationId: ctx.organizationId,
      _id: parsed.id ? { $ne: parsed.id } : { $exists: true },
      $or: [
        ...(sku ? [{ sku }] : []),
        ...(barcode ? [{ barcode }] : []),
      ],
    });
    if (conflict) throw new ConflictError("That SKU or barcode is already used by another menu item.");

    const product = parsed.id
      ? await ProductModel.findOne({ _id: parsed.id, organizationId: ctx.organizationId })
      : new ProductModel({ organizationId: ctx.organizationId, isActive: true });
    if (!product) throw new NotFoundError("Menu item");

    product.categoryId = parsed.categoryId as unknown as typeof product.categoryId;
    product.name = parsed.name;
    product.description = parsed.description;
    product.kitchenStation = parsed.kitchenStation;
    product.sku = sku;
    product.barcode = barcode;
    product.taxRatePercent = parsed.taxRatePercent;
    product.isAvailable = parsed.isAvailable;
    product.set("variants", parsed.variants);
    product.set("modifierGroups", parsed.modifierGroups);
    await product.save();

    const image = formData.get("image");
    let imageUrl = cloudinaryImageUrl(product.imagePublicId);
    if (image instanceof File && image.size > 0) {
      const uploaded = await uploadMenuItemImage(image, ctx.organizationId, String(product._id));
      product.imagePublicId = uploaded.publicId;
      await product.save();
      imageUrl = uploaded.secureUrl;
    }
    refreshMenuSurfaces();
    return { ok: true, data: { productId: String(product._id), imageUrl } };
  } catch (error) {
    return { ok: false, error: toClientError(error) };
  }
}

export async function createMenuCategoryAction(name: string): Promise<ActionResult<{ categoryId: string }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    requirePermissions(ctx, PERMISSIONS.SETTINGS_MANAGE);
    const parsed = categorySchema.parse({ name });
    const exists = await CategoryModel.exists({ organizationId: ctx.organizationId, name: new RegExp(`^${parsed.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
    if (exists) throw new ConflictError("That category already exists.");
    const last = await CategoryModel.findOne({ organizationId: ctx.organizationId }).sort({ sortOrder: -1 }).lean();
    const category = await CategoryModel.create({ organizationId: ctx.organizationId, name: parsed.name, sortOrder: (last?.sortOrder ?? -1) + 1, isActive: true });
    refreshMenuSurfaces();
    return { ok: true, data: { categoryId: String(category._id) } };
  } catch (error) {
    return { ok: false, error: toClientError(error) };
  }
}

export async function setMenuAvailabilityAction(input: unknown): Promise<ActionResult<{ isAvailable: boolean }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    requirePermissions(ctx, PERMISSIONS.SETTINGS_MANAGE);
    const parsed = menuAvailabilitySchema.parse(input);
    const product = await ProductModel.findOneAndUpdate(
      { _id: parsed.productId, organizationId: ctx.organizationId },
      { $set: { isAvailable: parsed.isAvailable } },
      { new: true }
    );
    if (!product) throw new NotFoundError("Menu item");
    refreshMenuSurfaces();
    return { ok: true, data: { isAvailable: product.isAvailable } };
  } catch (error) {
    return { ok: false, error: toClientError(error) };
  }
}

export async function saveProductRecipeAction(input: unknown): Promise<ActionResult<{ productId: string }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    requirePermissions(ctx, PERMISSIONS.INVENTORY_ADJUST);
    const parsed = zRecipeInput(input);
    const product = await ProductModel.findOne({ _id: parsed.productId, organizationId: ctx.organizationId, isActive: true });
    if (!product) throw new NotFoundError("Menu item");
    const ingredients = await InventoryItemModel.find({ _id: { $in: parsed.lines.map((line) => line.inventoryItemId) }, organizationId: ctx.organizationId, branchId: parsed.branchId });
    const ingredientMap = new Map(ingredients.map((item) => [String(item._id), item]));
    if (ingredientMap.size !== parsed.lines.length) throw new NotFoundError("Recipe ingredient");
    product.recipe = parsed.lines.map((line) => {
      const ingredient = ingredientMap.get(line.inventoryItemId)!;
      if (ingredient.unit !== line.unit) throw new ConflictError(`${ingredient.name} uses ${ingredient.unit}; update the recipe unit before saving.`);
      return { inventoryItemId: ingredient._id, quantity: line.quantity, unit: line.unit };
    }) as typeof product.recipe;
    await product.save();
    refreshMenuSurfaces();
    return { ok: true, data: { productId: String(product._id) } };
  } catch (error) {
    return { ok: false, error: toClientError(error) };
  }
}

function zRecipeInput(input: unknown) {
  if (!input || typeof input !== "object") throw new Error("Recipe data is invalid.");
  const value = input as { productId?: unknown; branchId?: unknown; lines?: unknown };
  if (typeof value.productId !== "string" || !/^[0-9a-fA-F]{24}$/.test(value.productId)) throw new Error("Choose a menu item.");
  if (typeof value.branchId !== "string" || !/^[0-9a-fA-F]{24}$/.test(value.branchId)) throw new Error("Choose an active branch.");
  if (!Array.isArray(value.lines)) throw new Error("Add at least one ingredient.");
  const lines = value.lines.map((line) => {
    if (!line || typeof line !== "object") throw new Error("Recipe ingredient is invalid.");
    const entry = line as { inventoryItemId?: unknown; quantity?: unknown; unit?: unknown };
    if (typeof entry.inventoryItemId !== "string" || !/^[0-9a-fA-F]{24}$/.test(entry.inventoryItemId)) throw new Error("Choose a valid ingredient.");
    if (typeof entry.quantity !== "number" || !Number.isFinite(entry.quantity) || entry.quantity <= 0) throw new Error("Ingredient quantity must be greater than zero.");
    if (typeof entry.unit !== "string") throw new Error("Choose an ingredient unit.");
    return { inventoryItemId: entry.inventoryItemId, quantity: entry.quantity, unit: entry.unit };
  });
  if (!lines.length) throw new Error("Add at least one ingredient.");
  if (new Set(lines.map((line) => line.inventoryItemId)).size !== lines.length) throw new Error("Each ingredient can appear only once in a recipe.");
  return { productId: value.productId, branchId: value.branchId, lines };
}
