import { NavLink } from 'react-router';

const Sidebar = () => {
  return (
    <div className="flex flex-col gap-3">
      <NavLink to="/dashboard">Home</NavLink>
      <NavLink to="/medicines">Medicines</NavLink>
      <NavLink to="/settings">Settings</NavLink>
    </div>
  );
};

export default Sidebar;
