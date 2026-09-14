import type { RouteObject } from 'react-router';
import PrescriptionsPage from './components/PrescriptionsPage';
import PrescriptionDetailPage from './components/PrescriptionDetailPage';

export const prescriptionRoutes: RouteObject[] = [
  { path: '/prescriptions', element: <PrescriptionsPage /> },
  { path: '/prescriptions/:id', element: <PrescriptionDetailPage /> },
];
