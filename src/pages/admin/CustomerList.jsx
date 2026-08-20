import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllCustomers } from "../../api/admin.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";

const CustomersList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = (q) => {
    setLoading(true);
    getAllCustomers(q).then(setCustomers).catch((err) => setError(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => {
    const debounce = setTimeout(() => load(search), 300);
    return () => clearTimeout(debounce);
  }, [search]);

  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="px-7 py-7 bg-sand-50 min-h-screen font-sans">
      <h1 className="font-display font-semibold text-2xl text-ink-900 mb-6">Customers</h1>

      <input
        placeholder="Search by name or mobile number"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md border border-sand-200 bg-white rounded-lg px-3 py-2 text-sm text-ink-900 placeholder:text-ink-600/50 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15 mb-5"
      />

      {loading ? (
        <Loader label="Loading customers..." />
      ) : (
        <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-sand-50 text-left text-[11px] text-ink-600 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Mobile</th>
                <th className="px-4 py-3 font-semibold">Visits</th>
                <th className="px-4 py-3 font-semibold">Total Spent</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-ink-600/60">No customers found.</td></tr>
              )}
              {customers.map((c) => (
                <tr key={c._id} className="border-t border-sand-100 hover:bg-sand-50/60">
                  <td className="px-4 py-3 font-medium text-ink-900">{c.name}</td>
                  <td className="px-4 py-3 text-ink-600">{c.mobileNumber}</td>
                  <td className="px-4 py-3 text-ink-900">{c.visitCount}</td>
                  <td className="px-4 py-3"><PriceTag amount={c.totalSpent} className="font-medium text-ink-900" /></td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/customers/${c._id}`} className="text-xs text-gold-600 font-medium hover:text-gold-700">
                      View Profile →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomersList;