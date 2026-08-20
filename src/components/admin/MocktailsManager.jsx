import { useEffect, useState } from "react";
import { getAdminMocktails, createMocktail, updateMocktail, deleteMocktail } from "../../api/admin.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";
import MenuCategoryAccordion from "../../components/shared/MenuCategoryAccordion";
import { MENU_CATEGORIES } from "../../utils/menuCategories";

const emptyForm = { name: "", name_kn: "", category: "", description: "", description_kn: "", ingredients: "", ingredients_kn: "", image: "", price: "" };

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-medium text-ink-600 mb-1">{label}</label>
    {children}
  </div>
);

const inputClass =
  "w-full border border-sand-200 rounded-lg px-3 py-2 text-sm text-ink-900 placeholder:text-ink-600/40 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15";

const MocktailsManager = () => {
  const [mocktails, setMocktails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showKn, setShowKn] = useState(false);

  const load = () => {
    setLoading(true);
    getAdminMocktails().then(setMocktails).catch((err) => setError(err.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowKn(false);
  };

  const startEdit = (m) => {
    setForm({
      name: m.name,
      name_kn: m.name_kn || "",
      category: m.category || "",
      description: m.description || "",
      description_kn: m.description_kn || "",
      ingredients: (m.ingredients || []).join(", "),
      ingredients_kn: (m.ingredients_kn || []).join(", "),
      image: m.image || "",
      price: m.price,
    });
    setEditingId(m._id);
    setShowKn(Boolean(m.name_kn || m.description_kn));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price || !form.category) return;
    setSaving(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      name_kn: form.name_kn.trim(),
      category: form.category,
      description: form.description.trim(),
      description_kn: form.description_kn.trim(),
      ingredients: form.ingredients.split(",").map((i) => i.trim()).filter(Boolean),
      ingredients_kn: form.ingredients_kn.split(",").map((i) => i.trim()).filter(Boolean),
      image: form.image.trim(),
      price: Number(form.price),
    };
    try {
      if (editingId) {
        const updated = await updateMocktail(editingId, payload);
        setMocktails((prev) => prev.map((m) => (m._id === editingId ? updated : m)));
      } else {
        const created = await createMocktail(payload);
        setMocktails((prev) => [...prev, created]);
      }
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailable = async (m) => {
    try {
      const updated = await updateMocktail(m._id, { isAvailable: !m.isAvailable });
      setMocktails((prev) => prev.map((x) => (x._id === m._id ? updated : x)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this menu item permanently?")) return;
    try {
      await deleteMocktail(id);
      setMocktails((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loader label="Loading menu..." />;

  return (
    <div className="px-7 py-7 max-w-3xl bg-sand-50 min-h-screen font-sans">
      <h1 className="font-display font-semibold text-2xl text-ink-900 mb-1">Menu</h1>
      <p className="text-sm text-ink-600 mb-6">Juices, shakes, food, and desserts — {mocktails.length} items total.</p>
      <ErrorMessage message={error} />

      <form onSubmit={handleSubmit} className="bg-white border border-sand-200 rounded-2xl p-5 mb-6 space-y-5">
        <h2 className="font-display font-semibold text-sm text-ink-900">
          {editingId ? "Edit Item" : "Add Item"}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Name">
            <input
              placeholder="e.g. Mango Cooler"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClass}
            />
          </Field>
          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className={`${inputClass} bg-white`}
            >
              <option value="">Select category…</option>
              {MENU_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Description">
          <textarea
            rows={2}
            placeholder="Short description shown to customers"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={`${inputClass} resize-none`}
          />
        </Field>

        <Field label="Ingredients (comma separated)">
          <input
            placeholder="e.g. Mango, Milk, Honey"
            value={form.ingredients}
            onChange={(e) => setForm((f) => ({ ...f, ingredients: e.target.value }))}
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Image URL">
            <input
              placeholder="https://..."
              value={form.image}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
              className={inputClass}
            />
          </Field>
          <Field label="Price">
            <input
              type="number"
              placeholder="₹"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className={inputClass}
            />
          </Field>
        </div>

        {/* Kannada — collapsed by default to keep the form short */}
        <div className="border-t border-sand-100 pt-4">
          <button
            type="button"
            onClick={() => setShowKn((v) => !v)}
            className="text-xs font-medium text-gold-600 hover:text-gold-700"
          >
            {showKn ? "− Hide Kannada translations" : "+ Add Kannada translations"}
          </button>

          {showKn && (
            <div className="mt-3 space-y-3 bg-sand-50 border border-sand-100 rounded-xl p-4">
              <Field label="Name (Kannada)">
                <input
                  value={form.name_kn}
                  onChange={(e) => setForm((f) => ({ ...f, name_kn: e.target.value }))}
                  className={inputClass}
                />
              </Field>
              <Field label="Description (Kannada)">
                <textarea
                  rows={2}
                  value={form.description_kn}
                  onChange={(e) => setForm((f) => ({ ...f, description_kn: e.target.value }))}
                  className={`${inputClass} resize-none`}
                />
              </Field>
              <Field label="Ingredients (Kannada, comma separated)">
                <input
                  value={form.ingredients_kn}
                  onChange={(e) => setForm((f) => ({ ...f, ingredients_kn: e.target.value }))}
                  className={inputClass}
                />
              </Field>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={saving} className="bg-gold-500 text-espresso-950 font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50 hover:bg-gold-400">
            {saving ? "Saving..." : editingId ? "Update item" : "Add item"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm border border-sand-200 text-ink-600 rounded-lg hover:bg-sand-50">
              Cancel
            </button>
          )}
        </div>
      </form>

      <MenuCategoryAccordion
        items={mocktails}
        defaultOpenFirst={false}
        gridClassName="grid grid-cols-1 gap-2"
        renderItem={(m) => (
          <div key={m._id} className="flex items-center justify-between bg-white border border-sand-200 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink-900">{m.name}</p>
              <PriceTag amount={m.price} className="text-xs text-ink-600" />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleAvailable(m)}
                className={`text-xs font-medium px-2.5 py-1 rounded-md ${m.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-sand-100 text-ink-600"}`}
              >
                {m.isAvailable ? "Available" : "Unavailable"}
              </button>
              <button onClick={() => startEdit(m)} className="text-xs text-gold-600 hover:text-gold-700">Edit</button>
              <button onClick={() => handleDelete(m._id)} className="text-xs text-red-600 hover:text-red-700">Delete</button>
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default MocktailsManager;