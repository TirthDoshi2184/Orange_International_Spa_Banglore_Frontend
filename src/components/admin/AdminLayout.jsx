import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// AdminLayout.jsx — extend navItems
const navItems = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/bookings", label: "Bookings" },
  { to: "/admin/services", label: "Services" },
  { to: "/admin/mocktails", label: "Menu" },
  { to: "/admin/timeslots", label: "Time Slots" },
  { to: "/admin/rooms", label: "Rooms" },
  { to: "/admin/reception", label: "Reception Checkout" },
  { to: "/admin/customers", label: "Customers" },
  { to: "/admin/coupons", label: "Coupons" },
  { to: "/admin/reports", label: "Reports" },
];
const AdminLayout = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="px-5 py-5 text-lg font-semibold border-b border-gray-800">
          Orange Spa Admin
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm ${
                  isActive ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-gray-800"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={logout}
          className="m-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-md text-left"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;