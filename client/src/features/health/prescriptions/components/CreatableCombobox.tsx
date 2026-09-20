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
  emptyText?: string;
  onCreate: (inputValue: string) => T | Promise<T>;
  createLabel?: (query: string) => string;
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

  const CreateRow = (
    <button
      type="button"
      onClick={handleCreate}
      disabled={isCreating}
      className="flex items-center gap-2 hover:bg-accent px-2 py-1.5 w-full text-sm"
    >
      <Plus className="w-4 h-4" />
      {createLabel(trimmed)}
    </button>
  );

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
          <div className="border-t">{CreateRow}</div>
        )}
      </ComboboxContent>
    </Combobox>
  );
}

export default CreatableCombobox;
