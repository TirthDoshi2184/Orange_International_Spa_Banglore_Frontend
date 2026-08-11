import { Outlet, Link } from "react-router-dom";
import LanguageSwitcher from "../shared/LanguageShared";

const CustomerLayout = () => {
  return (
    <div>
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <Link to="/" className="font-semibold text-gray-900">Orange International Spa</Link>
        <LanguageSwitcher />
      </header>
      <Outlet />
    </div>
  );
};

export default CustomerLayout;