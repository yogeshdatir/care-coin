import { Button } from '@/shared/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/shared/components/ui/field';
import type { Medicine, MedicineVariant } from '@carecoin/shared-types';
import { useState } from 'react';
import {
  Controller,
  type Control,
  type UseFieldArrayReturn,
} from 'react-hook-form';
import CreatableCombobox from './CreatableCombobox';
import { createMedicine, createVariant } from '@/shared/api/medicines';
import VariantRenderer from './VariantRenderer';

type Props = {
  fields: UseFieldArrayReturn['fields'];
  control: Control<
    {
      doctorId: string;
      date: string;
      notes: string;
      imageUrl: string;
      medicines: {
        medicineId: string;
        medicineVariantId: string;
        frequency: string;
        reason: string;
        startDate: string;
        endDate: string;
      }[];
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    {
      doctorId: string;
      date: string;
      notes: string;
      imageUrl: string;
      medicines: {
        medicineId: string;
        medicineVariantId: string;
        frequency: string;
        reason: string;
        startDate: string;
        endDate: string;
      }[];
    }
  >;
  medicines: Medicine[];
  setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
  remove: UseFieldArrayReturn['remove'];
};

const PrescribedMedicinesForm = ({
  fields,
  control,
  medicines,
  setMedicines,
  remove,
}: Props) => {
  const [variantOptions, setVariantOptions] = useState<MedicineVariant[]>([]);

  const handleCreateMedicine = async (medicineName: string) => {
    const newMedicine = await createMedicine({ name: medicineName });
    setMedicines((prev) => [...prev, newMedicine]);
    return newMedicine;
  };

  const handleCreateVariant = async (
    medicineId: Medicine['id'],
    medicineVariant: string,
  ) => {
    const [form, strength] = medicineVariant.split(' - ');
    const newVariant = await createVariant(medicineId, { form, strength });
    setVariantOptions((prev) => [...prev, newVariant]);
    return newVariant;
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
                  setVariantOptions(
                    medicines.find((medicine: Medicine) => {
                      return medicine.id === selectedMedicine.id;
                    })?.variants ?? [],
                  );
                }
              };

              return (
                <Field orientation="horizontal" className="max-w-[50%]">
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
                  variantOptions={variantOptions}
                  handleCreateVariant={handleCreateVariant}
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
