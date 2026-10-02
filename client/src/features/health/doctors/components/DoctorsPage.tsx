import {
  createDoctor,
  deleteDoctor,
  fetchDoctors,
  unarchiveDoctor,
  updateDoctor,
} from '@/shared/api/doctor';
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
import type {
  CreateDoctorRequestPayload,
  Doctor,
} from '@carecoin/shared-types';
import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { ArchiveRestore, Pencil } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';

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
  const [editingDoctorId, setEditingDoctorId] = useState<Doctor['id'] | null>(
    null,
  );

  const { register, handleSubmit, reset } = useForm({
    defaultValues: INITIAL_DOCTOR,
  });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const getDoctors = async () => {
      const fetchedDoctors: { data: Doctor[] } | undefined = await fetchDoctors(
        { signal },
      );
      setDoctors(fetchedDoctors?.data || []);
    };
    getDoctors();

    return () => {
      controller.abort();
    };
  }, []);

  const handleFormReset = () => {
    reset(INITIAL_DOCTOR);
    setEditingDoctorId(null);
  };

  const handleAddNewDoctor: SubmitHandler<CreateDoctorRequestPayload> = async (
    data,
  ) => {
    if (editingDoctorId) {
      const updated: Doctor = await updateDoctor(editingDoctorId, data);
      setDoctors((prev) =>
        prev.map((doctor) =>
          doctor.id === editingDoctorId ? updated : doctor,
        ),
      );
    } else {
      const response: Doctor = await createDoctor(data);
      setDoctors((prev) => [...prev, response]);
    }
    handleFormReset();
  };

  const handleDeleteDoctor = async (id: Doctor['id']) => {
    const { archived } = await deleteDoctor(id);
    setDoctors((prev) =>
      archived
        ? prev.map((d) => (d.id === id ? { ...d, isActive: false } : d))
        : prev.filter((d) => d.id !== id),
    );
  };

  const handleEdit = (id: Doctor['id']) => {
    const editingDoctor = doctors.find((doc) => doc.id === id);
    if (editingDoctor) {
      reset(editingDoctor);
      setEditingDoctorId(id);
    }
  };

  const handleDoctorUnarchive = async (id: Doctor['id']) => {
    await unarchiveDoctor(id);
    setDoctors((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, isActive: true } : doc)),
    );
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(handleAddNewDoctor)}
        className="flex flex-col gap-3 py-3 min-w-100"
      >
        <FieldSet>
          <FieldLegend>{editingDoctorId ? 'Edit' : 'New'} Doctor</FieldLegend>
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
          <Button type="submit">
            {editingDoctorId ? 'Update' : 'Add'} Doctor
          </Button>
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
            <th className="px-2 border"></th>
          </tr>
        </thead>
        <tbody>
          {doctors.map(
            (
              { id, name, specialty, clinicName, city, phone, notes, isActive },
              index,
            ) => {
              return (
                <tr key={id}>
                  <td className="px-2 border">{index + 1}</td>
                  <td className="px-2 border">
                    <div className="flex items-center gap-2">
                      {name}
                      {!isActive && <Badge variant="outline">Archived</Badge>}
                    </div>
                  </td>
                  <td className="px-2 border">{specialty}</td>
                  <td className="px-2 border">{clinicName}</td>
                  <td className="px-2 border">{city}</td>
                  <td className="px-2 border">{phone}</td>
                  <td className="px-2 border">{notes}</td>
                  <td className="px-2 border">
                    <div className="flex gap-1">
                      <Button
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleEdit(id)}
                      >
                        <Pencil />
                      </Button>
                      {isActive ? (
                        <DeleteConfirmationDialog
                          id={id}
                          onConfirmDelete={handleDeleteDoctor}
                          title="Delete doctor?"
                          description="This will permanently delete this doctor."
                        />
                      ) : (
                        <Button
                          type="button"
                          className="cursor-pointer"
                          variant="secondary"
                          title="Unarchive"
                          onClick={() => handleDoctorUnarchive(id)}
                        >
                          <ArchiveRestore />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            },
          )}
        </tbody>
      </table>
    </>
  );
};

export default DoctorsPage;
