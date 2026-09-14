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
  Medicine,
  MedicineVariant,
  Prescription,
  PrescriptionMedicineFormRow,
} from '../../../../shared/types/health';
import {
  Controller,
  useFieldArray,
  useForm,
  type SubmitHandler,
} from 'react-hook-form';
import {
  createPrescription,
  fetchPrescriptions,
} from '@/shared/api/prescription';
import { fetchDoctors } from '@/shared/api/doctor';
import { fetchMedicines } from '@/shared/api/medicines';
import PrescribedMedicinesForm from './PrescribedMedicinesForm';
import { useNavigate } from 'react-router';

type LocationState = {
  prescription: Prescription;
  doctor: Doctor;
  medicines: Medicine[];
};

const INITIAL_MEDICINE = {
  medicineId: '',
  medicineVariantId: '',
  frequency: '',
  reason: '',
  startDate: '',
  endDate: '',
};

const INITIAL_PRESCRIPTION = {
  doctorId: '',
  date: '',
  notes: '',
  imageUrl: '',
  medicines: [INITIAL_MEDICINE],
};

const PrescriptionsPage = () => {
  const navigate = useNavigate();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const getDoctors = async () => {
      const fetchedDoctors: { data: Doctor[] } = await fetchDoctors({ signal });
      setDoctors(fetchedDoctors?.data || []);
    };
    getDoctors();
    const getMedicines = async () => {
      const fetchedMedicines: { data: Medicine[] } = await fetchMedicines({
        signal,
      });
      setMedicines(fetchedMedicines?.data || []);
    };
    getMedicines();
    const getPrescriptions = async () => {
      const fetchedPrescriptions: { data: Prescription[] } =
        await fetchPrescriptions({
          signal,
        });
      setPrescriptions(fetchedPrescriptions?.data || []);
    };
    getPrescriptions();

    return () => {
      controller.abort();
    };
  }, []);

  const { register, handleSubmit, reset, control } = useForm({
    defaultValues: INITIAL_PRESCRIPTION,
  });

  const handleAddNewPrescription: SubmitHandler<
    CreatePrescriptionRequestPayload
  > = async (data) => {
    const cleanedMedicines = data.medicines?.filter(
      (medicine) => medicine.medicineId?.trim() !== '',
    );

    const finalData = {
      ...data,
      medicines: cleanedMedicines,
    };
    console.log(finalData);
    const response: Prescription = await createPrescription(finalData);
    setPrescriptions((prev) => [...prev, response]);
    reset(INITIAL_PRESCRIPTION);
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'medicines',
  });

  const handleAddPrescription = () => {
    append(INITIAL_MEDICINE);
  };

  const handlePrescriptionNav = (prescription: Prescription) => {
    const selectedPrescriptionDoctor = doctors.find(
      (doctor) => doctor.id === prescription.doctorId,
    );
    const selectedPrescriptionMedicine = prescription.medicines?.map(
      (prescribedMedicine: PrescriptionMedicineFormRow) => {
        const result = medicines.find(
          (medicine: Medicine) => medicine.id === prescribedMedicine.medicineId,
        );
        if (result?.variants && result.variants.length) {
          const selectedVariant = result?.variants?.find(
            (variant: MedicineVariant) =>
              variant.id === prescribedMedicine.medicineVariantId,
          );
          if (selectedVariant) result.variants = [selectedVariant];
        }
        return result;
      },
    );
    navigate(`${prescription.id}`, {
      state: {
        prescription,
        doctor: selectedPrescriptionDoctor,
        medicines: selectedPrescriptionMedicine,
      } as LocationState,
    });
  };

  return (
    <>
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
                  <FieldLabel htmlFor="select-doctor" className="flex-none!">
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
                      className="flex-1"
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

        <FieldSet>
          <FieldLegend>Medicines</FieldLegend>
          <PrescribedMedicinesForm
            fields={fields}
            control={control}
            medicines={medicines}
            remove={remove}
          />
          <Button type="button" onClick={handleAddPrescription}>
            Add Another Prescribed Medicine
          </Button>
        </FieldSet>
        <Button type="submit">Add Prescription</Button>
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
          {prescriptions.map((prescription, index) => {
            const { id, doctorId, date, notes } = prescription;
            return (
              <tr
                key={id}
                className="cursor-pointer"
                onClick={() => handlePrescriptionNav(prescription)}
              >
                <td className="px-2 border">{index + 1}</td>
                <td className="px-2 border">{doctorId}</td>
                <td className="px-2 border">{date}</td>
                <td className="px-2 border">{notes}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};

export default PrescriptionsPage;
