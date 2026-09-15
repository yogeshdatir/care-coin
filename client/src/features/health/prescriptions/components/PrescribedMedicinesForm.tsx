import { Button } from '@/shared/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/shared/components/ui/field';
import {
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  Select,
} from '@/shared/components/ui/select';
import type { Medicine, MedicineVariant } from '@carecoin/shared-types';
import { useState } from 'react';
import {
  Controller,
  type Control,
  type UseFieldArrayReturn,
} from 'react-hook-form';

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
  remove: UseFieldArrayReturn['remove'];
};

const PrescribedMedicinesForm = ({
  fields,
  control,
  medicines,
  remove,
}: Props) => {
  const [variantOptions, setVariantOptions] = useState<MedicineVariant[]>([]);

  return (
    <FieldGroup>
      {fields.map((item, index) => (
        <FieldGroup key={item.id} className="flex flex-row gap-2">
          <Controller
            name={`medicines.${index}.medicineId` as const}
            control={control}
            rules={{ required: true }}
            render={({ field, fieldState }) => {
              const handleMedicineSelect = (value: string) => {
                field.onChange(value);
                setVariantOptions(
                  medicines.find((medicine: Medicine) => {
                    return medicine.id === value;
                  })?.variants ?? [],
                );
                console.log(variantOptions);
              };
              return (
                <Field orientation="horizontal" className="max-w-[50%]">
                  <FieldLabel htmlFor="select-form" className="flex-none!">
                    Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value ?? ''}
                    onValueChange={handleMedicineSelect}
                  >
                    <SelectTrigger
                      id="select-form"
                      aria-invalid={fieldState.invalid}
                      className="flex-1"
                    >
                      <SelectValue placeholder="Select a medicine..." />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectGroup>
                        {medicines.map(
                          ({ id: value, name: label }: Medicine) => {
                            return (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            );
                          },
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              );
            }}
          />
          {variantOptions?.length > 0 && (
            <Controller
              name={`medicines.${index}.medicineVariantId` as const}
              control={control}
              rules={{ required: true }}
              render={({ field, fieldState }) => {
                return (
                  <Field orientation="horizontal" className="max-w-[50%]">
                    <FieldLabel htmlFor="select-form" className="flex-none!">
                      Variant <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="select-form"
                        aria-invalid={fieldState.invalid}
                        className="flex-1"
                      >
                        <SelectValue placeholder="Select a variant..." />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectGroup>
                          {variantOptions.map(
                            ({ id: value, form: label }: MedicineVariant) => {
                              return (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              );
                            },
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                );
              }}
            />
          )}
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
