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
    <div className="px-6 py-6">
      <h1 className="text-xl font-semibold mb-6">Customers</h1>

      <input
        placeholder="Search by name or mobile number"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4"
      />

      {loading ? (
        <Loader label="Loading customers..." />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Visits</th>
                <th className="px-4 py-3">Total Spent</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No customers found.</td></tr>
              )}
              {customers.map((c) => (
                <tr key={c._id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.mobileNumber}</td>
                  <td className="px-4 py-3">{c.visitCount}</td>
                  <td className="px-4 py-3"><PriceTag amount={c.totalSpent} className="font-medium" /></td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/customers/${c._id}`} className="text-xs text-orange-600 font-medium">
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