import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCustomerProfile } from "../../api/admin.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";

const statusColor = {
  waiting: "bg-gray-100 text-gray-700",
  "in-service": "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const CustomerProfile = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCustomerProfile(id)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader label="Loading profile..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return null;

  const { customer, bookings, coupons, stats } = data;

  return (
    <div className="px-6 py-6 max-w-3xl">
      <Link to="/admin/customers" className="text-xs text-gray-400 mb-4 inline-block">← Back to Customers</Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">{customer.name}</h1>
          <p className="text-sm text-gray-500">
            {customer.mobileNumber} {customer.email ? `· ${customer.email}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total Spent</p>
          <PriceTag amount={stats.totalSpent} className="text-xl font-semibold text-green-600" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
          <p className="text-xs text-gray-500 mb-1">Total Visits</p>
          <p className="text-2xl font-semibold">{stats.visitCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
          <p className="text-xs text-gray-500 mb-1">Coupons (Total / Used)</p>
          <p className="text-2xl font-semibold">
            {coupons.length} / {coupons.filter((c) => c.isUsed).length}
          </p>
        </div>
      </div>

      <h3 className="text-sm font-medium text-gray-700 mb-3">Booking History</h3>
      <div className="space-y-3 mb-8">
        {bookings.length === 0 && <p className="text-sm text-gray-400">No bookings yet.</p>}
        {bookings.map((b) => {
          const totalPaid = b.paymentHistory?.reduce((sum, p) => sum + p.amount, 0) || 0;
          return (
            <div key={b._id} className="border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-sm">{b.bookingNumber}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(b.createdAt).toLocaleDateString()} · {b.timeSlot?.time}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[b.bookingStatus]}`}>
                  {b.bookingStatus}
                </span>
              </div>
              <div className="text-xs text-gray-600 space-y-0.5 mb-2">
                {b.services.map((s, i) => (
                  <div key={`s-${i}`}>{s.serviceId?.name} ({s.durationId?.durationMinutes} min) — ₹{s.price}</div>
                ))}
                {b.mocktails.map((m, i) => (
                  <div key={`m-${i}`}>{m.mocktailId?.name} x{m.qty} — ₹{m.price}</div>
                ))}
              </div>
              <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                <span className="text-gray-500">Grand Total: <PriceTag amount={b.grandTotal} /></span>
                <span className="text-gray-500">Paid: <PriceTag amount={totalPaid} /></span>
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="text-sm font-medium text-gray-700 mb-3">Coupons</h3>
      <div className="space-y-2">
        {coupons.length === 0 && <p className="text-sm text-gray-400">No coupons issued yet.</p>}
        {coupons.map((c) => (
          <div key={c._id} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-2 text-sm">
            <span className="font-mono">{c.code}</span>
            <span>{c.discountPercent}% off</span>
            <span className={c.isUsed ? "text-gray-400" : "text-green-600 font-medium"}>
              {c.isUsed ? "Used" : "Available"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerProfile;