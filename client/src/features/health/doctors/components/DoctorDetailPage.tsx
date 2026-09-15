import { useLocation } from 'react-router';

const DoctorDetailPage = () => {
  const location = useLocation();

  const { doctor } = location.state || {};

  return (
    <div>
      <p>
        <span>Name: </span>
        <span>{doctor.name}</span>
      </p>
    </div>
  );
};

export default DoctorDetailPage;
