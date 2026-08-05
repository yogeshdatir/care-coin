import { Button } from '@/shared/components/ui/button';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  MEDICINE_FORMS,
  type Medicine,
  type MedicineFormItem,
} from '@/shared/types';
import { useState } from 'react';
import {
  Controller,
  useFieldArray,
  useForm,
  type SubmitHandler,
} from 'react-hook-form';

type Inputs = Partial<Medicine>;

const INITIAL_VARIANT = {
  form: '',
  strength: '',
};

const INITIAL_MEDICINE = {
  name: '',
  sideEffects: '',
  variants: [
    {
      ...INITIAL_VARIANT,
    },
  ],
};

const MedicinesPage = () => {
  const [medicines, setMedicines] = useState<any>([]);

  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: INITIAL_MEDICINE,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  const handleAddNewMedicine: SubmitHandler<Inputs> = (data) => {
    console.log(data);
    setMedicines((prev) => [...prev, data]);
    reset(INITIAL_MEDICINE);
  };

  const handleAddVariant = () => {
    append(INITIAL_VARIANT);
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit(handleAddNewMedicine)}
        className="flex flex-col gap-3 py-3 min-w-[400px]"
      >
        <FieldSet>
          <FieldLegend>Medicine</FieldLegend>
          <FieldGroup>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="input-name">
                Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="input-name"
                type="text"
                placeholder="Medicine Name"
                {...register('name', { required: true })}
              />
            </Field>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="input-side-effects">Side Effects</FieldLabel>
              <Textarea
                id="input-side-effects"
                placeholder="Side Effects"
                {...register('sideEffects')}
              />
            </Field>
          </FieldGroup>
        </FieldSet>
        <FieldSet>
          <FieldLegend>Variants</FieldLegend>
          <FieldGroup>
            {fields.map((item, index) => {
              return (
                <FieldGroup key={item.id}>
                  <Controller
                    name={`variants.${index}.form` as const}
                    control={control}
                    render={({ field, fieldState }) => {
                      return (
                        <Field orientation="horizontal">
                          <FieldLabel htmlFor="select-form">Form</FieldLabel>
                          <Select
                            name={field.name}
                            value={field.value ?? ''}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger
                              id="select-form"
                              aria-invalid={fieldState.invalid}
                            >
                              <SelectValue placeholder="Select a Form..." />
                            </SelectTrigger>
                            <SelectContent position="popper">
                              <SelectGroup>
                                {MEDICINE_FORMS.map(
                                  ({ value, label }: MedicineFormItem) => {
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
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="input-strength">Strength</FieldLabel>
                    <Input
                      id="input-strength"
                      placeholder="Medicine Strength"
                      {...register(`variants.${index}.strength`)}
                    />
                  </Field>
                  <Button type="button" onClick={() => remove(index)}>
                    Remove
                  </Button>
                </FieldGroup>
              );
            })}
          </FieldGroup>
          <Button type="button" onClick={handleAddVariant}>
            Add Another Variant
          </Button>
        </FieldSet>
        <Button type="submit">Create New Medicine</Button>
      </form>
      <h1>Medicine List</h1>
      <table className="border">
        <thead>
          <tr>
            <th className="px-2 border">Sr No</th>
            <th className="px-2 border">Name</th>
            <th className="px-2 border">Side Effects</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map(({ id, name, sideEffects }, index) => {
            return (
              <tr key={name}>
                <td className="px-2 border">{index + 1}</td>
                <td className="px-2 border">{name}</td>
                <td className="px-2 border">{sideEffects}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MedicinesPage;
