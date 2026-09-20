import { Field, FieldLabel } from '@/shared/components/ui/field';
import type { Medicine, MedicineVariant } from '@carecoin/shared-types';
import CreatableCombobox from './CreatableCombobox';
import { useFormContext, useWatch } from 'react-hook-form';

type Props = {
  variantOptions: MedicineVariant[];
  handleVariantSelect: (
    selectedVariant: MedicineVariant | MedicineVariant[] | null,
  ) => void;
  handleCreateVariant: (
    medicineId: string,
    medicineVariant: string,
  ) => Promise<MedicineVariant>;
  value: string;
  index: number;
};

const VariantRenderer = ({
  variantOptions,
  handleVariantSelect,
  handleCreateVariant,
  value,
  index,
}: Props) => {
  const { control } = useFormContext();
  const medicineId: Medicine['id'] = useWatch({
    control,
    name: `medicines.${index}.medicineId`,
  });

  if (medicineId === '') return null;

  return (
    <Field orientation="horizontal" className="max-w-[50%]">
      <FieldLabel htmlFor="select-form" className="flex-none!">
        Variant <span className="text-destructive">*</span>
      </FieldLabel>
      <CreatableCombobox<MedicineVariant>
        options={variantOptions}
        getOptionLabel={(option) => `${option.form} - ${option.strength}`}
        getOptionValue={(option) => option.id}
        value={value}
        onChange={handleVariantSelect}
        onCreate={(text) => handleCreateVariant(medicineId, text)}
        placeholder="Select a variant"
      />
    </Field>
  );
};

export default VariantRenderer;
