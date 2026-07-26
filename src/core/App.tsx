import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import Layout from './components/Layout';
import DashboardPage from '@/features/dashboard/components/DashboardPage';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
