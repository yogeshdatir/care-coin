import { Outlet } from 'react-router';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="flex gap-2">
      <Sidebar />
      <Outlet />
    </div>
  );
};

export default Layout;
