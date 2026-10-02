import {
  createMedicine,
  deleteMedicine,
  fetchMedicines,
  unarchiveMedicine,
  updateMedicine,
} from '@/shared/api/medicines';
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
  type CreateMedicineRequestPayload,
  type Medicine,
  type MedicineFormItem,
  type MedicineVariant,
  type UpdateMedicineRequestPayload,
} from '@carecoin/shared-types';
import { ArchiveRestore, Pencil } from 'lucide-react';
import { Fragment, useCallback, useEffect, useState } from 'react';
import {
  Controller,
  useFieldArray,
  useForm,
  type SubmitHandler,
} from 'react-hook-form';
import { DeleteConfirmationDialog } from '../../doctors/components/DeleteConfirmationDialog';
import { Badge } from '@/shared/components/ui/badge';

type MedicineVariantFormValues = Omit<
  MedicineVariant,
  'id' | 'medicineId' | 'isActive'
> & {
  id?: MedicineVariant['id'];
  isActive?: MedicineVariant['isActive'];
};

type MedicineFormValues = Omit<Medicine, 'id' | 'variants' | 'isActive'> & {
  id?: Medicine['id'];
  variants?: MedicineVariantFormValues[];
  isActive?: Medicine['isActive'];
};

const INITIAL_VARIANT: MedicineVariantFormValues = {
  form: '',
  strength: '',
};

const INITIAL_MEDICINE: MedicineFormValues = {
  name: '',
  sideEffects: '',
  variants: [
    {
      ...INITIAL_VARIANT,
    },
  ],
};

