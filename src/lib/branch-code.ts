function codePart(value: string, fallback: string) {
  const words = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return fallback;
  return words.slice(0, 2).map((word) => word.slice(0, 3).toUpperCase()).join("-");
}

/** Creates a concise, editable default such as RIV-KIT-NAI-CBD. */
export function suggestBranchCode(restaurantName: string, branchName: string) {
  const restaurant = codePart(restaurantName, "RES");
  const branch = codePart(branchName, "MAIN");
  return `${restaurant}-${branch}`.slice(0, 20).replace(/-+$/, "");
}
