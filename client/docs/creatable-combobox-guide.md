# Creatable Combobox — shadcn + React Hook Form

A combobox that lets the user pick an existing option or create a new one inline, with no page navigation or modal.

---

## 1. Core component

Built on shadcn's `Combobox` primitive family.

```tsx
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/shared/components/ui/combobox';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface CreatableComboboxProps<T> {
  options: T[];
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
  value: string | null;
  onChange: (value: T) => void;
  onCreate: (inputValue: string) => T | Promise<T>;
  createLabel?: (query: string) => string;
  emptyText?: string;
  disabled?: boolean;
  placeholder?: string;
}

function CreatableCombobox<T>({
  options,
  getOptionLabel,
  getOptionValue,
  onChange,
  emptyText = 'No results found.',
  onCreate,
  createLabel = (query) => `Add "${query}"`,
  disabled,
  placeholder,
}: CreatableComboboxProps<T>) {
  const [inputValue, setInputValue] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const trimmed = inputValue.trim();
  const hasExactMatch = options.some(
    (opt) => getOptionLabel(opt).toLowerCase() === trimmed.toLowerCase(),
  );

  const handleCreate = async () => {
    if (!trimmed || isCreating) return;

    setIsCreating(true);
    try {
      const created = await onCreate(trimmed);
      onChange(created);
      setInputValue('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Combobox
      items={options}
      itemToStringLabel={getOptionLabel}
      onValueChange={(next) => next && onChange(next)}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      disabled={disabled}
    >
      <ComboboxInput placeholder={placeholder ?? 'Select an option'} />
      <ComboboxContent>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={getOptionValue(item)} value={item}>
              {getOptionLabel(item)}
            </ComboboxItem>
          )}
        </ComboboxList>
        {!hasExactMatch && trimmed && (
          <div className="border-t">
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating}
              className="flex items-center gap-2 hover:bg-accent px-2 py-1.5 w-full text-sm"
            >
              <Plus className="w-4 h-4" />
              {createLabel(trimmed)}
            </button>
          </div>
        )}
      </ComboboxContent>
    </Combobox>
  );
}
```

**Key conditions**
- The create row's visibility (`!hasExactMatch && trimmed`) must **not** depend on `options.length > 0` — it should appear even with zero existing options (e.g. a brand-new medicine with no variants yet).
- `hasExactMatch` prevents offering "create" when the typed text already matches an option exactly.
- `onCreate` **returns** the created item (`T`, or a `Promise<T>`) — the component calls `onChange(created)` itself, so the caller never has to manually sync selection after creating.
- `isCreating` guards against double-submission and can drive a disabled/loading state on the create row.
- Every prop declared in the interface must also be destructured and actually used — a prop like `placeholder` existing in the type but missing from the destructure (and hardcoded in JSX instead) compiles fine and is easy to miss.

---

## 2. Wiring to React Hook Form

Use `Controller` — the combobox's `value`/`onChange` aren't native form events, so `register` doesn't apply directly. `value` is the field's id (`string | null`); `onChange` receives the full selected/created object, so store just its id in the form.

```tsx
<Controller
  control={control}
  name="medicineId"
  render={({ field }) => (
    <CreatableCombobox
      options={medicines}
      value={field.value}
      getOptionLabel={m => m.name}
      getOptionValue={m => m.id}
      onChange={(medicine) => field.onChange(medicine.id)}
      onCreate={(text) => createMedicine({ name: text })}
      emptyText="Select or create medicine"
    />
  )}
/>
```

`onCreate` returns the created `Medicine` directly from the API call — the combobox handles calling `onChange` with it, so `field.onChange(medicine.id)` fires exactly once, from the one `onChange` handler, whether the medicine was selected or just created.

---

## 3. Async creation

`onCreate` returns the created item — `T` or `Promise<T>` — not `void`. Creation almost always means an API call, so treat it as async even when a specific case looks synchronous.

```ts
onCreate: (inputValue: string) => T | Promise<T>;
```

Inside the combobox: `const created = await onCreate(trimmed)`, then `onChange(created)`, before closing — so the popover doesn't close prematurely, and selection always reflects what was actually created (including its real server-generated `id`, not a guessed one).

---

## 4. Deriving more than one field from a single typed value

The combobox only ever produces **one typed string** as input to `onCreate`. If creation needs more than one field, parse it inside `onCreate` — don't change the combobox itself. `onCreate` still returns the full created object; the parsing just decides what gets sent to the API.

```ts
function parseVariantInput(input: string): { form?: MedicineForm; strength?: string } {
  const [formPart, strengthPart] = input.split('-').map(s => s.trim());
  const matchedForm = MEDICINE_FORMS.find(
    f => f.label.toLowerCase() === formPart?.toLowerCase()
  );
  return matchedForm
    ? { form: matchedForm.value, strength: strengthPart || undefined }
    : { form: undefined, strength: input || undefined };
}
```

```tsx
<CreatableCombobox
  options={variants}
  getOptionLabel={v => `${formLabel(v.form)} - ${v.strength ?? '—'}`}
  getOptionValue={v => v.id}
  value={field.value}
  onChange={(variant) => field.onChange(variant.id)}
  onCreate={(text) => {
    const { form, strength } = parseVariantInput(text);
    return createVariant(medicineId, { form, strength }); // returns the created MedicineVariant
  }}
/>
```

Display existing options in the same `"form - strength"` format the user is expected to type, so the pattern is discoverable.

---

## 5. Dependent fields (one combobox's options depend on another field's value)

Read the controlling field with `useWatch`, and only render the dependent combobox once it has a value. Don't try to fetch/store the dependency inside the dependent component itself — pass it down as a prop from wherever it's naturally available (often a parent `.map()` over a field array).

```tsx
const medicineId = watch(`medicines.${index}.medicineId`); // wherever index/watch already exist

{medicineId && (
  <VariantField
    medicineId={medicineId}
    medicines={medicines}
    onSelect={(id) => setValue(`medicines.${index}.medicineVariantId`, id)}
  />
)}
```

**When the controlling field changes**, clear the dependent one — a stale selection from the previous value shouldn't persist:

```tsx
onChange={(medicine) => {
  setValue('medicineId', medicine.id);
  setValue('medicineVariantId', undefined);
}}
```

---

## 6. Checklist

- [ ] "+ Create" shows regardless of existing option count (no `options.length > 0` gate)
- [ ] "+ Create" hidden when typed text exactly matches an existing option
- [ ] `onCreate` returns the created item (`T | Promise<T>`); combobox calls `onChange` with it internally
- [ ] `onChange` receives the full selected/created object, not just its id — caller extracts what it needs (usually `.id`)
- [ ] Wired via `Controller`, not `register`
- [ ] Multi-field creation handled by parsing the typed string inside `onCreate`, not by changing the combobox's shape
- [ ] Dependent comboboxes receive their controlling value as a prop; clear the dependent field when the controlling one changes
