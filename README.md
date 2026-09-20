# Restaurant OS — foundation + three portals + one operational vertical slice

This is a starting codebase for the multi-branch restaurant management/POS
platform, not the finished 50+ module system — that's realistically months
of work for a team. What's here is the **architectural foundation** every
module sits on, organized into the **three portals** a multi-tenant
restaurant SaaS actually needs, plus **one fully wired operational slice**
(auth → POS → order → kitchen → customer display → inventory → reports)
built to the platform spec's own completion standard.

## The three portals

| Portal | Route | Who | Session |
|---|---|---|---|
| **Super Admin** | `/super-admin/*` | Platform staff (you, running the SaaS) — sees every tenant | Separate `PlatformAdmin` model + separate signed cookie (`platform-auth.ts`). Structurally cannot be confused with a tenant session. |
| **Restaurant Admin** | `/admin/*` | An organization's owner/head office — cross-branch | Tenant session, gated by the `settings.manage` permission in the layout |
| **Shop (branch) portal** | `/dashboard`, `/pos`, `/kitchen`, `/inventory`, `/reports`, `/display/[id]` | Branch staff — cashiers, kitchen, branch managers | Tenant session, scoped to `activeBranchId`; a branch switcher appears for anyone assigned to more than one branch |

There's no self-registration for Super Admin — see
`scripts/create-platform-admin.mjs`. Restaurant Admin and the Shop portal
share one tenant session; what a user can reach depends entirely on their
role's permissions (`src/types/permissions.ts`), re-checked from the
database on every request.

## What's actually implemented end-to-end

- **Multi-tenant data model**: Organization → Branch → Users/Roles, with
  every branch-scoped collection carrying `organizationId` + `branchId` and
  compound indexes on the fields the spec called out. Every model
  referenced by `ref:` actually exists (`Customer`, `Supplier`,
  `CashierSession`, `PlatformAdmin` included) — nothing dangling.
- **Auth & RBAC**: password hashing, signed session cookies (`jose`,
  edge-compatible), and a `loadAuthContext()` that re-reads the user's role
  *and organization active status* from the database on every request —
  permissions (and a platform-admin suspension) are never trusted from the
  client, the token, or a stale check.
- **Platform admin**: suspend/reactivate any organization from
  `/super-admin/organizations/[id]`; suspension takes effect on the
  tenant's very next request via the `Organization.isActive` check in
  `loadAuthContext`.
- **Restaurant admin**: branch CRUD, org-wide settings (currency, timezone,
  tax, service charge), user invitations with role + branch assignment, and
  a cross-branch "today" comparison table.
- **Branch switching**: any user assigned to more than one branch (or with
  org-wide access) gets a switcher in the Shop portal sidebar; switching
  re-scopes `activeBranchId` on the session, and every service re-checks
  `requireBranchAccess` regardless of what the client sends.
- **Order lifecycle**: a single `ORDER_STATUS_TRANSITIONS` map (plus the
  pure `canTransition()` helper) is the only source of truth for legal
  status changes, enforced in `OrderService.transitionStatus`. Covered by
  unit tests in `tests/`.
- **Server-priced POS**: the client only sends product/variant/modifier
  *selections* — `OrderService.createOrder` computes every price from the
  current `Product` record and generates a per-branch, per-day sequential
  order number via an atomic counter. Idempotency keys prevent duplicate
  orders on a retried submit.
- **Inventory**: `/inventory` lists stock and lets branch staff add items
  and record adjustments/waste/opening-balance/returns.
  `InventoryService.applyMovement` never overwrites `quantityOnHand`
  directly — it writes a `StockMovement` ledger row and adjusts the cached
  quantity in the same transaction. Kitchen "start preparing" automatically
  consumes each item's recipe the same way.
- **Reports**: `/reports` gives a date-range sales summary (completed
  orders, revenue, cancellations, top products) for the active branch;
  `/admin` gives the cross-branch version for today.
