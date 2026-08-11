import { useEffect, useState } from "react";
import { getDashboardStats,triggerDayEndCleanup } from "../../api/admin.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";

const StatCard = ({ label, value, accent = "text-gray-900" }) => (
  <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className={`text-2xl font-semibold ${accent}`}>{value}</p>
  </div>
);

const DashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cleanupRunning, setCleanupRunning] = useState(false);
const [cleanupResult, setCleanupResult] = useState(null);

const handleRunCleanup = async () => {
  setCleanupRunning(true);
  try {
    const result = await triggerDayEndCleanup();
    setCleanupResult(result);
  } catch (err) {
    setError(err.message);
  } finally {
    setCleanupRunning(false);
  }
};


  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!stats) return null;

  return (
    <div className="px-6 py-6">
<div className="flex items-center justify-between mb-2">
  <h1 className="text-xl font-semibold">Today's Overview</h1>
  <button
    onClick={handleRunCleanup}
    disabled={cleanupRunning}
    className="text-xs border border-gray-300 px-3 py-1.5 rounded-md disabled:opacity-50"
  >
    {cleanupRunning ? "Running..." : "Run Day-End Cleanup Now"}
  </button>
</div>
{cleanupResult && (
  <p className="text-xs text-gray-500 mb-6">
    Completed: {cleanupResult.completed} · Cancelled (no-show): {cleanupResult.cancelled} · Still unpaid (left in-service): {cleanupResult.stillUnpaid}
  </p>
)}
{!cleanupResult && <div className="mb-6" />}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Today's Bookings" value={stats.todaysBookings} />
        <StatCard label="Today's Revenue" value={<PriceTag amount={stats.todaysRevenue} />} accent="text-green-600" />
        <StatCard label="Unique Customers Today" value={stats.uniqueCustomersToday} />
        <StatCard label="In Service" value={stats.inServiceBookings} accent="text-orange-600" />
        <StatCard label="Waiting" value={stats.pendingBookings} />
        <StatCard label="Completed" value={stats.completedBookings} accent="text-green-600" />
        <StatCard label="Cancelled" value={stats.cancelledBookings} accent="text-red-500" />
        <StatCard label="Coupons Issued / Redeemed" value={`${stats.couponsIssued} / ${stats.couponsRedeemed}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Services Today</h3>
          {stats.popularServices.length === 0 ? (
            <p className="text-xs text-gray-400">No bookings yet today.</p>
          ) : (
            <div className="space-y-2">
              {stats.popularServices.map((s) => (
                <div key={s._id} className="flex justify-between text-sm">
                  <span>{s.name}</span>
                  <span className="text-gray-500">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Menu Items Today</h3>
          {stats.popularMocktails.length === 0 ? (
            <p className="text-xs text-gray-400">No menu items ordered yet today.</p>
          ) : (
            <div className="space-y-2">
              {stats.popularMocktails.map((m) => (
                <div key={m._id} className="flex justify-between text-sm">
                  <span>{m.name}</span>
                  <span className="text-gray-500">{m.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Peak Hours Today</h3>
          {stats.peakHours.length === 0 ? (
            <p className="text-xs text-gray-400">No bookings yet today.</p>
          ) : (
            <div className="space-y-2">
              {stats.peakHours.map((h) => (
                <div key={h._id} className="flex justify-between text-sm">
                  <span>{h.time}</span>
                  <span className="text-gray-500">{h.count} booking{h.count !== 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;