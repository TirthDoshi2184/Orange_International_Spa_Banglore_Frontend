import { useEffect, useState } from "react";
import { getDashboardStats, triggerDayEndCleanup } from "../../api/admin.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";

const statIcons = {
  bookings: "M8 2v4M16 2v4M3.5 9h17M4 5h16a1 1 0 011 1v13a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z",
  revenue: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  users: "M9 12a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM3 20c0-3.5 2.7-6 6-6s6 2.5 6 6",
  clock: "M12 8v4l3 2M20 12a8 8 0 11-16 0 8 8 0 0116 0z",
  hourglass: "M6 2h12M6 22h12M6 2c0 5 6 6 6 8s-6 3-6 8M18 2c0 5-6 6-6 8s6 3 6 8",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18M6 6l12 12",
  tag: "M12 3h6a2 2 0 012 2v6l-9.5 9.5a2 2 0 01-2.8 0L3 16.3a2 2 0 010-2.8L12 3z",
};

const StatIcon = ({ name }) => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={statIcons[name]} />
  </svg>
);

const StatCard = ({ label, value, icon, tone = "ink" }) => {
  const tones = {
    ink: "bg-sand-100 text-ink-900",
    gold: "bg-gold-500/15 text-gold-600",
    green: "bg-emerald-500/15 text-emerald-700",
    amber: "bg-amber-500/15 text-amber-700",
    red: "bg-red-500/15 text-red-600",
  };
  return (
    <div className="bg-white border border-sand-200 rounded-2xl px-5 py-4 shadow-[0_4px_14px_rgba(60,40,20,0.05)]">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${tones[tone]}`}>
        <StatIcon name={icon} />
      </div>
      <p className="text-xs text-ink-600 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-display font-semibold text-ink-900">{value}</p>
    </div>
  );
};

const InfoPanel = ({ title, emptyLabel, rows, renderLeft, renderRight }) => (
  <div className="bg-white border border-sand-200 rounded-2xl px-5 py-4 shadow-[0_4px_14px_rgba(60,40,20,0.05)]">
    <h3 className="font-display font-semibold text-[15px] text-ink-900 mb-3">{title}</h3>
    {rows.length === 0 ? (
      <p className="text-xs text-ink-600/60">{emptyLabel}</p>
    ) : (
      <div className="space-y-2.5">
        {rows.map((row, i) => (
          <div key={row._id || i} className="flex justify-between text-sm">
            <span className="text-ink-900">{renderLeft(row)}</span>
            <span className="text-ink-600">{renderRight(row)}</span>
          </div>
        ))}
      </div>
    )}
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
    <div className="px-6 py-6 bg-sand-50 min-h-screen font-sans">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display font-semibold text-2xl text-ink-900">Today's Overview</h1>
        <button
          onClick={handleRunCleanup}
          disabled={cleanupRunning}
          className="text-xs font-medium border border-sand-200 bg-white text-ink-900 px-3.5 py-2 rounded-lg disabled:opacity-50 hover:border-gold-500 transition-colors"
        >
          {cleanupRunning ? "Running..." : "Run Day-End Cleanup Now"}
        </button>
      </div>
      {cleanupResult ? (
        <p className="text-xs text-ink-600 mb-6">
          Completed: {cleanupResult.completed} · Cancelled (no-show): {cleanupResult.cancelled} · Still unpaid (left in-service): {cleanupResult.stillUnpaid}
        </p>
      ) : (
        <div className="mb-6" />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Today's Bookings" value={stats.todaysBookings} icon="bookings" tone="ink" />
        <StatCard label="Today's Revenue" value={<PriceTag amount={stats.todaysRevenue} />} icon="revenue" tone="green" />
        <StatCard label="Unique Customers Today" value={stats.uniqueCustomersToday} icon="users" tone="ink" />
        <StatCard label="In Service" value={stats.inServiceBookings} icon="clock" tone="amber" />
        <StatCard label="Waiting" value={stats.pendingBookings} icon="hourglass" tone="ink" />
        <StatCard label="Completed" value={stats.completedBookings} icon="check" tone="green" />
        <StatCard label="Cancelled" value={stats.cancelledBookings} icon="x" tone="red" />
        <StatCard label="Coupons Issued / Redeemed" value={`${stats.couponsIssued} / ${stats.couponsRedeemed}`} icon="tag" tone="gold" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InfoPanel
          title="Popular Services Today"
          emptyLabel="No bookings yet today."
          rows={stats.popularServices}
          renderLeft={(s) => s.name}
          renderRight={(s) => s.count}
        />
        <InfoPanel
          title="Popular Menu Items Today"
          emptyLabel="No menu items ordered yet today."
          rows={stats.popularMocktails}
          renderLeft={(m) => m.name}
          renderRight={(m) => m.count}
        />
        <InfoPanel
          title="Peak Hours Today"
          emptyLabel="No bookings yet today."
          rows={stats.peakHours}
          renderLeft={(h) => h.time}
          renderRight={(h) => `${h.count} booking${h.count !== 1 ? "s" : ""}`}
        />
      </div>
    </div>
  );
};

export default DashboardHome;