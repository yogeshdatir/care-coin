import type { RouteObject } from 'react-router';
import DoctorsPage from './components/DoctorsPage';
import DoctorDetailPage from './components/DoctorDetailPage';

export const doctorRoutes: RouteObject[] = [
  { path: '/doctors', element: <DoctorsPage /> },
  { path: '/doctor/:id', element: <DoctorDetailPage /> },
];
