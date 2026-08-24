import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  getMembershipDetail, getMembershipPackages, rechargeMembership, adjustMembership,
} from "../../api/membership.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";

const inputClass =
  "w-full border border-sand-200 bg-white rounded-xl px-4 py-2.5 text-sm text-ink-900 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15";

const typeLabels = {
  purchase: "Membership Purchase",
  recharge: "Recharge",
  service_deduction: "Service Payment",
  addon_deduction: "Add-On Payment",
  manual_adjustment: "Manual Adjustment",
  cancellation_reversal: "Cancellation Reversal",
};

const MembershipDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [rechargeForm, setRechargeForm] = useState({ packageId: "", amountPaid: "", paymentMethod: "cash", reference: "" });

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ amount: "", reason: "" });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    Promise.all([getMembershipDetail(id), getMembershipPackages()]).then(([d, p]) => {
      setData(d);
      setPackages(p);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [id]);

  const onRechargePackageChange = (packageId) => {
    const pkg = packages.find((p) => p._id === packageId);
    setRechargeForm((f) => ({ ...f, packageId, amountPaid: pkg ? String(pkg.price) : "" }));
  };

  const handleRecharge = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await rechargeMembership(id, {
        packageId: rechargeForm.packageId,
        amountPaid: Number(rechargeForm.amountPaid),
        paymentMethod: rechargeForm.paymentMethod,
        reference: rechargeForm.reference || undefined,
      });
      setRechargeOpen(false);
      setRechargeForm({ packageId: "", amountPaid: "", paymentMethod: "cash", reference: "" });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await adjustMembership(id, { amount: Number(adjustForm.amount), reason: adjustForm.reason });
      setAdjustOpen(false);
      setAdjustForm({ amount: "", reason: "" });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader label="Loading membership..." />;
  if (!data) return <ErrorMessage message="Membership not found" />;

  const { membership, transactions } = data;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="bg-white border border-sand-200 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display font-semibold text-xl text-ink-900">{membership.customerId?.name}</h1>
          <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
            membership.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}>{membership.status}</span>
        </div>
        <p className="text-sm text-ink-600 mb-4">{membership.customerId?.mobileNumber} · {membership.membershipId} · {membership.tier} Member</p>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-sand-50 rounded-xl p-3">
            <p className="text-ink-600 text-xs mb-1">Available Balance</p>
            <PriceTag amount={membership.balance} className="text-lg font-semibold text-emerald-700" />
          </div>
          <div className="bg-sand-50 rounded-xl p-3">
            <p className="text-ink-600 text-xs mb-1">Total Credit Purchased</p>
            <PriceTag amount={membership.totalCreditEver} className="font-medium" />
          </div>
          <div className="bg-sand-50 rounded-xl p-3">
            <p className="text-ink-600 text-xs mb-1">Total Used</p>
            <PriceTag amount={membership.totalUsedEver} className="font-medium" />
          </div>
        </div>
        {membership.expiresAt && (
          <p className="text-xs text-ink-600 mt-3">Valid until {new Date(membership.expiresAt).toLocaleDateString("en-IN")}</p>
        )}
      </div>

      <ErrorMessage message={error} />

      <div className="flex gap-2 mb-6">
        <button onClick={() => { setRechargeOpen((v) => !v); setAdjustOpen(false); }}
          className="flex-1 bg-gold-500 text-espresso-950 font-semibold py-2.5 rounded-lg">Recharge</button>
        <button onClick={() => { setAdjustOpen((v) => !v); setRechargeOpen(false); }}
          className="flex-1 border border-sand-200 bg-white text-ink-900 py-2.5 rounded-lg">Manual Adjustment</button>
      </div>

      {rechargeOpen && (
        <form onSubmit={handleRecharge} className="bg-white border border-sand-200 rounded-2xl p-5 space-y-3 mb-6">
          <select className={inputClass} value={rechargeForm.packageId} onChange={(e) => onRechargePackageChange(e.target.value)} required>
            <option value="">Select Package to Recharge</option>
            {packages.map((p) => (
              <option key={p._id} value={p._id}>{p.name} — Pay ₹{p.price.toLocaleString("en-IN")} get ₹{p.creditAmount.toLocaleString("en-IN")}</option>
            ))}
          </select>
          <input className={inputClass} type="number" placeholder="Amount Paid" value={rechargeForm.amountPaid}
            onChange={(e) => setRechargeForm((f) => ({ ...f, amountPaid: e.target.value }))} required />
          <select className={inputClass} value={rechargeForm.paymentMethod}
            onChange={(e) => setRechargeForm((f) => ({ ...f, paymentMethod: e.target.value }))}>
            <option value="cash">Cash</option><option value="card">Card</option>
            <option value="upi">UPI</option><option value="razorpay">Razorpay</option><option value="other">Other</option>
          </select>
          <button type="submit" disabled={submitting} className="w-full bg-gold-500 text-espresso-950 font-semibold py-2.5 rounded-lg disabled:opacity-50">
            {submitting ? "Processing..." : "Confirm Recharge"}
          </button>
        </form>
      )}

      {adjustOpen && (
        <form onSubmit={handleAdjust} className="bg-white border border-sand-200 rounded-2xl p-5 space-y-3 mb-6">
          <input className={inputClass} type="number" placeholder="Amount (+ to add, - to deduct)" value={adjustForm.amount}
            onChange={(e) => setAdjustForm((f) => ({ ...f, amount: e.target.value }))} required />
          <input className={inputClass} placeholder="Reason (required)" value={adjustForm.reason}
            onChange={(e) => setAdjustForm((f) => ({ ...f, reason: e.target.value }))} required />
          <button type="submit" disabled={submitting} className="w-full bg-espresso-950 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50">
            {submitting ? "Saving..." : "Apply Adjustment"}
          </button>
        </form>
      )}

      <h2 className="font-medium text-ink-900 mb-3">Transaction History</h2>
      <div className="space-y-2">
        {transactions.map((t) => (
          <div key={t._id} className="bg-white border border-sand-200 rounded-xl px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium text-ink-900">{typeLabels[t.type] || t.type}</span>
              <PriceTag amount={t.amount} className={t.amount >= 0 ? "text-emerald-700 font-semibold" : "text-red-600 font-semibold"} />
            </div>
            <div className="flex justify-between text-xs text-ink-600 mt-1">
              <span>{new Date(t.createdAt).toLocaleString("en-IN")} · by {t.performedBy?.name || "—"}</span>
              <span>Balance: ₹{t.balanceBefore.toLocaleString("en-IN")} → ₹{t.balanceAfter.toLocaleString("en-IN")}</span>
            </div>
            {t.reason && <p className="text-xs text-ink-600 mt-1 italic">Reason: {t.reason}</p>}
            {t.bookingId?.bookingNumber && <p className="text-xs text-ink-600 mt-1">Booking: {t.bookingId.bookingNumber}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MembershipDetail;