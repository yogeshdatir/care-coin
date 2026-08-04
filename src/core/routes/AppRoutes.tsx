import { Navigate, useRoutes } from 'react-router';
import useAppRoutes from '.';
import RootLayout from '../layout/RootLayout';
import DashboardPage from '../app/DashboardPage';
import NotFound from '@/shared/components/NotFound';
import SettingsPage from '../app/SettingsPage';

const AppRoutes = () => {
  const featureRoutes = useAppRoutes();
  const coreRoutes = [
    {
      element: <RootLayout />,
      children: [
        {
          index: true,
          path: '/',
          element: <Navigate to="/dashboard" replace />,
        },
        {
          path: '/dashboard',
          element: <DashboardPage />,
        },
        {
          path: '/settings',
          element: <SettingsPage />,
        },
        ...featureRoutes,
        {
          path: '*',
          element: <NotFound />,
        },
      ],
    },
  ];
  const routes = useRoutes(coreRoutes);

  return routes;
};

export default AppRoutes;
