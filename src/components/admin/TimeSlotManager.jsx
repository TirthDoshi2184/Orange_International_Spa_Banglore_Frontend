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
    <div className="px-6 py-6 max-w-2xl">
      <h1 className="text-xl font-semibold mb-6">Time Slots</h1>
      <ErrorMessage message={error} />

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          placeholder="e.g. 10:00 AM"
          value={form.time}
          onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="number"
          min="1"
          placeholder="Capacity"
          value={form.maxCapacity}
          onChange={(e) => setForm((f) => ({ ...f, maxCapacity: e.target.value }))}
          className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <button type="submit" disabled={saving} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
          {saving ? "Adding..." : "Add Slot"}
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase text-left">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Capacity</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Disabled Today</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot._id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium">{slot.time}</td>
                <td className="px-4 py-3">{slot.maxCapacity}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(slot)}
                    className={`text-xs px-2.5 py-1 rounded-md ${slot.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {slot.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleDisabledToday(slot)}
                    className={`text-xs px-2.5 py-1 rounded-md ${slot.isDisabledToday ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {slot.isDisabledToday ? "Disabled Today" : "Available"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-3">
        Note: "Disabled Today" doesn't auto-reset overnight yet — remember to re-enable it manually the next day (flagged as a known gap since Stage 1).
      </p>
    </div>
  );
};

export default TimeSlotsManager;