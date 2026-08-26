import { Routes, Route } from "react-router-dom";
import ServiceCatalogue from "./pages/customer/ServiceCatalogue";
import ServiceDetail from "./pages/customer/ServiceDetail";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import BookingConfirmation from "./pages/customer/BookingConfirmation";
import AddOnOrder from "./pages/customer/AddOnOrder";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import AdminRoute from "./routes/AdminRoutes";
import DashboardHome from "./pages/admin/DashboardHome";
import BookingsTable from "./pages/admin/BookingsTable";
import ReceptionCheckout from "./pages/admin/ReceptionCheckout";
import ServicesManager from "./components/admin/ServicesManager";
import MocktailsManager from "./components/admin/MocktailsManager";
import TimeSlotsManager from "./components/admin/TimeSlotManager";
import RoomsManager from "./components/admin/RoomManager";
import CustomersList from "./pages/admin/CustomerList";
import CustomerProfile from "./pages/admin/CustomerProfile";
import CouponsManager from "./pages/admin/CouponsManager";
import Reports from "./pages/admin/Reports";
import InvoiceView from "./pages/admin/InvoiceView";

import CustomerLayout from "./components/customer/CustomerLayout";
import LiveOrders from "./pages/admin/LiveOrder";
import Memberships from "./pages/admin/Memberships";
import MembershipDetail from "./pages/admin/MembershipDetail";
import LiveSessions from "./pages/admin/LiveSession";
const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
 <Routes>, 
<Route element={<CustomerLayout />}>
  <Route path="/" element={<ServiceCatalogue />} />
  <Route path="/services/:id" element={<ServiceDetail />} />
  <Route path="/cart" element={<Cart />} />
  <Route path="/checkout" element={<Checkout />} />
  <Route path="/booking/:id" element={<BookingConfirmation />} />
  <Route path="/addon/:roomId" element={<AddOnOrder />} />
</Route>
        <Route path="/admin/login" element={<AdminLogin />} />
// App.jsx — add inside the nested /admin route

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="bookings" element={<BookingsTable />} />
          <Route path="reception" element={<ReceptionCheckout />} />
          <Route path="services" element={<ServicesManager />} />
<Route path="mocktails" element={<MocktailsManager />} />
<Route path="timeslots" element={<TimeSlotsManager />} />
<Route path="rooms" element={<RoomsManager />} />
<Route path="customers" element={<CustomersList />} />
<Route path="customers/:id" element={<CustomerProfile />} />
<Route path="coupons" element={<CouponsManager />} />
<Route path="reports" element={<Reports />} />
<Route path="bookings/:id/invoice" element={<InvoiceView />} />
<Route path="live-sessions" element={<LiveSessions />} />
<Route path="orders" element={<LiveOrders />} />
<Route path="memberships" element={<Memberships />} />
<Route path="memberships/:id" element={<MembershipDetail />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;