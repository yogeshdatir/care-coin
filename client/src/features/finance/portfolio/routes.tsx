import type { RouteObject } from 'react-router';
import PortfolioPage from './PortfolioPage';

export const financeRoutes: RouteObject[] = [
  { path: '/portfolio', element: <PortfolioPage /> },
];
