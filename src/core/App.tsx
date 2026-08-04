import { BrowserRouter } from 'react-router';

import LoadingPage from '@/shared/components/LoadingPage';
import { Suspense } from 'react';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <>
      <BrowserRouter>
        <Suspense fallback={<LoadingPage />}>
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </>
  );
}

export default App;
