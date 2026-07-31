import { useEffect, useState } from "react";
import {
  getAdminServices, createService, updateService, deleteService,
  addServiceDuration, updateServiceDuration, deleteServiceDuration,
} from "../../api/admin.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";

const emptyForm = {
  name: "", name_kn: "",
  category: "",
  description: "", description_kn: "",
  benefits: "", benefits_kn: "",
  instructions: "", instructions_kn: "",
  images: "",
};
const ServicesManager = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [durationForms, setDurationForms] = useState({}); // { [serviceId]: {durationMinutes, price} }

  const load = () => {
    setLoading(true);
    getAdminServices().then(setServices).catch((err) => setError(err.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (s) => {
  setForm({
    name: s.name, name_kn: s.name_kn || "",
    category: s.category,
    description: s.description || "", description_kn: s.description_kn || "",
    benefits: (s.benefits || []).join(", "), benefits_kn: (s.benefits_kn || []).join(", "),
    instructions: (s.instructions || []).join(", "), instructions_kn: (s.instructions_kn || []).join(", "),
    images: (s.images || []).join(", "),
  });
  setEditingId(s._id);
};
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim()) return;
    setSaving(true);
    setError("");
    const payload = {
  name: form.name.trim(), name_kn: form.name_kn.trim(),
  category: form.category.trim(),
  description: form.description.trim(), description_kn: form.description_kn.trim(),
  benefits: form.benefits.split(",").map((b) => b.trim()).filter(Boolean),
  benefits_kn: form.benefits_kn.split(",").map((b) => b.trim()).filter(Boolean),
  instructions: form.instructions.split(",").map((i) => i.trim()).filter(Boolean),
  instructions_kn: form.instructions_kn.split(",").map((i) => i.trim()).filter(Boolean),
  images: form.images.split(",").map((i) => i.trim()).filter(Boolean),
};
    try {
      if (editingId) {
        const updated = await updateService(editingId, payload);
        setServices((prev) => prev.map((s) => (s._id === editingId ? { ...s, ...updated } : s)));
      } else {
        const created = await createService(payload);
        setServices((prev) => [...prev, { ...created, durations: [] }]);
      }
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s) => {
    try {
      const updated = await updateService(s._id, { isActive: !s.isActive });
      setServices((prev) => prev.map((x) => (x._id === s._id ? { ...x, ...updated } : x)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this service and all its durations permanently?")) return;
    try {
      await deleteService(id);
      setServices((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddDuration = async (serviceId) => {
    const df = durationForms[serviceId];
    if (!df?.durationMinutes || !df?.price) return;
    try {
      const duration = await addServiceDuration(serviceId, {
        durationMinutes: Number(df.durationMinutes),
        price: Number(df.price),
      });
      setServices((prev) =>
        prev.map((s) => (s._id === serviceId ? { ...s, durations: [...s.durations, duration] } : s))
      );
      setDurationForms((prev) => ({ ...prev, [serviceId]: { durationMinutes: "", price: "" } }));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleDurationActive = async (serviceId, duration) => {
    try {
      const updated = await updateServiceDuration(duration._id, { isActive: !duration.isActive });
      setServices((prev) =>
        prev.map((s) =>
          s._id === serviceId
            ? { ...s, durations: s.durations.map((d) => (d._id === duration._id ? updated : d)) }
            : s
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteDuration = async (serviceId, durationId) => {
    try {
      await deleteServiceDuration(durationId);
      setServices((prev) =>
        prev.map((s) => (s._id === serviceId ? { ...s, durations: s.durations.filter((d) => d._id !== durationId) } : s))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loader label="Loading services..." />;

  return (
    <div className="px-6 py-6 max-w-3xl">
      <h1 className="text-xl font-semibold mb-6">Services</h1>
      <ErrorMessage message={error} />

      <form onSubmit={handleSubmit} className="border border-gray-200 rounded-xl p-4 mb-6 grid grid-cols-2 gap-3">
        <input placeholder="Name (English)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
<input placeholder="Name (Kannada)" value={form.name_kn} onChange={(e) => setForm((f) => ({ ...f, name_kn: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <input placeholder="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <input placeholder="Description (English)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2" />
<input placeholder="Description (Kannada)" value={form.description_kn} onChange={(e) => setForm((f) => ({ ...f, description_kn: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2" />
        <input placeholder="Benefits (comma separated, English)" value={form.benefits} onChange={(e) => setForm((f) => ({ ...f, benefits: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2" />
        <input placeholder="Benefits (comma separated, Kannada)" value={form.benefits_kn} onChange={(e) => setForm((f) => ({ ...f, benefits_kn: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2" />
        <input placeholder="Instructions (comma separated, English)" value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2" />
        <input placeholder="Instructions (comma separated, Kannada)" value={form.instructions_kn} onChange={(e) => setForm((f) => ({ ...f, instructions_kn: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2" />
        <input placeholder="Image URLs (comma separated)" value={form.images} onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2" />
        <div className="col-span-2 flex gap-2">
          <button type="submit" disabled={saving} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
            {saving ? "Saving..." : editingId ? "Update Service" : "Add Service"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm border border-gray-300 rounded-lg">Cancel</button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        {services.map((s) => (
          <div key={s._id} className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-sm">{s.name}</p>
                <p className="text-xs text-gray-500">{s.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(s)}
                  className={`text-xs px-2.5 py-1 rounded-md ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {s.isActive ? "Active" : "Inactive"}
                </button>
                <button onClick={() => startEdit(s)} className="text-xs text-orange-600">Edit</button>
                <button onClick={() => handleDelete(s._id)} className="text-xs text-red-500">Delete</button>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-medium text-gray-600 mb-2">Durations</p>
              <div className="space-y-1 mb-2">
                {s.durations.map((d) => (
                  <div key={d._id} className="flex items-center justify-between text-sm">
                    <span>
                      {d.durationMinutes} min · <PriceTag amount={d.price} />
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleDurationActive(s._id, d)}
                        className={`text-xs px-2 py-0.5 rounded ${d.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {d.isActive ? "Active" : "Inactive"}
                      </button>
                      <button onClick={() => handleDeleteDuration(s._id, d._id)} className="text-xs text-red-500">✕</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Minutes"
                  value={durationForms[s._id]?.durationMinutes || ""}
                  onChange={(e) =>
                    setDurationForms((prev) => ({ ...prev, [s._id]: { ...prev[s._id], durationMinutes: e.target.value } }))
                  }
                  className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={durationForms[s._id]?.price || ""}
                  onChange={(e) =>
                    setDurationForms((prev) => ({ ...prev, [s._id]: { ...prev[s._id], price: e.target.value } }))
                  }
                  className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
                />
                <button
                  onClick={() => handleAddDuration(s._id)}
                  className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-md"
                >
                  Add Duration
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServicesManager;