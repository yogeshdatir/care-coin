import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import DashboardPage from '@/features/dashboard/components/DashboardPage';
import LoadingPage from '@/shared/components/LoadingPage';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout';

const NotFound = lazy(() => import('@/shared/components/NotFound'));
const SettingsPage = lazy(
  () => import('@/features/settings/components/SettingsPage'),
);

function App() {
  return (
    <>
      <BrowserRouter>
        <Suspense fallback={<LoadingPage />}>
          <Routes>
            <Route element={<Layout />}>
              <Route
                index
                path="/"
                element={<Navigate to="/dashboard" replace />}
              />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
}

export default App;
