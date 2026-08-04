import type { RouteObject } from 'react-router';
import MedicinesPage from './components/MedicinesPage';

export const medicineRoutes: RouteObject[] = [
  { path: '/medicines', element: <MedicinesPage /> },
];
