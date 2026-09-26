# React Patterns Learned

Reusable UI/architecture patterns discovered while building real features — kept here so decisions aren't relitigated and each pattern is recognizable next time it applies, regardless of which project surfaced it.

**Contents**

1. [Inline "search or create" (creatable combobox)](#pattern-inline-search-or-create-creatable-combobox)
2. [Derive a union type from an array (single source of truth)](#pattern-derive-a-union-type-from-an-array-single-source-of-truth)
3. [`interface` vs `type` — when to use which](#pattern-interface-vs-type--when-to-use-which)
4. [shadcn Field hierarchy](#pattern-shadcn-field-hierarchy)
5. [Don't reset form state via a useEffect watching an id](#pattern-dont-reset-form-state-via-a-useeffect-watching-an-id)

---

## Pattern: inline "search or create" (creatable combobox)

**Problem**: A form needs a reference to a catalog-style entity (e.g. a dropdown selection), but the entity the user wants doesn't exist yet. Forcing them to leave the form to create it first breaks flow.

**First seen in**: CareCoin — Prescription form needing a `Medicine` reference.

**Solution**: Combobox that searches existing records as you type, and offers **"+ Create '{typed text}'"** when nothing matches — selecting it creates the record inline and auto-selects it, no navigation or reload.

| Aspect                                         | Decision                                                                                           | Reasoning                                                                                                                          |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| UI component                                   | shadcn `Combobox` (built on `cmd`/cmdk)                                                            | Native support for search + create pattern, no custom build                                                                        |
| Ownership                                      | Component lives in the feature that owns the created entity, consumed by the feature that needs it | Consuming an exported component isn't the same as reaching into another feature's internals — keeps feature boundaries intact      |
| When the record is created                     | Immediately, into the real store — not held in local form state                                    | The catalog entity is independent of the form that referenced it; survives if the form is abandoned                                |
| Duplicate prevention                           | Handled by the search step surfacing near-matches before "create new" is offered                   | UI-level prevention, not a DB constraint — cheaper and good enough for most cases                                                  |
| Data completeness at creation                  | Name-only quick-create; other fields editable later from the entity's own detail page              | Optimizes for speed of the common path; incomplete-but-fixable beats slow-but-complete                                             |
| Abandoned creates (user backs out of the form) | Left as-is, not cleaned up                                                                         | An empty-history record is harmless clutter, not a correctness bug — not worth the complexity of tracking "was this actually used" |

**Where else this applies**: any form referencing a catalog-style entity that's cheaper to create ad hoc than to force pre-creation — e.g. an `ExpenseCategory` when logging an expense, a `Tag`, a `Supplier`, a `Doctor`/contact entity.

**Variant**: same pattern also works to _append to an array field on an existing entity_, not just create a whole new entity. E.g. `Medicine.strengthOptions: string[]` — typing a new strength in the Prescription form offers "+ Add as a strength option," appending to the array instead of creating a new record.

---

## Pattern: derive a union type from an array (single source of truth)

**Problem**: A fixed set of allowed string values (e.g. dropdown options) is needed both as a runtime array (to render `<Select>` options) and as a compile-time union type (for type-checking). Writing them separately risks the two drifting out of sync.

**Solution**: Declare the array once with `as const`, derive the type from it.

```ts
export const MEDICINE_FORMS = [
  'tablet',
  'capsule',
  'syrup',
  'drops',
  'injection',
  'cream',
  'patch',
  'inhaler',
] as const;

export type MedicineForm = (typeof MEDICINE_FORMS)[number];
// equivalent to: 'tablet' | 'capsule' | 'syrup' | 'drops' | 'injection' | 'cream' | 'patch' | 'inhaler'
```

**How it works**:

- `as const` tells TypeScript to infer the array as a readonly tuple of literal strings, not a generic `string[]`
- `typeof MEDICINE_FORMS[number]` reads "the type of any element in this array" — TypeScript turns that into a union of the literal values
- Adding/removing a value only requires editing the array — the type updates automatically, nothing to keep in sync manually

**Usage**:

```ts
interface Medicine {
  form?: MedicineForm; // type-checked against the union
}

// runtime: render options directly from the same array
MEDICINE_FORMS.map(f => <SelectItem value={f}>{f}</SelectItem>)
```

**Where else this applies**: any fixed set of string literals used both as dropdown/select options and as a type — status enums, category lists, role names, etc.

---

## Pattern: `interface` vs `type` — when to use which

**Problem**: TypeScript lets you define object shapes with either `interface` or `type`, and it's easy to use them inconsistently with no clear rule.

**Rule**: `interface` for object/entity shapes. `type` for everything else (unions, derived/mapped types, tuples, function signatures).

| Use `interface` when...                                                          | Use `type` when...                                                            |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Defining an object/entity shape (`Medicine`, `MedicineVariant`, component props) | Defining a union (`'health' \| 'expense' \| 'both'`)                          |
| It might need to be extended later (`interface Doctor extends Person`)           | Deriving/mapping from another type (`Omit<...>`, `Pick<...>`, `Partial<...>`) |
| You want declaration merging (e.g. augmenting a third-party/global type)         | Defining tuples, function signatures, or primitives                           |

**Why not just use `type` everywhere**: you technically can — `type` can express object shapes identically, and for a small single-dev project there's no practical downside either way. The reasons to still split by convention:

- **Unions cannot be `interface`** — this one is a hard technical constraint, not a preference.
- **Declaration merging** only works with `interface` — same name declared twice merges automatically, which matters when extending third-party or global types (e.g. augmenting an Express `Request`). A `type` would just conflict instead of merging.
- Beyond those two, it's convention (readability, matches common codebase style) rather than capability — worth following for consistency in a codebase that will grow, even though nothing breaks if you don't.

**Applied**: entity shapes (`Medicine`, `Doctor`, `Prescription`) → `interface`. Unions (`MedicineForm`) and derived request/response shapes (`CreateMedicineRequestPayload = Omit<Medicine, 'id'> & {...}`) → `type`.

---

## Pattern: shadcn Field hierarchy

**Nesting**: `FieldSet > FieldGroup > Field` — but `FieldSet` is opt-in, not required at the top.

| Component                  | Use for                                                                                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Field`                    | Always — one control (label + input + description/error), never a raw `<input>`                                                                                  |
| `FieldGroup`               | Whenever 2+ fields exist — layout/spacing only, no semantic meaning                                                                                              |
| `FieldSet` + `FieldLegend` | Only when a set of fields is a genuine logical unit (e.g. "Address": street + city + postal code) — semantic `<fieldset>`/`<legend>`, matters for screen readers |

**Default**: `FieldGroup > Field` for most forms. Add `FieldSet` per distinct section only when the grouping is real, not for every form as a top-level wrapper.

---

## Pattern: don't reset form state via a `useEffect` watching an id

**Problem**: An "edit" flow sets `editingId` state on click, then a `useEffect` watches `editingId` and calls `form.reset(record)` when it changes. This is React's own documented anti-pattern — "adjusting state in response to a prop/state change" — done via an effect when it could be done directly in the event handler that caused the change.

```tsx
// Anti-pattern
const handleEdit = (id) => setEditingId(id);

useEffect(() => {
  if (editingId) {
    const record = items.find((i) => i.id === editingId);
    if (record) reset(record);
  }
}, [editingId, items, reset]);
```

**Why it's a real problem, not just style**:

- Extra render cycle — click sets state, effect fires afterward, _then_ resets the form (two renders instead of one).
- `items` (or similar) in the dependency array means the effect **re-fires whenever the list updates for any reason** — including right after a save — potentially re-resetting the form and wiping in-progress edits, even when `editingId` itself didn't change.
- This is the specific case React's docs call "You Might Not Need an Effect."

**Fix**: do the lookup and reset directly in the click handler — you already have everything needed at that exact moment, no need to defer it.

```tsx
const handleEdit = (id) => {
  const record = items.find((i) => i.id === id);
  if (record) {
    reset(record);
    setEditingId(id);
  }
};
```

Delete the `useEffect` entirely. One render, no stale-dependency risk, no indirection.

**Note on tooling**: the relevant ESLint/React Compiler rule for this (`setState` inside an effect) has **incomplete coverage** — it flagged this exact bug in one file but not in a near-identical file with a slightly different effect shape (three branches vs. one, a wrapped `handleFormReset` vs. inline `reset`). Don't treat "no lint warning" as evidence the pattern is absent — check the actual shape (effect reacting to state, calling setState inside) regardless of whether a tool flags it.

**Where else this applies**: any "select something to edit" flow — Doctors, Medicines, Prescriptions all had this same shape in this project. Check any future edit flow for the same effect-watching-an-id pattern before assuming a new one is safe.

**Companion note — when a `useEffect` for this _is_ legitimate**: the fix above works because the code causing the change (a click handler) is something you own and can put the `setState` into directly. That's not always true. A reusable component (e.g. a combobox) that receives a `value` prop has no handler for the moment that prop changes from outside — it might change because a parent form called `reset()`, and the component has no visibility into that event at all. In that case, syncing internal display state to the external `value` via `useEffect` is the documented, correct use of an effect — there's no "handler" to move the logic into, because the component didn't cause the change.

```tsx
// Legitimate — no handler exists for "value changed externally"
const selected = options.find((o) => getOptionValue(o) === value) ?? null;

useEffect(() => {
  setInputValue(selected ? getOptionLabel(selected) : '');
}, [selected, getOptionLabel]);
```

**The distinguishing question**: _do I control the event that caused this change?_ If yes (a click handler in your own component) → move the state update into that handler, don't use an effect. If no (a prop changed for reasons outside this component's knowledge) → an effect syncing to that prop is appropriate.
