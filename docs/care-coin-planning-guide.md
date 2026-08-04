# CareCoin — Planning & Architecture Guide

**Contents**

1. [About the project](#1-about-the-project)
2. [Schema (data model)](#2-schema-data-model)
3. [MFE architecture](#3-mfe-architecture)
4. [Folder structure](#4-folder-structure)
5. [Sidebar / pages nav list](#5-sidebar--pages-nav-list)
6. [Routing guide](#6-routing-guide)

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

**Medicine** — catalog of stable facts about the drug, deduped by name + form
| Field | Notes |
|---|---|
| `id` | PK |
| `userId` | FK |
| `name` | |
| `form` | `'tablet' \| 'syrup' \| ...` |
| `strengthOptions?` | |

**Prescription**
| Field | Notes |
|---|---|
| `id` | PK |
| `userId` | FK |
| `doctorName` | |
| `date` | when the doctor issued the prescription |
| `notes?` | |
| `imageUrl?` | |

**PrescriptionMedicine** — join entity, one row per medicine per prescription
| Field | Notes |
|---|---|
| `id` | PK |
| `prescriptionId` | FK |
| `medicineId` | FK |
| `dosage` | |
| `frequency` | |
| `stockCount` | |
| `startDate` | when this medicine begins — may differ from `Prescription.date` |
| `endDate?` | |

**Expense**
| Field | Notes |
|---|---|
| `id` | PK |
| `userId` | FK |
| `amount` | |
| `date` | |
| `category` | |
| `domain` | `'health' \| 'general'` — `'general'` arrives in v2 |
| `linkedPrescriptionId?` | |
| `linkedMedicineId?` | |
| `receiptUrl?` | |

**ExpenseCategory** (v2)
| Field | Notes |
|---|---|
| `id` | PK |
| `name` | |
| `domain` | `'health' \| 'general'` |

### Relationships

```mermaid
erDiagram
  USER ||--o{ PRESCRIPTION : has
  USER ||--o{ EXPENSE : logs
  USER ||--o{ MEDICINE : catalogs
  PRESCRIPTION ||--o{ PRESCRIPTION_MEDICINE : contains
  MEDICINE ||--o{ PRESCRIPTION_MEDICINE : "prescribed as"
  PRESCRIPTION_MEDICINE ||--o{ EXPENSE : "linked to"
  USER {
    string id PK
    string name
    string mode
  }
  MEDICINE {
    string id PK
    string name
    string form
  }
  PRESCRIPTION {
    string id PK
    string doctorName
    date date
  }
  PRESCRIPTION_MEDICINE {
    string id PK
    string prescriptionId FK
    string medicineId FK
    string dosage
    string frequency
    int stockCount
  }
  EXPENSE {
    string id PK
    number amount
    string domain
    string linkedPrescriptionMedicineId FK
  }
```

### Design notes

- Dosage, frequency, and stock live on `PrescriptionMedicine`, not `Medicine` — the same drug can be prescribed differently across prescriptions (dose changes over time), so these are per-prescription facts, not drug facts.
- `Medicine detail` page reads _current_ dosage/frequency from the latest `PrescriptionMedicine` row, and shows the full history by listing all rows across prescriptions for that `medicineId`.
- `Expense.domain` exists from v1 even though only `'health'` is used — avoids a migration when v2 adds general expenses.
- Foreign keys (`prescriptionId`, `linkedMedicineId`, etc.) are the only coupling between Health and Expense entities — keep it that way so each domain can own its own store independently.
- `userId` on `Medicine`, `Prescription`, and `Expense` is kept in the schema now (cheap insurance) but not populated/used in v1 — avoids a migration touching every table if multi-user is added later.
- `mode` is an app-level setting (local storage / `AppSettings` singleton) in v1/v2, not read from `User`, since there's no `User` row yet. Move it onto `User` only when multi-user actually lands.

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

| Route                | Resolves to                                                  |
| -------------------- | ------------------------------------------------------------ |
| `/`                  | Dashboard (host)                                             |
| `/medicines`         | List (health module)                                         |
| `/medicines/:id`     | Detail — dosage/frequency history via `PrescriptionMedicine` |
| `/prescriptions`     | List (health module)                                         |
| `/prescriptions/:id` | Detail                                                       |
| `/expenses`          | List (health module, `domain=health`, v1)                    |
| `/expenses/general`  | List (expense module, `domain=general`, v2)                  |
| `/expenses/:id`      | Detail (either module, resolved by `domain`)                 |
| `/settings`          | Host                                                         |

**Guidelines**

- Each module owns its own route sub-tree and exports a route config object — the host imports and merges these, never hardcodes a module's internal paths.
- Routes are lazy-loaded (`React.lazy`) per module folder now, so swapping a lazy import for a Module Federation remote import later is a one-line change.
- Mode context (from Settings/onboarding) gates which route configs the host merges in — not the router itself, so no route guards needed in v1/v2.
- `/expenses/:id` needs a `domain` param or lookup to route to the correct module's detail component once both exist (v2+).
