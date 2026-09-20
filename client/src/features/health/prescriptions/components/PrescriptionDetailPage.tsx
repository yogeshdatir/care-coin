import type { Medicine } from '@carecoin/shared-types';
import { Link, useLocation } from 'react-router';

const PrescriptionDetailPage = () => {
  const location = useLocation();

  const { prescription, doctor, medicines } = location.state || {};
  const { date } = prescription || {};
  const { name, id: doctorId } = doctor || {};

  return (
    <div>
      <p>
        <span>Doctor: </span>
        <Link to={`/doctor/${doctorId}`} state={{ doctor }}>
          <span>{name}</span>
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
              <th className="px-2 border">Side Effects</th>
            </tr>
          </thead>
          <tbody>
            {medicines?.map((medicine: Medicine, index: number) => {
              return (
                <tr key={medicine.id}>
                  <td className="px-2 border">{index + 1}</td>
                  <td className="px-2 border capitalize">{medicine.name}</td>
                  <td className="px-2 border capitalize">
                    {medicine?.variants?.[0]?.form}
                  </td>
                  <td className="px-2 border">
                    {medicine?.variants?.[0]?.strength}
                  </td>
                  <td className="px-2 border">{medicine.sideEffects}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default PrescriptionDetailPage;
