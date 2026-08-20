import { useEffect, useState } from "react";
import { getAllCoupons, createCoupon, getAllCustomers } from "../../api/admin.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";

const inputClass =
  "w-full border border-sand-200 rounded-lg px-3 py-2 text-sm text-ink-900 placeholder:text-ink-600/40 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15";

const CouponsManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(10);
  const [expiryDays, setExpiryDays] = useState(30);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState("");

  const loadCoupons = () => {
    setLoading(true);
    getAllCoupons().then(setCoupons).catch((err) => setError(err.message)).finally(() => setLoading(false));
  };
  useEffect(loadCoupons, []);


  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomerResults([]);
      return;
    }
    const debounce = setTimeout(() => {
      getAllCustomers(customerSearch).then(setCustomerResults).catch(() => {});
    }, 300);
    return () => clearTimeout(debounce);
  }, [customerSearch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setCreateError("Select a customer first.");
      return;
    }
    setSaving(true);
    setCreateError("");
    try {
      const coupon = await createCoupon({
        customerId: selectedCustomer._id,
        discountPercent: Number(discountPercent),
        expiryDays: Number(expiryDays),
      });
      setCoupons((prev) => [coupon, ...prev]);
      setSelectedCustomer(null);
      setCustomerSearch("");
      setDiscountPercent(10);
      setExpiryDays(30);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-7 py-7 max-w-3xl bg-sand-50 min-h-screen font-sans">
      <h1 className="font-display font-semibold text-2xl text-ink-900 mb-6">Coupons</h1>

      <form onSubmit={handleCreate} className="bg-white border border-sand-200 rounded-2xl p-5 mb-8">
        <h3 className="font-display font-semibold text-sm text-ink-900 mb-3">Issue a New Coupon</h3>
        <ErrorMessage message={createError} />

        {selectedCustomer ? (
          <div className="flex items-center justify-between bg-gold-500/10 border border-gold-500/30 rounded-lg px-3 py-2 mb-3 text-sm">
            <span className="text-ink-900">{selectedCustomer.name} · {selectedCustomer.mobileNumber}</span>
            <button type="button" onClick={() => setSelectedCustomer(null)} className="text-xs text-ink-600 hover:text-ink-900">
              Change
            </button>
          </div>
        ) : (
          <div className="mb-3">
            <input
              placeholder="Search customer by name or mobile"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className={inputClass}
            />
            {customerResults.length > 0 && (
              <div className="border border-sand-200 rounded-lg mt-1 max-h-40 overflow-y-auto bg-white">
                {customerResults.map((c) => (
                  <button
                    type="button"
                    key={c._id}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setCustomerResults([]);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-ink-900 hover:bg-sand-50 border-b border-sand-100 last:border-0"
                  >
                    {c.name} · {c.mobileNumber}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-ink-600 block mb-1">Discount %</label>
            <input
              type="number"
              min="1"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-ink-600 block mb-1">Expires in (days)</label>
            <input
              type="number"
              min="1"
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !selectedCustomer}
          className="bg-gold-500 text-espresso-950 font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50 hover:bg-gold-400"
        >
          {saving ? "Issuing..." : "Issue Coupon"}
        </button>
      </form>

      <h3 className="font-display font-semibold text-sm text-ink-900 mb-3">All Coupons</h3>
      {loading ? (
  <Loader label="Loading coupons..." />
) : error ? (
  <ErrorMessage message={error} />
) : (
  <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-sand-50 text-left text-[11px] text-ink-600 uppercase tracking-wide">
        <tr>
          <th className="px-4 py-3 font-semibold">Code</th>
          <th className="px-4 py-3 font-semibold">Customer</th>
          <th className="px-4 py-3 font-semibold">Discount</th>
          <th className="px-4 py-3 font-semibold">Expiry</th>
          <th className="px-4 py-3 font-semibold">Status</th>
        </tr>
      </thead>
      <tbody>
        {coupons.length === 0 && (
          <tr><td colSpan={5} className="px-4 py-6 text-center text-ink-600/60">No coupons yet.</td></tr>
        )}
        {coupons.map((c) => {
          const expired = new Date(c.expiryDate) < new Date();
          return (
            <tr key={c._id} className="border-t border-sand-100 hover:bg-sand-50/60">
              <td className="px-4 py-3 font-mono text-ink-900">{c.code}</td>
              <td className="px-4 py-3 text-ink-900">
                {c.customerId?.name} <span className="text-xs text-ink-600/60">({c.customerId?.mobileNumber})</span>
              </td>
              <td className="px-4 py-3 text-ink-900">{c.discountPercent}%</td>
              <td className="px-4 py-3 text-ink-600">{new Date(c.expiryDate).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                {c.isUsed ? (
                  <span className="text-ink-600/50 text-xs">Used</span>
                ) : expired ? (
                  <span className="text-red-600 text-xs font-medium">Expired</span>
                ) : (
                  <span className="text-emerald-600 text-xs font-medium">Available</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
)}
    </div>
  );
};

export default CouponsManager;