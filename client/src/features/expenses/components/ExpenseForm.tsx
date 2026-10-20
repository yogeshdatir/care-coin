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
  getDefaultVariantId,
  toAddAnotherValues,
  toDuplicateValues,
  getDescriptionSuggestions,
} from '../helper';
import { createExpense, updateExpense } from '@/shared/api/expense';
import { createMedicine } from '@/shared/api/medicines';
import { useCallback, useEffect, useMemo } from 'react';

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
  duplicateSource: Expense | null;
  setDuplicateSource: React.Dispatch<React.SetStateAction<Expense | null>>;
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
  duplicateSource,
  setDuplicateSource,
}: Props) => {
  const form = useForm<ExpenseFormValues>({
    defaultValues: EMPTY_EXPENSE_FORM,
  });

  const { register, handleSubmit, reset, control, setValue, setFocus } = form;

  useEffect(() => {
    const editingExpense = expenses.find((e) => e.id === editingExpenseId);
    if (editingExpense) {
      const values = toExpenseFormValues(editingExpense, medicines);
      console.log({ editingExpense, values, medicineCount: medicines.length });
      reset(values);
    }
  }, [editingExpenseId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!duplicateSource) return;
    reset(toDuplicateValues(duplicateSource, medicines));
    setDuplicateSource(null); // so duplicating the same row again works
    requestAnimationFrame(() => setFocus('amount'));
  }, [duplicateSource]); // eslint-disable-line react-hooks/exhaustive-deps

  const category = useWatch({
    control,
    name: `category`,
  });

  const handleCreateMedicine = async (medicineName: string) => {
    const newMedicine = await createMedicine({ name: medicineName });
    setMedicines((prev) => [...prev, newMedicine]);
    return newMedicine;
  };

  const handleNewExpense: SubmitHandler<ExpenseFormValues> = async (
    data,
    event,
  ) => {
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)
      ?.submitter as HTMLButtonElement | null;
    const addAnother = submitter?.value === 'add-another';

    const expensePayload = toExpensePayload(data);

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

    if (addAnother) {
      reset(toAddAnotherValues(data));
      requestAnimationFrame(() => setFocus('amount'));
    } else {
      handleFormReset();
      requestAnimationFrame(() => setFocus('category'));
    }
  };

  const handleFormReset = useCallback(() => {
    reset(EMPTY_EXPENSE_FORM);
    setEditingExpenseId(null);
  }, [reset, setEditingExpenseId]);

  const suggestions = useMemo(
    () => getDescriptionSuggestions(expenses, category),
    [expenses, category],
  );

  return (
    <Card className="flex flex-col gap-5">
      <CardHeader>
        <h3 className="font-bold text-lg">
          {editingExpenseId ? 'Update' : 'Add'} expense
        </h3>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form
            className="flex flex-col gap-5"
            onSubmit={handleSubmit(handleNewExpense)}
          >
            <FieldGroup className="@container/field-group flex flex-row gap-6">
              <Field>
                <FieldLabel htmlFor="date">
                  Date <span className="text-destructive">*</span>
                </FieldLabel>
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
                        ref={field.ref}
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
                      {...field}
                      id="amount"
                      type="number"
                      placeholder="0.00"
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
                      setValue(
                        'linkedMedicineVariantId',
                        getDefaultVariantId(selectedMedicine),
                      );
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
                            placeholder="Select or create medicine"
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
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <FieldDescription>
                  (optional, max 200 characters)
                </FieldDescription>
                <Input
                  id="description"
                  type="text"
                  max={200}
                  list="description-suggestions"
                  placeholder="e.g. HbA1c + lipid profile, MRI knee"
                  {...register('description')}
                />
                <datalist id="description-suggestions">
                  {suggestions.map((text) => (
                    <option key={text} value={text} />
                  ))}
                </datalist>
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
                    type="url"
                    placeholder="/uploads/receipt.jpg"
                    {...register('receiptUrl')}
                  />
                </Field>
              </div>
            </FieldGroup>
            <Field orientation="horizontal">
              <Button className="w-max" type="submit">
                Save expense
              </Button>
              {!editingExpenseId && (
                <Button className="w-max" type="submit" value="add-another">
                  Save & add another expense
                </Button>
              )}
              <Button
                className="w-max"
                variant="outline"
                type="button"
                onClick={() => handleFormReset()}
              >
                {editingExpenseId ? 'Cancel' : 'Clear'}
              </Button>
            </Field>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
};

export default ExpenseForm;
