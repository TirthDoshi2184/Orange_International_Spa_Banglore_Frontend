import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMembershipPackages, createMembership, searchMemberships,
} from "../../api/membership.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";

const inputClass =
  "w-full border border-sand-200 bg-white rounded-xl px-4 py-2.5 text-sm text-ink-900 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15";

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

const emptyForm = {
  name: "", mobileNumber: "", email: "", packageId: "",
  amountPaid: "", paymentMethod: "cash", reference: "",
};

const Memberships = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchPhone, setSearchPhone] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    Promise.all([getMembershipPackages(), searchMemberships({})])
      .then(([pkgs, memberships]) => {
        setPackages(pkgs);
        setResults(memberships);
        setSearched(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearched(true);
    const data = await searchMemberships({ phone: searchPhone });
    setResults(data);
  };

  // ---- Enroll: package / payment maths ----
  const selectedPkg = packages.find((p) => p._id === form.packageId);
  const paid = Number(form.amountPaid || 0);
  const due = selectedPkg ? selectedPkg.price - paid : 0;
  const enrollInvalid = !selectedPkg || paid <= 0 || paid > selectedPkg.price;

  const onPackageChange = (packageId) => {
    const pkg = packages.find((p) => p._id === packageId);
    setForm((f) => ({ ...f, packageId, amountPaid: pkg ? String(pkg.price) : "" }));
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const result = await createMembership({
        customer: { name: form.name, mobileNumber: form.mobileNumber, email: form.email || undefined },
        packageId: form.packageId,
        amountPaid: Number(form.amountPaid),
        paymentMethod: form.paymentMethod,
        reference: form.reference || undefined,
      });
      navigate(`/admin/memberships/${result.membership._id}`);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader label="Loading packages..." />;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-semibold text-2xl text-ink-900">Memberships</h1>
        <button
          onClick={() => setEnrollOpen((v) => !v)}
          className="bg-gold-500 text-espresso-950 font-semibold px-4 py-2 rounded-lg hover:bg-gold-400"
        >
          {enrollOpen ? "Cancel" : "+ New Membership"}
        </button>
      </div>

      {enrollOpen && (
        <form onSubmit={handleEnroll} className="bg-white border border-sand-200 rounded-2xl p-5 space-y-3 mb-8">
          <h2 className="font-medium text-ink-900 mb-2">Enroll New Member</h2>
          <ErrorMessage message={formError} />

          <input className={inputClass} placeholder="Customer Name" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <input className={inputClass} placeholder="Mobile Number" value={form.mobileNumber}
            onChange={(e) => setForm((f) => ({ ...f, mobileNumber: e.target.value }))} required />
          <input className={inputClass} placeholder="Email (optional)" value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />

          <select className={inputClass} value={form.packageId} onChange={(e) => onPackageChange(e.target.value)} required>
            <option value="">Select Package</option>
            {packages.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} — Pay ₹{fmt(p.price)} get ₹{fmt(p.creditAmount)} credit
              </option>
            ))}
          </select>

          <div>
            <input
              className={inputClass} type="number" min="1" max={selectedPkg?.price}
              placeholder="Amount Paid Now" value={form.amountPaid}
              onChange={(e) => setForm((f) => ({ ...f, amountPaid: e.target.value }))} required
            />
            {selectedPkg && paid > selectedPkg.price && (
              <p className="text-xs text-red-600 mt-1">
                Cannot exceed package price of ₹{fmt(selectedPkg.price)}
              </p>
            )}
          </div>

          {/* Live payment summary */}
          {selectedPkg && paid > 0 && paid <= selectedPkg.price && (
            <div className="bg-sand-50 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-ink-600">Package price</span>
                <span className="text-ink-900">₹{fmt(selectedPkg.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-600">Paying now</span>
                <span className="text-emerald-700 font-medium">₹{fmt(paid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-600">Credit added</span>
                <span className="text-ink-900">₹{fmt(selectedPkg.creditAmount)}</span>
              </div>
              {due > 0 && (
                <div className="flex justify-between border-t border-sand-200 pt-1 mt-1">
                  <span className="text-red-700 font-medium">Balance due (collect later)</span>
                  <span className="text-red-700 font-semibold">₹{fmt(due)}</span>
                </div>
              )}
            </div>
          )}

          <select className={inputClass} value={form.paymentMethod}
            onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="razorpay">Razorpay</option>
            <option value="other">Other</option>
          </select>

          <input className={inputClass} placeholder="Payment Reference (optional)" value={form.reference}
            onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} />

          <button type="submit" disabled={submitting || enrollInvalid}
            className="w-full bg-gold-500 text-espresso-950 font-semibold py-2.5 rounded-lg disabled:opacity-50">
            {submitting ? "Creating..." : "Create Membership"}
          </button>
        </form>
      )}

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input className={inputClass} placeholder="Search by phone number" value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)} />
        <button type="submit" className="bg-espresso-950 text-white px-4 py-2.5 rounded-lg text-sm">Search</button>
      </form>

      {searched && results.length === 0 && (
        <p className="text-sm text-ink-600">No membership found for that number.</p>
      )}

      <div className="space-y-2">
        {results.map((m) => (
          <button
            key={m._id}
            onClick={() => navigate(`/admin/memberships/${m._id}`)}
            className="w-full flex items-center justify-between bg-white border border-sand-200 rounded-xl px-4 py-3 hover:border-gold-500 text-left"
          >
            <div>
              <p className="font-medium text-ink-900">{m.customerId?.name}</p>
              <p className="text-xs text-ink-600">
                {m.customerId?.mobileNumber} · {m.membershipId} · {m.tier}
              </p>
            </div>
            <div className="text-right">
              <PriceTag amount={m.balance} className="font-semibold" />
              {m.amountDue > 0 && (
                <p className="text-xs font-medium text-red-600 mt-0.5">Due ₹{fmt(m.amountDue)}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Memberships;