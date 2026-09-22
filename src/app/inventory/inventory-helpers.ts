export function formatQuantity(value: number) {
  return new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 }).format(value);
}

export function formatMoney(valueMinor: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(valueMinor / 100);
}

export const movementTone: Record<string, "info" | "success" | "warning" | "danger" | "neutral"> = {
  PURCHASE: "success",
  OPENING_BALANCE: "success",
  RETURN: "success",
  TRANSFER_IN: "info",
  SALE_CONSUMPTION: "neutral",
  TRANSFER_OUT: "warning",
  WASTE: "danger",
  ADJUSTMENT: "warning",
};

export function movementLabel(type: string) {
  return type.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function stockHealth(quantityOnHand: number, reorderLevel: number) {
  if (quantityOnHand <= 0) return { label: "Out", tone: "danger" as const };
  if (quantityOnHand <= reorderLevel) return { label: "Low", tone: "warning" as const };
  return { label: "Healthy", tone: "success" as const };
}
