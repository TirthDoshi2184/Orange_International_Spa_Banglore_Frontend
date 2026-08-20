import { useEffect, useState } from "react";
import { getAdminTimeSlots, createTimeSlot, updateTimeSlot } from "../../api/admin.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";

const TimeSlotsManager = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ time: "", maxCapacity: 1 });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getAdminTimeSlots().then(setSlots).catch((err) => setError(err.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.time.trim()) return;
    setSaving(true);
    setError("");
    try {
      const slot = await createTimeSlot({ time: form.time.trim(), maxCapacity: Number(form.maxCapacity) });
      setSlots((prev) => [...prev, slot]);
      setForm({ time: "", maxCapacity: 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (slot) => {
    try {
      const updated = await updateTimeSlot(slot._id, { isActive: !slot.isActive });
      setSlots((prev) => prev.map((s) => (s._id === slot._id ? updated : s)));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleDisabledToday = async (slot) => {
    try {
      const updated = await updateTimeSlot(slot._id, { isDisabledToday: !slot.isDisabledToday });
      setSlots((prev) => prev.map((s) => (s._id === slot._id ? updated : s)));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loader label="Loading time slots..." />;

  return (
    <div className="px-7 py-7 max-w-2xl bg-sand-50 min-h-screen font-sans">
      <h1 className="font-display font-semibold text-2xl text-ink-900 mb-6">Time Slots</h1>
      <ErrorMessage message={error} />

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          placeholder="e.g. 10:00 AM"
          value={form.time}
          onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
          className="flex-1 border border-sand-200 bg-white rounded-lg px-3 py-2 text-sm text-ink-900 placeholder:text-ink-600/50 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15"
        />
        <input
          type="number"
          min="1"
          placeholder="Capacity"
          value={form.maxCapacity}
          onChange={(e) => setForm((f) => ({ ...f, maxCapacity: e.target.value }))}
          className="w-28 border border-sand-200 bg-white rounded-lg px-3 py-2 text-sm text-ink-900 placeholder:text-ink-600/50 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15"
        />
        <button type="submit" disabled={saving} className="bg-gold-500 text-espresso-950 font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50 hover:bg-gold-400">
          {saving ? "Adding..." : "Add Slot"}
        </button>
      </form>

      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sand-50 text-[11px] text-ink-600 uppercase tracking-wide text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Time</th>
              <th className="px-4 py-3 font-semibold">Capacity</th>
              <th className="px-4 py-3 font-semibold">Active</th>
              <th className="px-4 py-3 font-semibold">Disabled Today</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot._id} className="border-t border-sand-100 hover:bg-sand-50/60">
                <td className="px-4 py-3 font-medium text-ink-900">{slot.time}</td>
                <td className="px-4 py-3 text-ink-900">{slot.maxCapacity}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(slot)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-md ${slot.isActive ? "bg-emerald-100 text-emerald-700" : "bg-sand-100 text-ink-600"}`}
                  >
                    {slot.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleDisabledToday(slot)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-md ${slot.isDisabledToday ? "bg-amber-100 text-amber-700" : "bg-sand-100 text-ink-600"}`}
                  >
                    {slot.isDisabledToday ? "Disabled Today" : "Available"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-600/60 mt-3">
        Note: "Disabled Today" doesn't auto-reset overnight yet — remember to re-enable it manually the next day (flagged as a known gap since Stage 1).
      </p>
    </div>
  );
};

export default TimeSlotsManager;