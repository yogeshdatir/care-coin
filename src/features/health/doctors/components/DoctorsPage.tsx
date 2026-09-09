import { createDoctor } from '@/shared/api/doctor';
import { Button } from '@/shared/components/ui/button';
import {
  FieldLabel,
  FieldSet,
  FieldLegend,
  FieldGroup,
  Field,
} from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import type { CreateDoctorRequestPayload, Doctor } from '@/shared/types';
import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';

const INITIAL_DOCTOR: CreateDoctorRequestPayload = {
  name: '',
  specialty: '',
  clinicName: '',
  city: '',
  phone: '',
  notes: '',
};

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: INITIAL_DOCTOR,
  });

  const handleAddNewDoctor: SubmitHandler<CreateDoctorRequestPayload> = async (
    data,
  ) => {
    const response: Doctor = await createDoctor(data);
    setDoctors((prev) => [...prev, response]);
    reset(INITIAL_DOCTOR);
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit(handleAddNewDoctor)}
        className="flex flex-col gap-3 py-3 min-w-100"
      >
        <FieldSet>
          <FieldLegend>New Doctor</FieldLegend>
          <FieldGroup>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="input-name">
                Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="input-name"
                type="text"
                placeholder="Doctor Name"
                {...register('name', { required: true })}
              />
            </Field>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="input-specialty">Specialty</FieldLabel>
              <Input
                id="input-specialty"
                type="text"
                placeholder="Doctor Specialty"
                {...register('specialty')}
              />
            </Field>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="input-clinic-name">Clinic Name</FieldLabel>
              <Input
                id="input-clinic-name"
                type="text"
                placeholder="Clinic Name"
                {...register('clinicName')}
              />
            </Field>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="input-city">
                City <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="input-city"
                type="text"
                placeholder="City"
                {...register('city', { required: true })}
              />
            </Field>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="input-phone">Phone</FieldLabel>
              <Input
                id="input-phone"
                type="text"
                placeholder="Phone"
                {...register('phone')}
              />
            </Field>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="input-notes">Notes</FieldLabel>
              <Textarea
                id="input-notes"
                placeholder="Notes"
                {...register('notes')}
              />
            </Field>
          </FieldGroup>
          <Button type="submit">Add Doctor</Button>
        </FieldSet>
      </form>
      <h1>Doctors</h1>
      <table className="border">
        <thead>
          <tr>
            <th className="px-2 border">Sr No</th>
            <th className="px-2 border">Name</th>
            <th className="px-2 border">Specialty</th>
            <th className="px-2 border">Clinic</th>
            <th className="px-2 border">City</th>
            <th className="px-2 border">Phone</th>
            <th className="px-2 border">Notes</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map(
            (
              { id, name, specialty, clinicName, city, phone, notes },
              index,
            ) => {
              return (
                <tr key={id}>
                  <td className="px-2 border">{index + 1}</td>
                  <td className="px-2 border">{name}</td>
                  <td className="px-2 border">{clinicName}</td>
                  <td className="px-2 border">{specialty}</td>
                  <td className="px-2 border">{city}</td>
                  <td className="px-2 border">{phone}</td>
                  <td className="px-2 border">{notes}</td>
                </tr>
              );
            },
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DoctorsPage;
