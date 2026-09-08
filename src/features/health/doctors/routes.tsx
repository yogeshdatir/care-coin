import type { RouteObject } from 'react-router';
import DoctorsPage from './components/DoctorsPage';

export const doctorRoutes: RouteObject[] = [
  { path: '/doctors', element: <DoctorsPage /> },
];
