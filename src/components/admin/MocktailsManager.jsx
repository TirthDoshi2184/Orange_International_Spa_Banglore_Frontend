import { useEffect, useState } from "react";
import { getAdminMocktails, createMocktail, updateMocktail, deleteMocktail } from "../../api/admin.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";
import MenuCategoryAccordion from "../../components/shared/MenuCategoryAccordion";
import { MENU_CATEGORIES } from "../../utils/menuCategories";

const emptyForm = { name: "", name_kn: "", category: "", description: "", description_kn: "", ingredients: "", ingredients_kn: "", image: "", price: "" };

const MocktailsManager = () => {
  const [mocktails, setMocktails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getAdminMocktails().then(setMocktails).catch((err) => setError(err.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
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
    <div className="px-6 py-6 max-w-3xl">
      <h1 className="text-xl font-semibold mb-1">Menu</h1>
      <p className="text-sm text-gray-500 mb-6">Juices, shakes, food, and desserts — {mocktails.length} items total.</p>
      <ErrorMessage message={error} />

      <form onSubmit={handleSubmit} className="border border-gray-200 rounded-xl p-4 mb-6 grid grid-cols-2 gap-3">
        <input placeholder="Name (English)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2" />
        <input placeholder="Name (Kannada)" value={form.name_kn} onChange={(e) => setForm((f) => ({ ...f, name_kn: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2" />
        <select
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2 bg-white"
        >
          <option value="">Select category…</option>
          {MENU_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input placeholder="Description (English)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2" />
        <input placeholder="Description (Kannada)" value={form.description_kn} onChange={(e) => setForm((f) => ({ ...f, description_kn: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2" />
        <input placeholder="Ingredients (comma separated, English)" value={form.ingredients} onChange={(e) => setForm((f) => ({ ...f, ingredients: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2" />
        <input placeholder="Ingredients (comma separated, Kannada)" value={form.ingredients_kn} onChange={(e) => setForm((f) => ({ ...f, ingredients_kn: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2" />
        <input placeholder="Image URL" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <div className="col-span-2 flex gap-2">
          <button type="submit" disabled={saving} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
            {saving ? "Saving..." : editingId ? "Update item" : "Add item"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm border border-gray-300 rounded-lg">
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
          <div key={m._id} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium">{m.name}</p>
              <PriceTag amount={m.price} className="text-xs text-gray-500" />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleAvailable(m)}
                className={`text-xs px-2.5 py-1 rounded-md ${m.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
              >
                {m.isAvailable ? "Available" : "Unavailable"}
              </button>
              <button onClick={() => startEdit(m)} className="text-xs text-orange-600">Edit</button>
              <button onClick={() => handleDelete(m._id)} className="text-xs text-red-500">Delete</button>
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default MocktailsManager;