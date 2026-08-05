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
  type MedicineVariant,
} from '@/shared/types';
import { useState, type ChangeEvent, type SubmitEvent } from 'react';

const INITIAL_MEDICINE = {
  id: Date.now().toString(),
  name: '',
  sideEffects: '',
};

const MedicinesPage = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [newMedicine, setNewMedicine] = useState<Medicine>(INITIAL_MEDICINE);
  const [newMedVars, setNewMedVars] = useState<MedicineVariant[]>([]);

  const handleNewMedicineInput = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setNewMedicine((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAddNewMedicine = (e: SubmitEvent) => {
    e.preventDefault();

    setMedicines((prev) => [...prev, newMedicine]);
    setNewMedicine(INITIAL_MEDICINE);
  };

  const handleFormSelect = (value) => {};

  return (
    <div>
      <form
        onSubmit={handleAddNewMedicine}
        className="flex flex-col gap-3 py-3"
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
                name="name"
                value={newMedicine.name}
                onChange={handleNewMedicineInput}
                required
              />
            </Field>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="input-side-effects">Side Effects</FieldLabel>
              <Textarea
                id="input-side-effects"
                placeholder="Side Effects"
                name="sideEffects"
                value={newMedicine.sideEffects}
                onChange={handleNewMedicineInput}
              />
            </Field>
          </FieldGroup>
        </FieldSet>
        <FieldSet>
          <FieldLegend>Variants</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel>Form</FieldLabel>
              <Select onValueChange={handleFormSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Form" />
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
            <Field orientation="horizontal">
              <FieldLabel htmlFor="input-strength">Strength</FieldLabel>
              <Input
                id="input-strength"
                type="text"
                placeholder="Medicine Strength"
                name="strength"
                // value={newMedicine.name}
                // onChange={handleNewMedicineInput}
              />
            </Field>
          </FieldGroup>
        </FieldSet>
        <Button type="submit">Add New</Button>
      </form>
      <h1>Medicine List</h1>
      <table className="border">
        <thead>
          <tr>
            <th className="px-2 border">Sr No</th>
            <th className="px-2 border">Name</th>
            <th className="px-2 border">Form</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map(({ id, name, sideEffects }, index) => {
            return (
              <tr key={id}>
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
