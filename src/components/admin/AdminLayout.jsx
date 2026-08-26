import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNewOrdersCount } from "../../hooks/useNewOrdersCount";
import { getAddonOrders } from "../../api/admin.api"; // adjust name/path if different
import logoMark from "../../assets/logo-mark.png";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: "grid" },
  { to: "/admin/reception", label: "Reception Checkout", icon: "desk" },
  { to: "/admin/orders", label: "Live Orders", icon: "bell", showBadge: true },
  { to: "/admin/bookings", label: "Bookings", icon: "calendar" },
  { to: "/admin/live-sessions", label: "Live Sessions", icon: "clock" },
  { to: "/admin/memberships", label: "Memberships", icon: "wallet" },
  { to: "/admin/customers", label: "Customers", icon: "users" },
  { to: "/admin/reports", label: "Reports", icon: "chart" },
  { to: "/admin/services", label: "Services", icon: "sparkle" },
  { to: "/admin/mocktails", label: "Menu", icon: "cup" },
  { to: "/admin/timeslots", label: "Time Slots", icon: "clock" },
  { to: "/admin/rooms", label: "Rooms", icon: "door" },
  { to: "/admin/coupons", label: "Coupons", icon: "tag" },
];

const icons = {
  grid: "M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z",
  bell: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0",
  calendar: "M8 2v4M16 2v4M3.5 9h17M4 5h16a1 1 0 011 1v13a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z",
  cup: "M6 3h12l-1 11a5 5 0 01-10 0L6 3zM6 8H3.5a2 2 0 000 4H6",
  clock: "M12 8v4l3 2M20 12a8 8 0 11-16 0 8 8 0 0116 0z",
  door: "M6 3h9v18H6zM15 3l3 1v16l-3 1M11 12v.01",
  desk: "M3 20V9l9-5 9 5v11M3 12h18M9 20v-5h6v5",
  users: "M9 12a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M16.5 8.5a3 3 0 110-6M18 14c2 .3 3 1.8 3 5",
  tag: "M12 3h6a2 2 0 012 2v6l-9.5 9.5a2 2 0 01-2.8 0L3 16.3a2 2 0 010-2.8L12 3zM15.5 8.5h.01",
  chart: "M4 20V10M11 20V4M18 20v-7",
  wallet: "M3 7a2 2 0 012-2h13a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM16 12h3M16 12a1.5 1.5 0 010-3h3v3",
};

const NavIcon = ({ name }) => (
  <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d={icons[name]} />
  </svg>
);

const AdminLayout = () => {
  const { logout } = useAuth();
  const { newCount, markAllSeen, latestOrderId } = useNewOrdersCount(getAddonOrders);

  return (
    <div className="min-h-screen flex bg-sand-50 font-sans">
      <aside className="w-60 bg-espresso-950 text-parchment-50 flex flex-col flex-shrink-0">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-espresso-800">
          <img src={logoMark} alt="" className="w-9 h-9 rounded-full object-cover border border-gold-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-display font-semibold text-[15px] text-gold-300 leading-tight truncate">
              Orange International Spa
            </p>
            <p className="text-[10px] uppercase tracking-widest text-parchment-200/50 mt-0.5">Admin</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => item.showBadge && markAllSeen(latestOrderId)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm border-l-2 transition-colors ${
                  isActive
                    ? "bg-espresso-800 text-gold-300 border-gold-500 font-medium"
                    : "text-parchment-200/70 border-transparent hover:bg-espresso-900 hover:text-parchment-50"
                }`
              }
            >
              <NavIcon name={item.icon} />
              <span className="flex-1">{item.label}</span>
              {item.showBadge && newCount > 0 && (
                <span className="inline-flex items-center justify-center bg-red-500 text-white text-[11px] font-semibold rounded-full h-5 min-w-[20px] px-1">
                  {newCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={logout}
          className="m-3 px-3 py-2.5 text-sm text-parchment-200/70 hover:bg-espresso-900 hover:text-parchment-50 rounded-lg text-left flex items-center gap-2.5"
        >
          <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Log out
        </button>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
