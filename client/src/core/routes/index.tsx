import { doctorRoutes } from '@/features/health/doctors/routes';
import { medicineRoutes } from '@/features/health/medicines/routes';
import { prescriptionRoutes } from '@/features/health/prescriptions/routes';
import { financeRoutes } from '@/features/finance/portfolio/routes';

const useAppRoutes = () => {
  const healthRoutes = [
    ...medicineRoutes,
    ...doctorRoutes,
    ...prescriptionRoutes,
    ...financeRoutes,
  ];

  return [...healthRoutes];
};

export default useAppRoutes;
