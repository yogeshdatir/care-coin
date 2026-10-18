import CreatableCombobox from '@/features/health/prescriptions/components/CreatableCombobox';
import { createMedicine, fetchMedicines } from '@/shared/api/medicines';
import DatePicker from '@/shared/components/DatePicker';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
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
import {
  EXPENSE_CATEGORIES,
  type OptionItem,
  type ExpenseCategory,
  type Medicine,
  type MedicineVariant,
} from '@carecoin/shared-types';
import { useEffect, useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import VariantRenderer from './VariantRenderer';

/**
 * What the form holds. Separate from the API payload on purpose:
 * - every input value is a string ('' = not set), so inputs stay controlled
 * - `medicineId` exists only to filter the variant options and is never sent
 */
interface ExpenseFormValues {
  date: string;
  category: ExpenseCategory | ''; // '' until the user picks one
  amount: string;
  description: string;
  linkedPrescriptionId: string;
  medicineId: string; // UI-only
  linkedMedicineVariantId: string;
  receiptUrl: string;
}

const EMPTY_EXPENSE_FORM: ExpenseFormValues = {
  date: '',
  category: '',
  amount: '',
  description: '',
  linkedPrescriptionId: '',
  medicineId: '',
  linkedMedicineVariantId: '',
  receiptUrl: '',
};

const ExpenseForm = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const getMedicines = async () => {
      const fetchedMedicines: { data: Medicine[] } = await fetchMedicines({
        signal,
      });
      setMedicines(fetchedMedicines?.data || []);
    };
    getMedicines();

    return () => {
      controller.abort();
    };
  }, []);

  const form = useForm<ExpenseFormValues>({
    defaultValues: EMPTY_EXPENSE_FORM,
  });

  const { control, setValue } = form;

  const handleCreateMedicine = async (medicineName: string) => {
    const newMedicine = await createMedicine({ name: medicineName });
    setMedicines((prev) => [...prev, newMedicine]);
    return newMedicine;
  };

  return (
    <Card className="flex flex-col gap-5">
      <CardHeader>Add Expense</CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form className="flex flex-col gap-5">
            <FieldGroup className="@container/field-group flex flex-row gap-6">
              <Field>
                <FieldLabel htmlFor="date">Date</FieldLabel>
                <DatePicker id="date" />
              </Field>
              <Controller
                name="category"
                control={control}
                rules={{ required: true }}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel
                      htmlFor="select-category"
                      className="flex-none!"
                    >
                      Category <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="select-category"
                        aria-invalid={fieldState.invalid}
                        className="flex-1"
                      >
                        <SelectValue placeholder="Select a Category..." />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectGroup>
                          {EXPENSE_CATEGORIES.map(
                            ({ value, label }: OptionItem) => {
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
                )}
              />

              <Field>
                <FieldLabel htmlFor="amount">
                  Amount (₹)
                  <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="0.00"
                />
              </Field>
            </FieldGroup>
            <FieldGroup className="@container/field-group flex flex-row gap-6">
              <Controller
                name="medicineId"
                control={control}
                rules={{ required: true }}
                render={({ field }) => {
                  const handleMedicineSelect = (
                    selectedMedicine: Medicine[] | Medicine | null,
                  ) => {
                    if (!selectedMedicine || Array.isArray(selectedMedicine))
                      return;
                    if (selectedMedicine.id === field.value) return;

                    field.onChange(selectedMedicine.id);
                    setValue(`linkedMedicineVariantId`, '');
                  };

                  return (
                    <Field className="gap-0.5 max-w-[50%]">
                      <div className="flex flex-col gap-2">
                        <FieldLabel
                          htmlFor="select-form"
                          className="flex-none!"
                        >
                          Medicine <span className="text-destructive">*</span>
                        </FieldLabel>
                        <CreatableCombobox<Medicine>
                          options={medicines}
                          getOptionLabel={(option) => option.name}
                          getOptionValue={(option) => option.id}
                          value={field.value}
                          onChange={handleMedicineSelect}
                          onCreate={handleCreateMedicine}
                          placeholder="Select a medicine"
                          isOptionDisabled={(option) => !option.isActive}
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
                name="linkedMedicineVariantId"
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
                      className="flex flex-col gap-2"
                    />
                  );
                }}
              />
            </FieldGroup>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
};

export default ExpenseForm;
