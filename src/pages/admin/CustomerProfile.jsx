import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCustomerProfile } from "../../api/admin.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";

const statusColor = {
  waiting: "bg-sand-100 text-ink-600",
  "in-service": "bg-gold-500/15 text-gold-700",
  completed: "bg-emerald-100 text-emerald-700",
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
    <div className="px-7 py-7 max-w-3xl bg-sand-50 min-h-screen font-sans">
      <Link to="/admin/customers" className="text-xs text-ink-600 hover:text-ink-900 mb-4 inline-block">← Back to Customers</Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-semibold text-2xl text-ink-900">{customer.name}</h1>
          <p className="text-sm text-ink-600">
            {customer.mobileNumber} {customer.email ? `· ${customer.email}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-600 uppercase tracking-wide">Total Spent</p>
          <PriceTag amount={stats.totalSpent} className="text-xl font-display font-semibold text-emerald-600" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-sand-200 rounded-2xl px-5 py-4">
          <p className="text-xs text-ink-600 uppercase tracking-wide mb-1">Total Visits</p>
          <p className="text-2xl font-display font-semibold text-ink-900">{stats.visitCount}</p>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl px-5 py-4">
          <p className="text-xs text-ink-600 uppercase tracking-wide mb-1">Coupons (Total / Used)</p>
          <p className="text-2xl font-display font-semibold text-ink-900">
            {coupons.length} / {coupons.filter((c) => c.isUsed).length}
          </p>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-ink-900 mb-3">Booking History</h3>
      <div className="space-y-3 mb-8">
        {bookings.length === 0 && <p className="text-sm text-ink-600/50">No bookings yet.</p>}
        {bookings.map((b) => {
          const totalPaid = b.paymentHistory?.reduce((sum, p) => sum + p.amount, 0) || 0;
          return (
            <div key={b._id} className="bg-white border border-sand-200 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-sm text-ink-900">{b.bookingNumber}</span>
                  <span className="text-xs text-ink-600/60 ml-2">
                    {new Date(b.createdAt).toLocaleDateString()} · {b.timeSlot?.time}
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor[b.bookingStatus]}`}>
                  {b.bookingStatus}
                </span>
              </div>
              <div className="text-xs text-ink-600 space-y-0.5 mb-2">
                {b.services.map((s, i) => (
                  <div key={`s-${i}`}>{s.serviceId?.name} ({s.durationId?.durationMinutes} min) — ₹{s.price}</div>
                ))}
                {b.mocktails.map((m, i) => (
                  <div key={`m-${i}`}>{m.mocktailId?.name} x{m.qty} — ₹{m.price}</div>
                ))}
              </div>
              <div className="flex justify-between text-sm border-t border-sand-100 pt-2">
                <span className="text-ink-600">Grand Total: <PriceTag amount={b.grandTotal} className="text-ink-900 font-medium" /></span>
                <span className="text-ink-600">Paid: <PriceTag amount={totalPaid} className="text-ink-900 font-medium" /></span>
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="text-sm font-semibold text-ink-900 mb-3">Coupons</h3>
      <div className="space-y-2">
        {coupons.length === 0 && <p className="text-sm text-ink-600/50">No coupons issued yet.</p>}
        {coupons.map((c) => (
          <div key={c._id} className="flex items-center justify-between bg-white border border-sand-200 rounded-lg px-4 py-2 text-sm">
            <span className="font-mono text-ink-900">{c.code}</span>
            <span className="text-ink-600">{c.discountPercent}% off</span>
            <span className={c.isUsed ? "text-ink-600/50" : "text-emerald-600 font-medium"}>
              {c.isUsed ? "Used" : "Available"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerProfile;