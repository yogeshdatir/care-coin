import { Button } from '@/shared/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/shared/components/ui/field';
import type { Medicine, MedicineVariant } from '@carecoin/shared-types';
import {
  Controller,
  useFormContext,
  type UseFieldArrayReturn,
} from 'react-hook-form';
import CreatableCombobox from './CreatableCombobox';
import { createMedicine } from '@/shared/api/medicines';
import VariantRenderer from './VariantRenderer';

type Props = {
  fields: UseFieldArrayReturn['fields'];
  medicines: Medicine[];
  setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
  remove: UseFieldArrayReturn['remove'];
};

const PrescribedMedicinesForm = ({
  fields,
  medicines,
  setMedicines,
  remove,
}: Props) => {
  const { control, setValue } = useFormContext();

  const handleCreateMedicine = async (medicineName: string) => {
    const newMedicine = await createMedicine({ name: medicineName });
    setMedicines((prev) => [...prev, newMedicine]);
    return newMedicine;
  };

  return (
    <FieldGroup>
      {fields.map((item, index) => (
        <FieldGroup key={item.id} className="flex flex-row gap-2">
          <Controller
            name={`medicines.${index}.medicineId` as const}
            control={control}
            rules={{ required: true }}
            render={({ field }) => {
              const handleMedicineSelect = (
                selectedMedicine: Medicine[] | Medicine | null,
              ) => {
                if (selectedMedicine && !Array.isArray(selectedMedicine)) {
                  field.onChange(selectedMedicine.id);
                  setValue(`medicines.${index}.medicineVariantId`, '');
                }
              };

              return (
                <Field className="gap-0.5 max-w-[50%]">
                  <div className="flex flex-row items-center gap-2">
                    <FieldLabel htmlFor="select-form" className="flex-none!">
                      Name <span className="text-destructive">*</span>
                    </FieldLabel>
                    <CreatableCombobox<Medicine>
                      options={medicines}
                      getOptionLabel={(option) => option.name}
                      getOptionValue={(option) => option.id}
                      value={field.value}
                      onChange={handleMedicineSelect}
                      onCreate={handleCreateMedicine}
                      placeholder="Select a medicine"
                    />
                  </div>
                  <FieldDescription>
                    Type a name to search, or add a new one.
                  </FieldDescription>
                </Field>
              );
            }}
          />

          <Controller
            name={`medicines.${index}.medicineVariantId` as const}
            control={control}
            rules={{ required: true }}
            render={({ field }) => {
              const handleVariantSelect = (
                selectedVariant: MedicineVariant[] | MedicineVariant | null,
              ) => {
                if (selectedVariant && !Array.isArray(selectedVariant)) {
                  field.onChange(selectedVariant.id);
                }
              };

              return (
                <VariantRenderer
                  medicines={medicines}
                  setMedicines={setMedicines}
                  handleVariantSelect={handleVariantSelect}
                  value={field.value}
                  index={index}
                />
              );
            }}
          />
          <Button
            type="button"
            onClick={() => remove(index)}
            className="ml-auto"
          >
            Remove
          </Button>
        </FieldGroup>
      ))}
    </FieldGroup>
  );
};

export default PrescribedMedicinesForm;
