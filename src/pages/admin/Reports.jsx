import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getRevenueTrend, getPopularServicesReport, getPeakHoursReport } from "../../api/admin.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";

// Design-token hex values for recharts (SVG can't read Tailwind/CSS vars directly)
const COLORS = {
  gold: "#c9a227",
  goldDark: "#a9821e",
  espresso: "#1c130c",
  sandGrid: "#e1dbcb",
  inkAxis: "#5c4a3a",
};

const StatIcon = ({ d }) => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const StatCard = ({ label, value, sub, icon, tone = "ink" }) => {
  const tones = {
    ink: "bg-sand-100 text-ink-900",
    gold: "bg-gold-500/15 text-gold-600",
    green: "bg-emerald-500/15 text-emerald-700",
  };
  return (
    <div className="bg-white border border-sand-200 rounded-2xl px-5 py-4 shadow-[0_4px_14px_rgba(60,40,20,0.05)]">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${tones[tone]}`}>
        <StatIcon d={icon} />
      </div>
      <p className="text-xs text-ink-600 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-display font-semibold text-ink-900">{value}</p>
      {sub && <p className="text-xs text-ink-600/60 mt-0.5">{sub}</p>}
    </div>
  );
};

const ChartCard = ({ title, subtitle, children }) => (
  <div className="bg-white border border-sand-200 rounded-2xl px-5 py-5">
    <h3 className="font-display font-semibold text-sm text-ink-900 mb-0.5">{title}</h3>
    {subtitle && <p className="text-xs text-ink-600 mb-4">{subtitle}</p>}
    {!subtitle && <div className="mb-4" />}
    {children}
  </div>
);

const Reports = () => {
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [popularServices, setPopularServices] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([getRevenueTrend(days), getPopularServicesReport(30), getPeakHoursReport(30)])
      .then(([revenue, services, hours]) => {
        setRevenueTrend(revenue);
        setPopularServices(services);
        setPeakHours(hours);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <Loader label="Loading reports..." />;
  if (error) return <ErrorMessage message={error} />;

  const totalRevenue = revenueTrend.reduce((sum, r) => sum + (r.revenue || 0), 0);
  const avgDailyRevenue = revenueTrend.length ? Math.round(totalRevenue / revenueTrend.length) : 0;
  const topService = popularServices[0];
  const topHour = peakHours.length ? peakHours.reduce((a, b) => (b.count > a.count ? b : a)) : null;

  return (
    <div className="px-7 py-7 bg-sand-50 min-h-screen font-sans">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display font-semibold text-2xl text-ink-900">Reports & Analytics</h1>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="border border-sand-200 bg-white rounded-lg px-3 py-2 text-sm text-ink-900 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>
      <p className="text-sm text-ink-600 mb-6">Revenue over the last {days} days · trends below cover the last 30.</p>

      {/* Quick-read summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label={`Revenue (${days}d)`}
          value={<PriceTag amount={totalRevenue} />}
          icon="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
          tone="green"
        />
        <StatCard
          label="Avg Daily Revenue"
          value={<PriceTag amount={avgDailyRevenue} />}
          icon="M4 20V10M11 20V4M18 20v-7"
          tone="gold"
        />
        <StatCard
          label="Top Service (30d)"
          value={topService ? topService.name : "—"}
          sub={topService ? `${topService.count} bookings` : "No data yet"}
          icon="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"
          tone="ink"
        />
        <StatCard
          label="Peak Hour (30d)"
          value={topHour ? topHour.time : "—"}
          sub={topHour ? `${topHour.count} bookings` : "No data yet"}
          icon="M12 8v4l3 2M20 12a8 8 0 11-16 0 8 8 0 0116 0z"
          tone="ink"
        />
      </div>

      <ChartCard title="Revenue Trend" subtitle={`Daily revenue over the last ${days} days`}>
        {revenueTrend.length === 0 ? (
          <p className="text-sm text-ink-600/50 py-10 text-center">No revenue data yet for this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.sandGrid} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: COLORS.inkAxis }}
                tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              />
              <YAxis tick={{ fontSize: 11, fill: COLORS.inkAxis }} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "1px solid #e1dbcb", fontSize: 12 }}
                formatter={(value) => [`₹${value}`, "Revenue"]}
                labelFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              />
              <Line type="monotone" dataKey="revenue" stroke={COLORS.gold} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.gold }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <ChartCard title="Popular Services" subtitle="Most-booked treatments, last 30 days">
          {popularServices.length === 0 ? (
            <p className="text-sm text-ink-600/50 py-10 text-center">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={popularServices} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.sandGrid} />
                <XAxis type="number" tick={{ fontSize: 11, fill: COLORS.inkAxis }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: COLORS.inkAxis }} width={110} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e1dbcb", fontSize: 12 }} />
                <Bar dataKey="count" fill={COLORS.gold} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Peak Hours" subtitle="Busiest booking times, last 30 days">
          {peakHours.length === 0 ? (
            <p className="text-sm text-ink-600/50 py-10 text-center">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.sandGrid} />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: COLORS.inkAxis }} />
                <YAxis tick={{ fontSize: 11, fill: COLORS.inkAxis }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e1dbcb", fontSize: 12 }} />
                <Bar dataKey="count" fill={COLORS.espresso} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
};

export default Reports;