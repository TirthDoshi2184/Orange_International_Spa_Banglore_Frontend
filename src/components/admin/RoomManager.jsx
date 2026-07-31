import { useEffect, useState } from "react";
import { getRooms, createRoom, updateRoom, deleteRoom } from "../../api/admin.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";

const RoomsManager = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("standard");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getRooms().then(setRooms).catch((err) => setError(err.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const room = await createRoom({ name: newName.trim(), type: newType });
      setRooms((prev) => [...prev, room]);
      setNewName("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (room) => {
    setError("");
    try {
      const updated = await updateRoom(room._id, { isActive: !room.isActive });
      setRooms((prev) => prev.map((r) => (r._id === room._id ? updated : r)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (room) => {
    if (!confirm(`Delete "${room.name}" permanently? This cannot be undone.`)) return;
    setError("");
    try {
      await deleteRoom(room._id);
      setRooms((prev) => prev.filter((r) => r._id !== room._id));
    } catch (err) {
      setError(err.message); // e.g. "Cannot delete — this room is currently occupied."
    }
  };

  if (loading) return <Loader label="Loading rooms..." />;

  return (
    <div className="px-6 py-6 max-w-lg">
      <h1 className="text-xl font-semibold mb-6">Rooms</h1>
      <ErrorMessage message={error} />

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          placeholder="Room name (e.g. Room 3)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="standard">Standard</option>
          <option value="vip">VIP</option>
        </select>
        <button
          type="submit"
          disabled={saving}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add Room"}
        </button>
      </form>

      <div className="space-y-2">
        {rooms.map((room) => (
          <div key={room._id} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{room.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${room.type === "vip" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                {room.type === "vip" ? "VIP" : "Standard"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleActive(room)}
                title="Click to toggle active/disabled"
                className={`text-xs px-3 py-1.5 rounded-md border ${
                  room.isActive
                    ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                    : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                }`}
              >
                {room.isActive ? "Active — Click to Disable" : "Disabled — Click to Enable"}
              </button>
              <button
                onClick={() => handleDelete(room)}
                className="text-xs px-2.5 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {rooms.length === 0 && <p className="text-sm text-gray-400">No rooms yet.</p>}
      </div>
    </div>
  );
};

export default RoomsManager;