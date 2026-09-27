import { fetchDoctorById } from '@/shared/api/doctor';
import { Badge } from '@/shared/components/ui/badge';
import type { Doctor } from '@carecoin/shared-types';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router';

const DoctorDetailPage = () => {
  const { id } = useParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchDoctorById(id).then(setDoctor);
  }, [id]);

  if (!doctor) return <p>Loading...</p>;

  return (
    <div>
      <p>
        <span>Name: </span>
        <span>{doctor.name}</span>
        {doctor.isActive === false && (
          <Badge variant="outline" className="text-muted-foreground">
            Archived
          </Badge>
        )}
      </p>
    </div>
  );
};

export default DoctorDetailPage;
