import { fetchPrescriptionById } from '@/shared/api/prescription';
import type { Prescription } from '@carecoin/shared-types';
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';

const PrescriptionDetailPage = () => {
  const { id } = useParams();
  const [prescription, setPrescription] = useState<Prescription | null>(null);

  const { doctorId, doctorName, date } = prescription || {};

  useEffect(() => {
    if (!id) return;
    fetchPrescriptionById(id).then(setPrescription);
  }, [id]);

  if (!prescription) return <p>Loading...</p>;

  return (
    <div>
      <p>
        <span>Doctor: </span>
        <Link to={`/doctor/${doctorId}`}>
          <span>{doctorName}</span>
        </Link>
      </p>
      <p>
        <span>Date: </span>
        <span>{date}</span>
      </p>
      <section>
        <h3 className="font-bold">Prescribed Medicines</h3>
        <table>
          <thead>
            <tr>
              <th className="px-2 border">Sr. No.</th>
              <th className="px-2 border">Name</th>
              <th className="px-2 border">Form</th>
              <th className="px-2 border">Strength</th>
              <th className="px-2 border">Reason</th>
              <th className="px-2 border">Period</th>
            </tr>
          </thead>
          <tbody>
            {prescription.medicines?.map((med, index) => (
              <tr key={`${med.medicineId}-${med.medicineVariantId}`}>
                <td className="px-2 border">{index + 1}</td>
                <td className="px-2 border capitalize">{med.medicineName}</td>
                <td className="px-2 border capitalize">{med.variantLabel}</td>
                <td className="px-2 border">{med.frequency}</td>
                <td className="px-2 border">{med.reason}</td>
                <td className="px-2 border">
                  {med.startDate} – {med.endDate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default PrescriptionDetailPage;
