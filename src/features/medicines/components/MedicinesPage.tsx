import { Button } from '@/shared/components/ui/button';
import { useState, type ChangeEvent, type SubmitEvent } from 'react';

type Medicine = {
  id: string;
  name: string;
};

const INITIAL_MEDICINE = {
  id: Date.now().toString(),
  name: '',
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
      <h1>Medicine List</h1>
      <form onSubmit={handleAddNewMedicine}>
        <fieldset>
          <label>
            <input
              name="name"
              value={newMedicine.name}
              onChange={handleNewMedicineInput}
            />
          </label>
        </fieldset>
        <Button type="submit">Add New</Button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map(({ id, name }) => {
            return (
              <tr key={id}>
                <td>{name}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MedicinesPage;