- **Audit logging**: `AuditService.record` is the only writer to
  `AuditLog`; order creation/status changes, branch/org/user edits all go
  through it.
- **Kitchen Display + Customer Display**: `/kitchen` and `/display/[id]`
  render from real queries against the same `Order` collection the POS
  writes to.

## What's deliberately stubbed, not faked

- **Realtime transport** (`src/lib/realtime.ts`): event names, channel
  scoping, and publish call-sites are real; the actual Ably/Pusher/
  Socket.IO network call is a marked integration point, since this sandbox
  has no outbound network access to verify a subscription against. The KDS
  and displays currently poll every 5–8s — swap the `setInterval` for a
  channel subscription once a provider is wired in, no other code changes
  needed.
- **Cloudinary media storage**: restaurant logos uploaded during onboarding
  are sent through the signed server-side Cloudinary API and stored as secure
  delivery URLs. Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
  `CLOUDINARY_API_SECRET` to `.env.local` before uploading images. Product
  images and digital-signage assets can use the same wrapper next.
- **Email, Upstash, QR, PDF**: listed in `.env.example` and `package.json`;
  their provider wrappers are still pending. User invites currently take a
  typed temporary password instead of emailing a set-password link.
- **Digital signage content** on the customer display is a hardcoded
  sample array, standing in for the Signage module.
- **Purchasing**: `Supplier` model exists; purchase orders/goods-received
  flow (which would create `PURCHASE` stock movements) is not built yet.

## Design notes

Palette and type choices are in `tailwind.config.ts` — a warm charcoal
ink/paper pairing (not pure black/white, for kitchen lighting and long POS
shifts) with a single "ember" accent reserved for primary actions, plus
semantic status colors used identically across every portal so staff build
one set of muscle memory. The Super Admin portal is deliberately styled
darker/starker than the tenant portals so it's never visually confusable
with a tenant screen.

## Running it

This container has no outbound network access, so dependencies were never
installed here — pull this down and run it in your own environment:

```bash
cp .env.example .env.local   # fill in MONGODB_URI and AUTH_SECRET at minimum
npm install
npm run dev
npm run test                              # order-transition unit tests, no DB needed
npm run create-platform-admin -- "Jane Doe" jane@yourco.com "a-strong-password"
npm run seed-restaurant -- "super-admin-password" # seeds J Maranga Restaurant
```

The restaurant seed creates the Super Admin account `jmaranga35@gmail.com`,
a separate restaurant owner account (`owner@jmaranga-restaurant.local` by
default), two Nairobi branches, default categories, five menu items with
recipes, branch inventory, and opening-balance ledger entries. It is
idempotent and can be run again after changing the seed data. The command
argument (or `SEED_ADMIN_PASSWORD`) seeds the Super Admin password. The demo
restaurant owner uses the fixed seeded password defined in the seed script.
Set `SEED_OWNER_EMAIL` if you want a different restaurant owner email.

Then:
1. Visit `/register` to create your first organization + owner user (this
   becomes a Restaurant Admin).
2. Visit `/super-admin/login` with the platform-admin credentials you just
   created to see it listed.
3. As the owner, add a branch under `/admin/branches`, then sign in as that
   user and use the branch switcher (or `/pos`, `/kitchen`) directly.

## Suggested next slice

Pick one and the same end-to-end pattern (model → validation → repository
→ service → action → UI → audit → tests) repeats:

1. **Purchasing** — `Supplier` exists; add `PurchaseOrder` +
   request→approve→receive workflow feeding `InventoryService.applyMovement`.
2. **CRM/loyalty** — `Customer` model exists and `Order.customerId` is
   already wired; add customer search in the POS and a loyalty-points rule.
3. **Payments abstraction** — `Order.payments[]` exists; needs a pluggable
   `PaymentProvider` interface mirroring `RealtimeProvider` in
   `src/lib/realtime.ts`.
4. **Employees/shifts** — `CashierSession` exists (open/close a till);
   add shift scheduling and attendance on top of it.
