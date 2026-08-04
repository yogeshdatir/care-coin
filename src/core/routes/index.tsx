import { medicineRoutes } from '@/features/health/medicines/routes';

const useAppRoutes = () => {
  const healthRoutes = [...medicineRoutes];

  return [...healthRoutes];
};

export default useAppRoutes;
