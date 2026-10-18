# CareCoin — Planning & Architecture Guide

**Contents**

1. [About the project](#1-about-the-project)
2. [Schema (data model)](#2-schema-data-model)
3. [MFE architecture](#3-mfe-architecture)
4. [Folder structure](#4-folder-structure)
5. [Sidebar / pages nav list](#5-sidebar--pages-nav-list)
6. [Routing guide](#6-routing-guide)
7. [Expenses page (v1)](#7-expenses-page-v1)

---

## 1. About the project

A personal health tracker starting as a single app, built so it can split into independently deployable micro-frontends (MFEs) without a rewrite.

| Version | Scope                                                                                         |
| ------- | --------------------------------------------------------------------------------------------- |
| v1      | Medicine tracker + prescriptions + medical expenses (single React app)                        |
| v2      | General expense manager added as a second domain                                              |
| v3      | User picks mode at onboarding — Health / Expense / Both — nav and dashboard adapt accordingly |

**Why MFE-ready now**: Health and Expense are already modeled as separate domains in v1. Structuring folders/data/routing along that seam today means extracting either into its own remote later is a config change, not a refactor.

**Stack**: React + TypeScript, Vite, React Router, shadcn/ui, Yarn workspaces, Jest + RTL.

---

## 2. Schema (data model)

### Entities

> **v1 note**: single-user app for now — `User` entity and `userId` FKs below are kept in the schema but unused (not enforced/queried) until multi-user support is actually needed. `mode` lives as an app-level setting in v1/v2 instead of on `User` — see design notes.

**User** _(reserved — not active until multi-user is needed)_
| Field | Notes |
|---|---|
| `id` | PK |
| `name` | |
| `mode` | `'health' \| 'expense' \| 'both'` — added in v3 |

**Medicine** — catalog of just the drug identity, deduped by name
| Field | Notes |
|---|---|
| `id` | PK |
| `userId` | FK |
| `name` | |
| `sideEffects?` | free text — side effects, allergies, anything worth remembering about this drug; dates included inline by the user if relevant |

**MedicineVariant** — one row per form + strength combination for a medicine
| Field | Notes |
|---|---|
| `id` | PK |
| `medicineId` | FK |
| `form?` | `'tablet' \| 'syrup' \| ...` — optional; unset until filled in via quick-create flow, see pattern doc |
| `strength?` | e.g. `'500mg'`, `'250ml'` — free text; optional for the same reason `form` is — quick-create shouldn't block on knowing both |

**Doctor**
| Field | Notes |
|---|---|
| `id` | PK |
| `userId` | FK |
| `name` | |
| `specialty?` | e.g. "Orthopedic," "General Physician" |
| `clinicName?` | |
| `city?` | disambiguates doctors/clinics across different cities |
| `phone?` | |
| `notes?` | |

**Prescription**
| Field | Notes |
|---|---|
| `id` | PK |
| `userId` | FK |
| `doctorId` | FK — replaces `doctorName` |
| `date` | when the doctor issued the prescription |
| `notes?` | |
| `imageUrl?` | |

**PrescriptionMedicine** — join entity, one row per medicine variant per prescription
| Field | Notes |
|---|---|
| `id` | PK |
| `prescriptionId` | FK |
| `medicineVariantId` | FK — replaces `medicineId`; dosage is implied by the variant's `strength`, not duplicated here |
| `frequency` | |
| `reason?` | free text — symptom/condition this was prescribed for, e.g. "back pain"; enables finding "what did I take last time for X" across prescriptions |
| `startDate` | when this medicine begins — may differ from `Prescription.date` |
| `endDate?` | |

**Expense** — one payment or one receipt item (see design notes)
| Field | Notes |
|---|---|
| `id` | PK |
| `userId` | FK |
| `amount` | `NUMERIC(12,2)`, greater than 0 |
| `date` | |
| `category` | one `value` from the fixed `EXPENSE_CATEGORIES` list (see below); validated at the API, not in the DB |
| `description?` | free text, up to 200 characters — item name or details, e.g. a test name. For display and search, not for grouping |
| `domain` | `'health' \| 'general'` — defaults to `'health'`; `'general'` arrives in v2 |
| `linkedPrescriptionId?` | optional for every category (over-the-counter purchases have none) |
| `linkedMedicineVariantId?` | exactly one variant — required when `category = 'medicines'`, not allowed for other categories. Replaces `linkedMedicineId?`: price tracking needs to know which variant (form + strength) was bought |
| `receiptUrl?` | the same URL repeats on every expense entered from one receipt |

**`EXPENSE_CATEGORIES`** (v1, fixed list in `shared-types`, same `{ value, label }` shape as `MEDICINE_FORMS`)
| `value` | `label` |
|---|---|
| `consultation` | Consultation |
| `medicines` | Medicines |
| `lab-tests` | Lab tests |
| `imaging` | Imaging (X-ray / Scan) |
| `procedure` | Procedure |
| `hospitalization` | Hospitalization |
| `therapy` | Therapy |

**ExpenseCategory** (v2) — replaces the fixed list so users can add their own categories
| Field | Notes |
|---|---|
| `id` | PK |
| `name` | |
| `domain` | `'health' \| 'general'` |

The seven v1 `value` slugs become the first rows, and `Expense.category` becomes a foreign key to this table.

### Relationships

```mermaid
erDiagram
  USER ||--o{ PRESCRIPTION : has
  USER ||--o{ EXPENSE : logs
  USER ||--o{ MEDICINE : catalogs
  USER ||--o{ DOCTOR : knows
  MEDICINE ||--o{ MEDICINE_VARIANT : "comes in"
  DOCTOR ||--o{ PRESCRIPTION : issues
  PRESCRIPTION ||--o{ PRESCRIPTION_MEDICINE : contains
  MEDICINE_VARIANT ||--o{ PRESCRIPTION_MEDICINE : "prescribed as"
  PRESCRIPTION ||--o{ EXPENSE : "paid for"
  MEDICINE_VARIANT ||--o{ EXPENSE : "bought as"
  USER {
    string id PK
    string name
    string mode
  }
  DOCTOR {
    string id PK
    string userId FK
    string name
    string specialty
    string clinicName
    string city
    string phone
    string notes
  }
  MEDICINE {
    string id PK
    string userId FK
    string name
    string sideEffects
  }
  MEDICINE_VARIANT {
    string id PK
    string medicineId FK
    string form
    string strength
  }
  PRESCRIPTION {
    string id PK
    string userId FK
    string doctorId FK
    date date
    string notes
    string imageUrl
  }
  PRESCRIPTION_MEDICINE {
    string id PK
    string prescriptionId FK
    string medicineVariantId FK
    string frequency
    string reason
    date startDate
    date endDate
  }
  EXPENSE {
    string id PK
    string userId FK
    number amount
    date date
    string category
    string description
    string domain
    string linkedPrescriptionId FK
    string linkedMedicineVariantId FK
    string receiptUrl
  }
```

### Design notes

- `Medicine` now holds only drug identity (`name`) — `form`, `strength`, and `price` move together as one unit because they vary together: the same drug in a different form or strength has a different price, so they can't be independent flat fields on `Medicine`.
- `MedicineVariant` is the "SKU" of a medicine — one row per form+strength combination, each with its own `referencePrice`. `PrescriptionMedicine` and `Expense` reference a specific variant, not the medicine directly.
- Dosage is no longer a separate field on `PrescriptionMedicine` — it's implied by `MedicineVariant.strength`, avoiding duplicating the same fact in two places.
- `Medicine detail` page lists its variants (with prices), and shows prescription history by listing `PrescriptionMedicine` rows across all variants of that medicine.
- The quick-create combobox pattern (see `react-patterns-learned.md`) now applies at two levels: create/select a `Medicine`, then create/select a `MedicineVariant` (form + strength) under it — same pattern, one more hop.
- `Expense.domain` exists from v1 even though only `'health'` is used — avoids a migration when v2 adds general expenses.
- **One expense per item.** Each line on a receipt is entered as its own expense, so a pharmacy bill with three medicines is three expenses that share the same `receiptUrl` and date. The receipt itself is evidence, not a record. Split purchases, refills and different quantities are likewise separate expenses, so there is no quantity field.
- **Medicines link to one variant.** A `medicines` expense carries exactly one `linkedMedicineVariantId`, which keeps per-medicine totals, refill counts and price history exact without a join table. One prescription can have many expenses (one medicine here, another there; refills repeat the same prescription and variant with a new date).
- **Categories are a fixed list in v1** (`EXPENSE_CATEGORIES`, validated at the API like `MEDICINE_FORMS`) because a user-editable list needs its own CRUD. It becomes the `ExpenseCategory` table in v2, and the slug values become the first rows.
- **`description` is free text on purpose.** It supports search and filtering by text (`ILIKE`) and shows the item name in the list. Anything that must be grouped or totalled belongs in a structured field (`category`, `date`, `linkedPrescriptionId`, `linkedMedicineVariantId`), because free text varies by spelling and wording.
- **Read responses carry derived names.** The expense list needs `medicineName`, `variantLabel`, the doctor's name and the prescription date. These are server-derived, read-only fields, resolved by joins and omitted from request payloads (the same rule as `doctorName` on prescriptions).
- **v2 options when v1 is outgrown:**
  - Receipt header plus line items table, if bill totals or "everything on this receipt" are needed. Existing rows migrate as one-item receipts.
  - Item catalog (named tests and procedures that expenses link to), if analysis by test or procedure is needed. It fits alongside the `ExpenseCategory` table.
- Foreign keys (`prescriptionId`, `linkedMedicineVariantId`, etc.) are the only coupling between Health and Expense entities — keep it that way so each domain can own its own store independently.
- `userId` on `Medicine`, `Prescription`, and `Expense` is kept in the schema now (cheap insurance) but not populated/used in v1 — avoids a migration touching every table if multi-user is added later.
- `mode` is an app-level setting (local storage / `AppSettings` singleton) in v1/v2, not read from `User`, since there's no `User` row yet. Move it onto `User` only when multi-user actually lands.
- `MedicineVariant.form` is optional, not required — the quick-create combobox only captures the minimum needed at creation time for speed; `form` and `referencePrice` are filled in later from the Medicine detail page. UI should nudge but not block on this being empty.
- `Doctor` is its own entity (not a flat string on `Prescription`) since doctors are reused across prescriptions and their details (specialty, clinic, city) are worth preserving. `city?` exists specifically to disambiguate doctors across multiple cities in the user's history. Same quick-create combobox pattern applies — create/select inline from the Prescription form, other fields filled in later.

---

## 3. MFE architecture

**Pattern**: Host (shell) + Remotes, using Vite Module Federation.

```
Host (shell)
├─ Sidebar, top nav, auth, mode picker, routing shell
├─ Loads remotes dynamically based on active mode
└─ Owns: shared-ui, shared-types, api-client

Remotes (deployed separately, later)
├─ health-remote    → Medicines, Prescriptions, Health Expenses
├─ expense-remote   → General Expenses (v2+)
└─ dashboard-remote → Combined summary (v3, reads from both)
```

| Stage                        | What happens                                                                                                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1–v2                        | Everything lives in one Vite app but is _organized_ as if each remote were separate (own folder, own local state, no cross-imports except through `shared-types` / `shared-ui`)     |
| v3 trigger to actually split | When a domain needs independent deploys, scaling, or a separate team — swap its folder into a real Module Federation remote; the host's dynamic import boundary is already in place |
| Shared contracts             | `shared-types` (schema above) and `shared-ui` (design system) are the only things both host and remotes import from                                                                 |

**Open gap**: `dashboard-remote` (v3, combined summary) has no home in section 4 yet — until v3, house it under `core/app/` since it reads from both features and belongs to the shell.

---

## 4. Folder structure

Single Vite app for now (v1/v2) — `apps/` + `packages/` workspace split from section 3 only kicks in at the v3 MFE split. Until then, the same boundaries are enforced _inside_ `src/`.

```
carecoin/
└─ src/
   ├─ assets/                  # icons, images, fonts
   │
   ├─ core/                    # host/shell concerns — becomes apps/host at v3
   │  ├─ app/                  # root App, providers, mode context
   │  ├─ layout/                # Sidebar, TopNav, PageShell
   │  └─ routes/                # route config, lazy-loaded feature entries
   │
   ├─ features/                # domain modules — each becomes its own remote at v3
   │  ├─ health/                # → apps/health-remote (v3)
   │  │  ├─ medicines/          # components, hooks, store, tests
   │  │  ├─ prescriptions/
   │  │  └─ expenses/           # domain: 'health'
   │  └─ expense/                # → apps/expense-remote (v3, added in v2)
   │
   ├─ shared/                  # → packages/shared-* (v3)
   │  ├─ types/                 # schema/interfaces (section 2)
   │  ├─ ui/                     # shadcn/ui-based components, design tokens
   │  └─ api/                    # fetch/query layer, one client per feature
   │
   └─ test/                    # test utils, setup, RTL helpers
```

**Rule**: nothing inside `features/health/*` imports from `features/expense/*` or vice versa — only through `shared/types` or `shared/ui`. This is the same boundary as section 3, just living inside one app instead of separate packages — which is exactly what makes the v3 split (`features/health` → `apps/health-remote`) a folder move + federation config, not a rewrite.

---

## 5. Sidebar / pages nav list

| Section          | Icon     | Module  | Visible in mode       |
| ---------------- | -------- | ------- | --------------------- |
| Dashboard        | home     | host    | Health, Expense, Both |
| Medicines        | pill     | health  | Health, Both          |
| Prescriptions    | file     | health  | Health, Both          |
| Health expenses  | receipt  | health  | Health, Both          |
| General expenses | wallet   | expense | Expense, Both (v2+)   |
| Settings         | settings | host    | Health, Expense, Both |

Mode filtering is a single lookup in the host layout — no per-page logic needed.

---

## 6. Routing guide

| Route                | Resolves to                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| `/`                  | Dashboard (host)                                                                       |
| `/medicines`         | List (health module)                                                                   |
| `/medicines/:id`     | Detail — dosage/frequency history via `PrescriptionMedicine`                           |
| `/prescriptions`     | List (health module)                                                                   |
| `/prescriptions/:id` | Detail                                                                                 |
| `/expenses`          | Add/update form on top, list below (health module, `domain=health`, v1)                |
| `/expenses/general`  | List (expense module, `domain=general`, v2)                                            |
| `/expenses/:id`      | Detail (v2+, either module, resolved by `domain`); v1 edits in the form on `/expenses` |
| `/settings`          | Host                                                                                   |

**Guidelines**

- Each module owns its own route sub-tree and exports a route config object — the host imports and merges these, never hardcodes a module's internal paths.
- Routes are lazy-loaded (`React.lazy`) per module folder now, so swapping a lazy import for a Module Federation remote import later is a one-line change.
- Mode context (from Settings/onboarding) gates which route configs the host merges in — not the router itself, so no route guards needed in v1/v2.
- `/expenses/:id` needs a `domain` param or lookup to route to the correct module's detail component once both exist (v2+).

---

## 7. Expenses page (v1)

One page, `/expenses`, with the form on top and the list below.

| Area                        | Behavior                                                                                                                                                                                                                                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Form fields                 | Date, Category (fixed list), Amount, Description (optional), Prescription (optional), Receipt URL (optional)                                                                                                                                                                                                     |
| Add vs update               | The same form. Edit on a list row loads it into the form and the title and button change to "Update expense" with Cancel                                                                                                                                                                                         |
| Medicine and variant        | Shown only when Category = Medicines. The medicine select only filters the variants; only `linkedMedicineVariantId` is submitted, and it is required. Changing the medicine clears the variant, and changing the category away from Medicines clears it in the category's change handler (no effect watching it) |
| List columns                | Date, Category, Item, Prescription, Amount, Receipt, Actions                                                                                                                                                                                                                                                     |
| Item column                 | Medicines: medicine name plus variant label (the description, if any, under it). Other categories: the description                                                                                                                                                                                               |
| Header                      | Count, total and a category filter                                                                                                                                                                                                                                                                               |
| Delete                      | Confirmation first, using the shared delete dialog                                                                                                                                                                                                                                                               |
| Receipts with several items | Enter each item as its own expense. A convenience button, "add another item from this receipt", can keep the date, receipt and prescription and ask only for the medicine and amount                                                                                                                             |

---

**See also**: [`react-patterns-learned.md`](./react-patterns-learned.md) — reusable UI/architecture patterns discovered while building this app (e.g. inline "search or create" comboboxes), kept separate since they apply beyond CareCoin.
