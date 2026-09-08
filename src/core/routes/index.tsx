import { doctorRoutes } from '@/features/health/doctors/routes';
import { medicineRoutes } from '@/features/health/medicines/routes';

const useAppRoutes = () => {
  const healthRoutes = [...medicineRoutes, ...doctorRoutes];

  return [...healthRoutes];
};

export default useAppRoutes;
