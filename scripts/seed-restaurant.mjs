/**
 * Seeds a complete demo restaurant for local development.
 *
 * Usage:
 *   node scripts/seed-restaurant.mjs "a-strong-password"
 *   SEED_ADMIN_PASSWORD="a-strong-password" node scripts/seed-restaurant.mjs
 *
 * The script is safe to run repeatedly. It upserts the platform admin, restaurant owner,
 * branches, catalog, inventory, and opening balances without duplicating data.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const [, , passwordArg] = process.argv;
const platformAdminEmail = "jmaranga35@gmail.com";
const platformAdminName = process.env.SEED_PLATFORM_ADMIN_NAME ?? "J Maranga";
const restaurantOwnerEmail = process.env.SEED_OWNER_EMAIL ?? "owner@jmaranga-restaurant.local";
const restaurantOwnerName = process.env.SEED_OWNER_NAME ?? "Restaurant Owner";
const platformAdminPassword = passwordArg ?? process.env.SEED_ADMIN_PASSWORD;
const restaurantOwnerPassword = "Maranga45@kam";
const organizationSlug = process.env.SEED_ORGANIZATION_SLUG ?? "j-maranga-restaurant";

if (restaurantOwnerEmail.toLowerCase() === platformAdminEmail) {
  throw new Error(`SEED_OWNER_EMAIL cannot be the Super Admin email ${platformAdminEmail}.`);
}

if (!platformAdminPassword || platformAdminPassword.length < 8) {
  console.error("Provide an admin password of at least 8 characters as the first argument or SEED_ADMIN_PASSWORD.");
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set — copy .env.example to .env.local first.");
  process.exit(1);
}

const objectId = mongoose.Schema.Types.ObjectId;
const organizationSchema = new mongoose.Schema({
  name: String,
  slug: String,
  defaultCurrency: String,
  defaultTimezone: String,
  settings: { taxRatePercent: Number, serviceChargePercent: Number },
  isActive: Boolean,
}, { timestamps: true });
const platformAdminSchema = new mongoose.Schema({
  name: String,
  email: String,
  passwordHash: String,
  isActive: Boolean,
  lastLoginAt: Date,
}, { timestamps: true });
const roleSchema = new mongoose.Schema({ organizationId: objectId, name: String, slug: String, permissions: [String], isSystemRole: Boolean }, { timestamps: true });
const userSchema = new mongoose.Schema({
  organizationId: objectId,
  name: String,
  email: String,
  passwordHash: String,
  roleId: objectId,
  assignedBranchIds: [objectId],
  isEmailVerified: Boolean,
  isActive: Boolean,
}, { timestamps: true });
const branchSchema = new mongoose.Schema({
  organizationId: objectId,
  name: String,
  code: String,
  address: String,
  timezone: String,
  openingHours: [{ dayOfWeek: Number, opensAt: String, closesAt: String }],
  isActive: Boolean,
}, { timestamps: true });
const categorySchema = new mongoose.Schema({ organizationId: objectId, name: String, sortOrder: Number, isActive: Boolean }, { timestamps: true });
const inventorySchema = new mongoose.Schema({
  organizationId: objectId,
  branchId: objectId,
  name: String,
  unit: String,
  quantityOnHand: Number,
  minimumStock: Number,
  reorderLevel: Number,
  averageUnitCostMinor: Number,
}, { timestamps: true });
const productSchema = new mongoose.Schema({
  organizationId: objectId,
  categoryId: objectId,
  name: String,
  description: String,
  variants: [{ name: String, priceMinor: Number, isDefault: Boolean }],
  modifierGroups: [{ name: String, minSelect: Number, maxSelect: Number, options: [{ name: String, priceMinor: Number }] }],
  recipe: [{ inventoryItemId: objectId, quantity: Number, unit: String }],
  kitchenStation: String,
  isActive: Boolean,
}, { timestamps: true });
const stockMovementSchema = new mongoose.Schema({
  organizationId: objectId,
  branchId: objectId,
  inventoryItemId: objectId,
  type: String,
  quantity: Number,
  unitCostMinor: Number,
  reference: { kind: String, id: objectId },
  note: String,
  performedBy: objectId,
}, { timestamps: true });

const model = (name, schema) => mongoose.models[name] || mongoose.model(name, schema);
const Organization = model("Organization", organizationSchema);
const PlatformAdmin = model("PlatformAdmin", platformAdminSchema);
const Role = model("Role", roleSchema);
const User = model("User", userSchema);
const Branch = model("Branch", branchSchema);
const Category = model("Category", categorySchema);
const InventoryItem = model("InventoryItem", inventorySchema);
const Product = model("Product", productSchema);
const StockMovement = model("StockMovement", stockMovementSchema);

const ALL_PERMISSIONS = [
  "orders.view", "orders.create", "orders.update", "orders.cancel", "pos.access", "pos.refund",
  "pos.discount", "kitchen.access", "display.manage", "inventory.view", "inventory.adjust",
  "inventory.transfer", "purchases.view", "purchases.create", "purchases.approve", "reports.view",
  "reports.export", "users.view", "users.create", "users.update", "users.delete", "settings.manage",
];

const openingHours = Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, opensAt: "08:00", closesAt: "22:00" }));

async function upsertBy(Model, filter, update) {
  return Model.findOneAndUpdate(filter, { $set: update }, { upsert: true, new: true, setDefaultsOnInsert: true });
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const platformAdminPasswordHash = await bcrypt.hash(platformAdminPassword, 12);
  const restaurantOwnerPasswordHash = await bcrypt.hash(restaurantOwnerPassword, 12);
  await upsertBy(PlatformAdmin, { email: platformAdminEmail }, {
    name: platformAdminName,
    email: platformAdminEmail,
    passwordHash: platformAdminPasswordHash,
    isActive: true,
  });

  const organization = await upsertBy(Organization, { slug: organizationSlug }, {
    name: "J Maranga Restaurant",
    slug: organizationSlug,
    defaultCurrency: "KES",
    defaultTimezone: "Africa/Nairobi",
    settings: { taxRatePercent: 16, serviceChargePercent: 0 },
    isActive: true,
  });

  const ownerRole = await upsertBy(Role, { organizationId: organization._id, slug: "owner" }, {
    organizationId: organization._id,
    name: "Owner",
    slug: "owner",
    permissions: ALL_PERMISSIONS,
    isSystemRole: true,
  });

  const owner = await upsertBy(User, { organizationId: organization._id, email: restaurantOwnerEmail }, {
    organizationId: organization._id,
    name: restaurantOwnerName,
    email: restaurantOwnerEmail,
    passwordHash: restaurantOwnerPasswordHash,
    roleId: ownerRole._id,
    assignedBranchIds: [],
    isEmailVerified: true,
    isActive: true,
  });

  const branchDefinitions = [
    { code: "CBD-01", name: "J Maranga CBD", address: "Kenyatta Avenue, Nairobi" },
    { code: "WST-01", name: "J Maranga Westlands", address: "Waiyaki Way, Nairobi" },
  ];
  const branches = [];
  for (const definition of branchDefinitions) {
    branches.push(await upsertBy(Branch, { organizationId: organization._id, code: definition.code }, {
      ...definition,
      organizationId: organization._id,
      timezone: "Africa/Nairobi",
      openingHours,
      isActive: true,
    }));
  }

  const categoryDefinitions = ["Breakfast", "Mains", "Burgers", "Sides", "Drinks"];
  const categories = {};
  for (const [sortOrder, name] of categoryDefinitions.entries()) {
    categories[name] = await upsertBy(Category, { organizationId: organization._id, name }, {
      organizationId: organization._id, name, sortOrder, isActive: true,
    });
  }

  const inventoryDefinitions = [
    ["Chicken breast", "g", 25000, 10000, 15000, 18],
    ["Beef mince", "g", 20000, 8000, 12000, 22],
    ["Burger buns", "unit", 120, 40, 60, 35],
    ["Eggs", "unit", 180, 60, 90, 18],
    ["French fries", "g", 30000, 10000, 15000, 8],
    ["Cheddar cheese", "g", 6000, 2000, 3000, 28],
    ["Tomatoes", "g", 10000, 3000, 5000, 6],
    ["Lettuce", "g", 5000, 1500, 2500, 5],
    ["Coffee beans", "g", 8000, 2500, 4000, 32],
    ["Milk", "ml", 20000, 7000, 10000, 4],
  ];
  const inventoryByBranch = new Map();
  for (const branch of branches) {
    const items = new Map();
    for (const [name, unit, openingBalance, minimumStock, reorderLevel, cost] of inventoryDefinitions) {
      const item = await upsertBy(InventoryItem, { organizationId: organization._id, branchId: branch._id, name }, {
        organizationId: organization._id, branchId: branch._id, name, unit,
        quantityOnHand: openingBalance, minimumStock, reorderLevel, averageUnitCostMinor: cost,
      });
      items.set(name, item);
      await StockMovement.updateOne(
        { organizationId: organization._id, branchId: branch._id, inventoryItemId: item._id, type: "OPENING_BALANCE" },
        { $setOnInsert: {
          organizationId: organization._id, branchId: branch._id, inventoryItemId: item._id,
          type: "OPENING_BALANCE", quantity: openingBalance, unitCostMinor: cost,
          reference: { kind: "MANUAL" }, note: "Initial restaurant seed stock", performedBy: owner._id,
        } },
        { upsert: true }
      );
    }
    inventoryByBranch.set(String(branch._id), items);
  }

  const productDefinitions = [
    { category: "Breakfast", name: "Maranga Breakfast Plate", description: "Two eggs, toast, grilled tomato, and fries.", station: "hot-line", price: 65000, recipe: [["Eggs", 2, "unit"], ["French fries", 120, "g"], ["Tomatoes", 80, "g"]] },
    { category: "Mains", name: "Grilled Chicken Rice", description: "Marinated grilled chicken with rice and seasonal salad.", station: "grill", price: 95000, recipe: [["Chicken breast", 220, "g"], ["Tomatoes", 60, "g"], ["Lettuce", 40, "g"]] },
    { category: "Burgers", name: "Westlands Beef Burger", description: "Beef patty, cheddar, lettuce, tomato, and house sauce.", station: "grill", price: 85000, recipe: [["Beef mince", 160, "g"], ["Burger buns", 1, "unit"], ["Cheddar cheese", 20, "g"], ["Tomatoes", 30, "g"], ["Lettuce", 20, "g"]] },
    { category: "Sides", name: "Seasoned Fries", description: "Crispy fries with house seasoning.", station: "hot-line", price: 30000, recipe: [["French fries", 180, "g"]] },
    { category: "Drinks", name: "House Latte", description: "Espresso with steamed milk.", station: "bar", price: 35000, recipe: [["Coffee beans", 18, "g"], ["Milk", 180, "ml"]] },
  ];
  for (const definition of productDefinitions) {
    const recipe = definition.recipe.map(([name, quantity, unit]) => ({
      inventoryItemId: inventoryByBranch.get(String(branches[0]._id)).get(name)._id,
      quantity,
      unit,
    }));
    await upsertBy(Product, { organizationId: organization._id, name: definition.name }, {
      organizationId: organization._id,
      categoryId: categories[definition.category]._id,
      name: definition.name,
      description: definition.description,
      variants: [{ name: "Regular", priceMinor: definition.price, isDefault: true }],
      modifierGroups: [],
      recipe,
      kitchenStation: definition.station,
      isActive: true,
    });
  }

  console.log(`Restaurant seeded: ${organization.name}`);
  console.log(`Super Admin login: ${platformAdminEmail}`);
  console.log(`Restaurant owner login: ${restaurantOwnerEmail}`);
  console.log(`Branches: ${branches.map((branch) => branch.code).join(", ")}`);
  console.log(`Menu items: ${productDefinitions.length}; inventory items per branch: ${inventoryDefinitions.length}`);
  console.log("Open http://localhost:3000/login to sign in.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await mongoose.disconnect();
});
