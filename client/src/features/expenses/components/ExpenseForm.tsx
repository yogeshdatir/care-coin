import CreatableCombobox from '@/shared/components/CreatableCombobox';
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
  type Expense,
  type Medicine,
  type MedicineVariant,
  type Prescription,
  type Doctor,
} from '@carecoin/shared-types';
import {
  Controller,
  FormProvider,
  useForm,
  useWatch,
  type SubmitHandler,
} from 'react-hook-form';
import VariantRenderer from './VariantRenderer';
import { Button } from '@/shared/components/ui/button';
import DatePickerSimple from '@/shared/components/DatePicker';
import {
  EMPTY_EXPENSE_FORM,
  getPrescriptionLabel,
  toExpensePayload,
  type ExpenseFormValues,
  toExpenseFormValues,
} from '../helper';
import { createExpense, updateExpense } from '@/shared/api/expense';
import { createMedicine } from '@/shared/api/medicines';
import { useCallback, useEffect } from 'react';

type Props = {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  medicines: Medicine[];
  setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
  prescriptions: Prescription[];
  doctors: Doctor[];
  editingExpenseId: Expense['id'] | null;
  setEditingExpenseId: React.Dispatch<
    React.SetStateAction<Expense['id'] | null>
  >;
};

const ExpenseForm = ({
  expenses,
  setExpenses,
  medicines,
  setMedicines,
  prescriptions,
  doctors,
  editingExpenseId,
  setEditingExpenseId,
}: Props) => {
  const form = useForm<ExpenseFormValues>({
    defaultValues: EMPTY_EXPENSE_FORM,
  });

  const { register, handleSubmit, reset, control, setValue } = form;

  useEffect(() => {
    const editingExpense = expenses.find((e) => e.id === editingExpenseId);
    if (editingExpense) {
      const values = toExpenseFormValues(editingExpense, medicines);
      console.log({ editingExpense, values, medicineCount: medicines.length });
      reset(values);
    }
  }, [editingExpenseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const category = useWatch({
    control,
    name: `category`,
  });

  const handleCreateMedicine = async (medicineName: string) => {
    const newMedicine = await createMedicine({ name: medicineName });
    setMedicines((prev) => [...prev, newMedicine]);
    return newMedicine;
  };

  const handleNewExpense: SubmitHandler<ExpenseFormValues> = async (data) => {
    const expensePayload = toExpensePayload(data);
    console.log({ data, expensePayload });

    let response: Expense;
    if (editingExpenseId) {
      response = await updateExpense(editingExpenseId, expensePayload);
      const updatedExpenses = expenses.map((expense: Expense) => {
        if (expense.id === editingExpenseId) return response;
        else return expense;
      });
      setExpenses(updatedExpenses);
    } else {
      response = await createExpense(expensePayload);
      setExpenses((prev) => [...prev, response]);
    }

    handleFormReset();
  };

  const handleFormReset = useCallback(() => {
    reset(EMPTY_EXPENSE_FORM);
    setEditingExpenseId(null);
  }, [reset, setEditingExpenseId]);

  return (
    <Card className="flex flex-col gap-5">
      <CardHeader>
        <h3 className="font-bold text-lg">Add expense</h3>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form
            className="flex flex-col gap-5"
            onSubmit={handleSubmit(handleNewExpense)}
          >
            <FieldGroup className="@container/field-group flex flex-row gap-6">
              <Field>
                <FieldLabel htmlFor="date">Date</FieldLabel>
                <Controller
                  control={control}
                  name="date"
                  rules={{ required: 'Please select a date.' }}
                  render={({ field, fieldState }) => (
                    <DatePickerSimple
                      id="date"
                      value={field.value}
                      onChange={field.onChange}
                      isInvalid={fieldState.invalid}
                    />
                  )}
                />
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
                <Controller
                  control={control}
                  name="amount"
                  rules={{ required: 'Please add an amount...' }}
                  render={({ field, fieldState }) => (
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={field.value}
                      onChange={field.onChange}
                      aria-invalid={fieldState.invalid}
                    />
                  )}
                />
              </Field>
            </FieldGroup>
            {category === 'medicines' && (
              <FieldGroup className="@container/field-group flex flex-row gap-6">
                <Controller
                  name="medicineId"
                  control={control}
                  rules={{ required: true }}
                  render={({ field, fieldState }) => {
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
                            ariaInvalid={fieldState.invalid}
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
                  rules={{
                    required: 'Please select a variant...',
                  }}
                  render={({ field, fieldState }) => {
                    const handleVariantSelect = (
                      selectedVariant:
                        | MedicineVariant[]
                        | MedicineVariant
                        | null,
                    ) => {
                      if (selectedVariant && !Array.isArray(selectedVariant)) {
                        field.onChange(selectedVariant.id);
                      }
                    };

                    return (
                      <VariantRenderer
                        ariaInvalid={fieldState.invalid}
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
            )}
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="amount">Description</FieldLabel>
                <FieldDescription>
                  (optional, max 200 characters)
                </FieldDescription>
                <Input
                  id="description"
                  type="text"
                  max={200}
                  placeholder="e.g. HbA1c + lipid profile, MRI knee"
                  {...register('description')}
                />
              </Field>
              <div className="@container/field-group flex flex-row gap-6">
                <Controller
                  name="linkedPrescriptionId"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel
                        htmlFor="select-prescription-id"
                        className="flex-none!"
                      >
                        Prescription
                      </FieldLabel>
                      <FieldDescription>(optional)</FieldDescription>
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="select-prescription-id"
                          aria-invalid={fieldState.invalid}
                          className="flex-1"
                        >
                          <SelectValue placeholder="Select a Prescription..." />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectGroup>
                            {prescriptions.map((prescription: Prescription) => {
                              const { id: value } = prescription;
                              return (
                                <SelectItem key={value} value={value}>
                                  <span className="flex items-center gap-2">
                                    {getPrescriptionLabel(
                                      prescription,
                                      doctors,
                                    )}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
                <Field>
                  <FieldLabel htmlFor="receiptUrl">Receipt URL</FieldLabel>
                  <FieldDescription>(optional)</FieldDescription>
                  <Input
                    id="receiptUrl"
                    type="text"
                    placeholder="/uploads/receipt.jpg"
                    {...register('receiptUrl')}
                  />
                </Field>
              </div>
            </FieldGroup>
            <Field orientation="horizontal">
              <Button className="w-max">Save expense</Button>
              <Button
                className="w-max"
                variant="outline"
                type="button"
                onClick={() => handleFormReset()}
              >
                Clear
              </Button>
            </Field>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
};

export default ExpenseForm;
