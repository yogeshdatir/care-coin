# React Patterns Learned

Reusable UI/architecture patterns discovered while building real features — kept here so decisions aren't relitigated and each pattern is recognizable next time it applies, regardless of which project surfaced it.

**Contents**

1. [Inline "search or create" (creatable combobox)](#pattern-inline-search-or-create-creatable-combobox)
2. [Derive a union type from an array (single source of truth)](#pattern-derive-a-union-type-from-an-array-single-source-of-truth)
3. [`interface` vs `type` — when to use which](#pattern-interface-vs-type--when-to-use-which)
4. [shadcn Field hierarchy](#pattern-shadcn-field-hierarchy)
5. [Don't reset form state via a useEffect watching an id](#pattern-dont-reset-form-state-via-a-useeffect-watching-an-id)
6. [Separate form values from the API payload](#pattern-separate-form-values-from-the-api-payload)
7. [Dependent fields](#pattern-dependent-fields)
8. [react-hook-form gotchas](#pattern-react-hook-form-gotchas)
9. [One form, two submit actions](#pattern-one-form-two-submit-actions)
10. [A transient highlight for the row just saved](#pattern-a-transient-highlight-for-the-row-just-saved)
11. [Suggestions from data you already have](#pattern-suggestions-from-data-you-already-have)

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

**Variant: options with labels**: when each value also needs a display label, declare `{ value, label }` items with `as const satisfies readonly OptionItem[]` and derive the type from the values.

```ts
export const EXPENSE_CATEGORIES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'medicines', label: 'Medicines' },
] as const satisfies readonly OptionItem[];

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['value'];
```

A `: OptionItem[]` annotation instead of `satisfies` widens `value` to `string`, and the derived union collapses to `string`.

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

---

## Pattern: separate form values from the API payload

**Problem**: Inputs need strings and sometimes UI-only fields (a medicine select that only filters the variant list), but the API wants numbers, absent optional fields and no UI-only data. Using the API type as the form type forces casts, and `reset(apiObject)` breaks on the mismatch.

**Solution**: two types and two small pure mappers.

```ts
interface ExpenseFormValues {
  amount: string; // inputs hold strings
  medicineId: string; // UI-only: filters variants, never sent
  linkedMedicineVariantId: string; // '' = not set
  // ...
}

// explicit field list, so a UI-only field cannot leak into the request
const toExpensePayload = (
  v: ExpenseFormValues,
): CreateExpenseRequestPayload => ({
  /* ... */
});

// derives the UI-only field from saved data (medicine from the variant)
const toExpenseFormValues = (
  e: Expense,
  medicines: Medicine[],
): ExpenseFormValues => ({
  /* ... */
});
```

| Rule                                                                                 | Why                                                                           |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Never `reset()` with an API object                                                   | Types differ (`number` vs `string`, optional vs `''`), and it is a type error |
| `''` means "unset" in the form; the mapper turns it into `undefined`                 | Inputs stay controlled                                                        |
| Drop dependent values in the mapper (a variant when the category is not `medicines`) | A stale value cannot be sent after the user changes a parent field            |
| Keep the mappers pure and unit-test them                                             | Plain Vitest, no DOM                                                          |

**Where else this applies**: any form whose editing shape differs from its stored shape (numbers and dates as strings, a parent select that only narrows a child).

---

## Pattern: dependent fields

**Problem**: A child field (variant) depends on a parent (medicine). Hiding it until the parent is set makes the layout jump; leaving it live allows invalid combinations.

| Decision        | Detail                                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visibility      | Keep it visible but **disabled** until the parent has a value                                                                                                        |
| Hint            | Helper text (`FieldDescription`) that changes with state ("Select or create a medicine first"), not a tooltip: disabled controls do not fire hover or focus          |
| Parent changes  | Clear **only the child**: `field.onChange(parent); setValue('child', '')`. Calling `setValue` on the field you just set blanks it                                    |
| One option only | Auto-select it, using a pure helper that counts active options (`getDefaultVariantId(medicine)`)                                                                     |
| Required        | If a missing child loses information, make it required unconditionally and let the user create the first option inline, rather than "required only if options exist" |
| Disabling       | Pass `disabled` to the child component, **not** to `<Controller disabled>` (see the gotchas below)                                                                   |

---

## Pattern: react-hook-form gotchas

| Symptom                                                               | Cause                                                                                | Fix                                                                                                                                     |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `Cannot read properties of null (reading '_names')`                   | `Controller` outside a `FormProvider` with no `control` (`useFormContext()` is null) | Pass `control={control}`, or wrap in `FormProvider`                                                                                     |
| A field blanks right after the user picks a value                     | `setValue` on the same field after `field.onChange`                                  | Clear the dependent field instead                                                                                                       |
| A disabled field's value is `undefined` and its validation is skipped | `disabled` on `<Controller>`                                                         | Pass `disabled` to the component                                                                                                        |
| `setFocus` does nothing, with no error                                | The ref never reaches a DOM input (custom `Input`, `customInput`)                    | Forward `field.ref` (`ref`, or `getInputRef` for some libraries). After `reset`, defer: `requestAnimationFrame(() => setFocus('name'))` |
| A third-party input breaks when you spread `{...field}`               | Its `onChange` is `(value, ...)`, not an event                                       | Wire props by hand: `onChange={(v) => field.onChange(v ?? '')}`. Keep the form value a plain string                                     |
| A value set by `reset` does not show in a combobox                    | It keeps its own display text                                                        | Remount with `key`, or sync with an effect (see the creatable combobox)                                                                 |
| A value used for rendering is stale                                   | `getValues()` does not re-render                                                     | Use `useWatch`                                                                                                                          |

---

## Pattern: one form, two submit actions

**Problem**: "Save" and "Save & add another" should share validation and the same `onSubmit`, and Enter should still work.

**Solution**: both buttons are `type="submit"`; the second carries `name="intent" value="add-another"`. The handler reads which button was pressed.

```tsx
const handleSave: SubmitHandler<Values> = async (data, event) => {
  const submitter = (event?.nativeEvent as SubmitEvent | undefined)
    ?.submitter as HTMLButtonElement | null;
  await save(data);
  if (submitter?.value === 'add-another') {
    reset(toAddAnotherValues(data)); // pure helper: lists the carried-over fields
    requestAnimationFrame(() => setFocus('amount'));
  } else {
    reset(EMPTY);
  }
};
```

- Put plain Save **first**: Enter submits using the first submit button, so it takes the plain path.
- `handleSubmit(fn)` passes the event as the second argument, and `nativeEvent.submitter` is supported in current browsers (Safari 15.4+).
- Hide "add another" while editing; disable both buttons while `isSubmitting` to prevent double creates.
- If `save` throws, nothing resets, so the user's input survives.

---

## Pattern: a transient highlight for the row just saved

**Problem**: After adding or editing, sorting can move the row out of sight, and the list is often below the fold.

**Solution**: a small hook that flashes an id, and a presentational row prop.

```ts
const { highlight, flash } = useHighlight(4000); // { id, kind: 'added' | 'updated' } | null
// after a save: flash(saved.id, 'added')
// row: <TableRow className={cn('duration-700', kind && 'bg-primary/10')}> + <Badge>New</Badge>
```

- The hook clears its timer when it flashes again and on unmount. Test it with fake timers.
- Use a badge as well as colour. Do not scroll to the row, because rapid-entry flows should stay at the form; show an inline confirmation near the buttons (`role="status"`) instead.

---

## Pattern: suggestions from data you already have

**Problem**: Free-text fields (a test or item name) get retyped repeatedly.

**Solution**: a native `<datalist>` fed by a pure helper over the already-loaded records.

```tsx
<Input list="description-suggestions" maxLength={200} {...register('description')} />
<datalist id="description-suggestions">
  {suggestions.map((s) => <option key={s} value={s} />)}
</datalist>
```

- The helper counts case-insensitively, filters by the current category, sorts by frequency and takes the top N (`getDescriptionSuggestions(expenses, category)`).
- No new API, but it only sees loaded rows and cannot be styled. Upgrade to a combobox only if you need styling.
- Use `maxLength` for text inputs: `max` does nothing on `type="text"`.

---
