import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/shared/components/ui/field';
import type { Medicine, MedicineVariant } from '@carecoin/shared-types';
import CreatableCombobox from './CreatableCombobox';
import { useFormContext, useWatch } from 'react-hook-form';
import { createVariant } from '@/shared/api/medicines';

type Props = {
  medicines: Medicine[];
  setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
  handleVariantSelect: (
    selectedVariant: MedicineVariant | MedicineVariant[] | null,
  ) => void;
  value: string;
  index: number;
};

const VariantRenderer = ({
  medicines,
  setMedicines,
  handleVariantSelect,
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

  const variantOptions =
    medicines.find((medicine: Medicine) => {
      return medicine.id === medicineId;
    })?.variants ?? [];

  const handleCreateVariant = async (
    medicineId: Medicine['id'],
    medicineVariant: string,
  ) => {
    const [form, strength] = medicineVariant.split(' - ');
    const newVariant = await createVariant(medicineId, { form, strength });
    setMedicines((prev) => {
      return prev.map((medicine: Medicine) => {
        if (medicine.id === medicineId) {
          return {
            ...medicine,
            variants: [...(medicine.variants ?? []), newVariant],
          };
        } else {
          return medicine;
        }
      });
    });
    return newVariant;
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
