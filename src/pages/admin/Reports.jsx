import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getRevenueTrend, getPopularServicesReport, getPeakHoursReport } from "../../api/admin.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";

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

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Reports & Analytics</h1>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl px-5 py-5 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={revenueTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value) => [`₹${value}`, "Revenue"]}
              labelFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            />
            <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-5">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Popular Services (30 days)</h3>
          {popularServices.length === 0 ? (
            <p className="text-xs text-gray-400">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={popularServices} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} />
                <Tooltip />
                <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl px-5 py-5">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Peak Hours (30 days)</h3>
          {peakHours.length === 0 ? (
            <p className="text-xs text-gray-400">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1f2937" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;