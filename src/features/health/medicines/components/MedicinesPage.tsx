import { Button } from '@/shared/components/ui/button';
import { Field, FieldLabel, FieldLegend } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { useState, type ChangeEvent, type SubmitEvent } from 'react';

type Medicine = {
  id: string;
  name: string;
  form: string;
};

const INITIAL_MEDICINE = {
  id: Date.now().toString(),
  name: '',
  form: '',
};

const MedicinesPage = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [newMedicine, setNewMedicine] = useState<Medicine>(INITIAL_MEDICINE);

  const handleNewMedicineInput = (e: ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div>
      <form
        onSubmit={handleAddNewMedicine}
        className="flex flex-col gap-3 py-3"
      >
        <FieldLegend>Medicine Form</FieldLegend>
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
          <FieldLabel htmlFor="input-form">
            Form <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="input-form"
            type="text"
            placeholder="Medicine Form"
            name="form"
            value={newMedicine.form}
            onChange={handleNewMedicineInput}
            required
          />
        </Field>
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
          {medicines.map(({ id, name, form }, index) => {
            return (
              <tr key={id}>
                <td className="px-2 border">{index + 1}</td>
                <td className="px-2 border">{name}</td>
                <td className="px-2 border">{form}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MedicinesPage;
