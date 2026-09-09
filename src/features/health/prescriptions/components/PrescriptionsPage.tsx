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
import { useEffect, useState } from 'react';
import type {
  CreatePrescriptionRequestPayload,
  Doctor,
  Prescription,
} from '../../../../shared/types/health';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { createPrescription } from '@/shared/api/prescription';
import { fetchDoctors } from '@/shared/api/doctor';

const INITIAL_PRESCRIPTION = {
  doctorId: '',
  date: '',
  notes: '',
  imageUrl: '',
};

const PrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    const getDoctors = async () => {
      const fetchedDoctors: Doctor[] = await fetchDoctors();
      setDoctors(fetchedDoctors);
    };
    getDoctors();
  }, []);

  const { register, handleSubmit, reset, control } = useForm({
    defaultValues: INITIAL_PRESCRIPTION,
  });

  const handleAddNewPrescription: SubmitHandler<
    CreatePrescriptionRequestPayload
  > = async (data) => {
    const response: Prescription = await createPrescription(data);
    setPrescriptions((prev) => [...prev, response]);
    reset(INITIAL_PRESCRIPTION);
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit(handleAddNewPrescription)}
        className="flex flex-col gap-3 py-3 min-w-100"
      >
        <FieldSet>
          <FieldLegend>New Prescription</FieldLegend>
          <FieldGroup>
            <Controller
              name="doctorId"
              control={control}
              rules={{ required: true }}
              render={({ field, fieldState }) => (
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="select-doctor">
                    Doctor <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="select-doctor"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Select a Doctor..." />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectGroup>
                        {doctors.map(({ id: value, name: label }: Doctor) => {
                          return (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          );
                        })}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Field orientation="horizontal">
              <FieldLabel htmlFor="input-date">
                Date <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="input-date"
                type="text"
                placeholder="Prescription Date"
                {...register('date', { required: true })}
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
            <Field orientation="horizontal">
              <FieldLabel htmlFor="input-imageUrl">Image</FieldLabel>
              <Input
                id="input-imageUrl"
                type="text"
                placeholder="Prescription Image"
                {...register('imageUrl')}
              />
            </Field>
          </FieldGroup>
        </FieldSet>
        <Button type="submit">Create New Medicine</Button>
      </form>
      <h1>Prescriptions</h1>
      <table className="border">
        <thead>
          <tr>
            <th className="px-2 border">Sr No</th>
            <th className="px-2 border">Doctor</th>
            <th className="px-2 border">Date</th>
            <th className="px-2 border">Notes</th>
          </tr>
        </thead>
        <tbody>
          {prescriptions.map(({ id, doctorId, date, notes }, index) => {
            return (
              <tr key={id}>
                <td className="px-2 border">{index + 1}</td>
                <td className="px-2 border">{doctorId}</td>
                <td className="px-2 border">{date}</td>
                <td className="px-2 border">{notes}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PrescriptionsPage;
