import { Outlet } from 'react-router';
import Sidebar from './Sidebar';

const RootLayout = () => {
  return (
    <div className="flex gap-2">
      <Sidebar />
      <div className="flex-1 px-5">
        <Outlet />
      </div>
    </div>
  );
};

export default RootLayout;
