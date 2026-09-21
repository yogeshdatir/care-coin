import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/shared/components/ui/field';
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

  const getVariantLabel = ({ form, strength }: MedicineVariant) => {
    const label = strength !== '' && strength ? `${form} - ${strength}` : form;
    return label || '';
  };

  return (
    <Field className="gap-0.5 max-w-[50%]">
      <div className="flex flex-row items-center gap-2">
        <FieldLabel htmlFor="select-form" className="flex-none!">
          Variant <span className="text-destructive">*</span>
        </FieldLabel>
        <CreatableCombobox<MedicineVariant>
          key={medicineId}
          options={variantOptions}
          getOptionLabel={getVariantLabel}
          getOptionValue={(option) => option.id}
          value={value}
          onChange={handleVariantSelect}
          onCreate={(text) => handleCreateVariant(medicineId, text)}
          placeholder="Select a variant"
        />
      </div>
      <FieldDescription>
        Type to search, or add a new one as "Form - Strength" (e.g. "Tablet -
        500mg").
      </FieldDescription>
    </Field>
  );
};

export default VariantRenderer;