const MedicinesPage = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [editingMedicineId, setEditingMedicineId] = useState<
    Medicine['id'] | null
  >(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const getDoctors = async () => {
      const fetchedMedicines: { data: Medicine[] } = await fetchMedicines({
        signal,
      });
      setMedicines(fetchedMedicines?.data || []);
    };
    getDoctors();

    return () => {
      controller.abort();
    };
  }, []);

  const { register, handleSubmit, control, reset, getValues } = useForm({
    defaultValues: INITIAL_MEDICINE,
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'variants',
    // useFieldArray adds its own `id` to every item to use as a React key,
    // which overwrites our variant's real DB `id` (e.g. unarchiveVariant(item.id)
    // would receive RHF's generated id instead of the variant id).
    // Renaming the key to `fieldKey` keeps `item.id` as the real variant id.
    // Use `item.fieldKey` for the React `key` prop.
    keyName: 'fieldKey',
  });

  const handleAddNewMedicine: SubmitHandler<
    CreateMedicineRequestPayload | UpdateMedicineRequestPayload
  > = async (data) => {
    const cleanedVariants = data.variants?.filter(
      (variant) => variant.form?.trim() !== '',
    );

    const finalData = {
      ...data,
      variants: cleanedVariants,
    };

    let response: Medicine;
    if (editingMedicineId) {
      response = await updateMedicine(editingMedicineId, finalData);
      const updatedMedicines = medicines.map((medicine: Medicine) => {
        if (medicine.id === editingMedicineId) return response;
        else return medicine;
      });
      setMedicines(updatedMedicines);
    } else {
      response = await createMedicine(finalData);
      setMedicines((prev) => [...prev, response]);
    }
    handleFormReset();
  };

  const handleAddVariant = () => {
    append(INITIAL_VARIANT);
  };

  // Pending until submit: the update endpoint receives `isActive: true`
  // for this variant and un-archives it.
  const handleVariantUnarchive = (index: number) => {
    update(index, { ...getValues(`variants.${index}`), isActive: true });
  };

  const handleFormReset = useCallback(() => {
    reset(INITIAL_MEDICINE);
    setEditingMedicineId(null);
  }, [reset]);

  const handleEdit = (id: Medicine['id']) => {
    const editingMedicine = medicines.find((m) => m.id === id);
    if (editingMedicine) {
      reset(editingMedicine);
      setEditingMedicineId(id);
    }
  };

  const handleDeleteMedicine = async (id: Medicine['id']) => {
    const { archived } = await deleteMedicine(id);

    setMedicines((prev) =>
      archived
        ? prev.map((med) =>
            med.id === id
              ? {
                  ...med,
                  isActive: false,
                  // backend archives all variants too, so mirror that
                  variants: med.variants?.map((v) => ({
                    ...v,
                    isActive: false,
                  })),
                }
              : med,
          )
        : prev.filter((med) => med.id !== id),
    );

    if (id === editingMedicineId) handleFormReset();
  };

  const handleMedicineUnarchive = async (id: Medicine['id']) => {
    await unarchiveMedicine(id);
    setMedicines((prev) =>
      prev.map((med) => (med.id === id ? { ...med, isActive: true } : med)),
    );
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(handleAddNewMedicine)}
        className="flex flex-col gap-3 py-3 min-w-100"
      >
        <FieldSet>
          <FieldLegend>New Medicine</FieldLegend>
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
              const isArchived = item.isActive === false;
              return (
                <FieldGroup key={item.fieldKey} className="flex flex-row gap-2">
                  <Controller
                    name={`variants.${index}.form` as const}
                    control={control}
                    render={({ field, fieldState }) => {
                      return (
                        <Field orientation="horizontal">
                          <FieldLabel
                            htmlFor="select-form"
                            className="flex-none!"
                          >
                            Form
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
                    <FieldLabel htmlFor="input-strength" className="flex-none!">
                      Strength
                    </FieldLabel>
                    <Input
                      id="input-strength"
                      placeholder="Medicine Strength"
                      {...register(`variants.${index}.strength`)}
                    />
                  </Field>
                  {isArchived ? (
                    <Button
                      type="button"
                      onClick={() => handleVariantUnarchive(index)}
                    >
                      Unarchive
                    </Button>
                  ) : (
                    <Button type="button" onClick={() => remove(index)}>
                      Remove
                    </Button>
                  )}
                </FieldGroup>
              );
            })}
          </FieldGroup>
          <Button type="button" onClick={handleAddVariant}>
            Add Another Variant
          </Button>
        </FieldSet>
        <div className="flex gap-2">
          <Button className="flex-1" type="submit">
            {editingMedicineId ? 'Update' : 'Add'} Medicine
          </Button>
          <Button
            className="flex-1"
            type="button"
            onClick={() => handleFormReset()}
          >
            Reset
          </Button>
        </div>
      </form>
      <h1>Medicines</h1>
      <table className="border">
        <thead>
          <tr>
            <th className="px-2 border">Sr No</th>
            <th className="px-2 border">Name</th>
            <th className="px-2 border">Form</th>
            <th className="px-2 border">Strength</th>
            <th className="px-2 border">Side Effects</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map(
            ({ id, name, sideEffects, variants, isActive }, index) => {
              const isArchived = isActive === false;
              return (
                <Fragment key={id}>
                  <tr>
                    <td className="px-2 border">{index + 1}</td>
                    <td className="px-2 border capitalize">
                      <div className="flex items-center gap-2">
                        {name}
                        {isArchived && (
                          <Badge variant="outline">Archived</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-2 border"></td>
                    <td className="px-2 border"></td>
                    <td className="px-2 border">{sideEffects}</td>
                    <td
                      className="px-2 border"
                      rowSpan={(variants?.length || 0) + 1}
                    >
                      <div className="flex gap-1">
                        <Button
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => handleEdit(id)}
                          title="Edit medicine"
                        >
                          <Pencil />
                        </Button>
                        {isArchived ? (
                          <Button
                            type="button"
                            className="cursor-pointer"
                            variant="secondary"
                            title="Unarchive"
                            onClick={() => handleMedicineUnarchive(id)}
                          >
                            <ArchiveRestore />
                          </Button>
                        ) : (
                          <DeleteConfirmationDialog
                            id={id}
                            onConfirmDelete={handleDeleteMedicine}
                            title="Delete medicine?"
                            description="This will permanently delete this medicine."
                          />
                        )}
                      </div>
                    </td>
                  </tr>

                  {variants && variants?.length > 0 ? (
                    <>
                      {variants.map(
                        ({ id, form, strength, isActive }: MedicineVariant) => {
                          const isArchived = isActive === false;
                          return (
                            <tr key={id}>
                              <td colSpan={2}></td>
                              <td className="px-2 border capitalize">
                                <div className="flex items-center gap-2">
                                  {form}
                                  {isArchived && (
                                    <Badge variant="outline">Archived</Badge>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 border">{strength}</td>
                            </tr>
                          );
                        },
                      )}
                    </>
                  ) : null}
                </Fragment>
              );
            },
          )}
        </tbody>
      </table>
    </>
  );
};

export default MedicinesPage;
