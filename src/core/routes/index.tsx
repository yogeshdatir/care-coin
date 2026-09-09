import { doctorRoutes } from '@/features/health/doctors/routes';
import { medicineRoutes } from '@/features/health/medicines/routes';
import { prescriptionRoutes } from '@/features/health/prescriptions/routes';

const useAppRoutes = () => {
  const healthRoutes = [
    ...medicineRoutes,
    ...doctorRoutes,
    ...prescriptionRoutes,
  ];

  return [...healthRoutes];
};

export default useAppRoutes;
