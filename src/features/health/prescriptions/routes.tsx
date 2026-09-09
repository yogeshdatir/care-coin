import type { RouteObject } from 'react-router';
import PrescriptionsPage from './components/PrescriptionsPage';

export const prescriptionRoutes: RouteObject[] = [
  { path: '/prescriptions', element: <PrescriptionsPage /> },
];
