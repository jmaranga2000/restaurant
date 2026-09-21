function words(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function identifierPart(value: string, fallback: string) {
  const parts = words(value);
  if (!parts.length) return fallback;
  return parts.slice(0, 2).map((part) => part.slice(0, 4).toUpperCase()).join("-");
}

/** A readable menu SKU base. The server appends a unique numeric sequence. */
export function menuSkuBase(name: string, categoryName: string) {
  return `${identifierPart(categoryName, "MENU")}-${identifierPart(name, "ITEM")}`.slice(0, 68).replace(/-+$/, "");
}

export function menuSkuForSequence(name: string, categoryName: string, sequence: number) {
  return `${menuSkuBase(name, categoryName)}-${String(sequence).padStart(3, "0")}`.slice(0, 80);
}

export function ean13CheckDigit(twelveDigitBody: string) {
  const digits = twelveDigitBody.replace(/\D/g, "").slice(0, 12).padStart(12, "0");
  const sum = digits.split("").reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
  return String((10 - (sum % 10)) % 10);
}

/** EAN-13-style internal barcode. Prefix 200 is reserved for internal use. */
export function barcodeForSequence(sequence: number) {
  const body = `200${String(sequence).padStart(9, "0")}`;
  return `${body}${ean13CheckDigit(body)}`;
}

/** A client-side preview; the final value is made unique when the item saves. */
export function suggestedMenuBarcode(name: string, categoryName: string) {
  const source = `${categoryName}:${name}`.toUpperCase();
  const hash = [...source].reduce((value, character) => (value * 31 + character.charCodeAt(0)) % 1_000_000_000, 0);
  return barcodeForSequence(hash || 1);
}
