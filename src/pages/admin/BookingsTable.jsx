import { useEffect, useState } from "react";
import { getAdminBookings, updateBookingStatus, getRoomAvailability, reassignRoom } from "../../api/admin.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";
import { Link } from "react-router-dom";

const statusColor = {
  waiting: "bg-gray-100 text-gray-700",
  "in-service": "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const paymentColor = {
  pending: "text-gray-500",
  partial: "text-amber-600",
  paid: "text-green-600",
  failed: "text-red-600",
};

const BookingsTable = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  // Room picker modal state
  const [checkInBookingId, setCheckInBookingId] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [modalMode, setModalMode] = useState("checkin"); // "checkin" | "reassign"

  const [dateFilter, setDateFilter] = useState(""); 
  const load = () => {
  setLoading(true);
  const params = {};
  if (statusFilter) params.status = statusFilter;
  if (dateFilter) params.date = dateFilter; // "YYYY-MM-DD"
  getAdminBookings(params)
    .then(setBookings)
    .catch((err) => setError(err.message))
    .finally(() => setLoading(false));
};

useEffect(load, [statusFilter, dateFilter]);
  const handleStatusChange = async (bookingId, newStatus) => {
    setActionError("");
    try {
      const updated = await updateBookingStatus(bookingId, { bookingStatus: newStatus });
      setBookings((prev) => prev.map((b) => (b._id === bookingId ? updated : b)));
    } catch (err) {
      setActionError(err.message); // e.g. "Cannot complete — ₹230 still unpaid..."
    }
  };

  // Opens the room picker for a booking that needs to be checked in
  const openCheckIn = async (bookingId) => {
  setModalMode("checkin");
  setActionError("");
  setCheckInBookingId(bookingId);
  setAvailabilityLoading(true);
  try {
    const data = await getRoomAvailability();
    setAvailability(data);
  } catch (err) {
    setActionError(err.message);
    setCheckInBookingId(null);
  } finally {
    setAvailabilityLoading(false);
  }
};

const openReassign = async (bookingId) => {
  setModalMode("reassign");
  setActionError("");
  setCheckInBookingId(bookingId);
  setAvailabilityLoading(true);
  try {
    const data = await getRoomAvailability();
    setAvailability(data);
  } catch (err) {
    setActionError(err.message);
    setCheckInBookingId(null);
  } finally {
    setAvailabilityLoading(false);
  }
};

const handleRoomPick = async (roomId) => {
  try {
    const updated =
      modalMode === "checkin"
        ? await updateBookingStatus(checkInBookingId, { bookingStatus: "in-service", roomId })
        : await reassignRoom(checkInBookingId, roomId);
    setBookings((prev) => prev.map((b) => (b._id === checkInBookingId ? updated : b)));
    setCheckInBookingId(null);
  } catch (err) {
    setActionError(err.message);
  }
};
  const handleCheckIn = async (roomId) => {
    try {
      const updated = await updateBookingStatus(checkInBookingId, { bookingStatus: "in-service", roomId });
      setBookings((prev) => prev.map((b) => (b._id === checkInBookingId ? updated : b)));
      setCheckInBookingId(null);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const filtered = bookings.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.bookingNumber.toLowerCase().includes(q) ||
      b.customerId?.name?.toLowerCase().includes(q) ||
      b.customerId?.mobileNumber?.includes(q)
    );
  });

  const needsCheckIn = bookings.filter(
    (b) => b.paymentStatus === "paid" && b.bookingStatus === "waiting"
  );

  if (loading) return <Loader label="Loading bookings..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="px-6 py-6">
<h1 className="text-xl font-semibold mb-1">Bookings</h1>
{dateFilter && (
  <p className="text-sm text-gray-500 mb-6">
    {new Set(filtered.map((b) => b.customerId?._id)).size} unique customer
    {new Set(filtered.map((b) => b.customerId?._id)).size !== 1 ? "s" : ""} ·{" "}
    {filtered.length} booking{filtered.length !== 1 ? "s" : ""} on{" "}
    {new Date(dateFilter).toLocaleDateString()}
  </p>
)}
{!dateFilter && <div className="mb-6" />}
      <div className="flex gap-3 mb-4">
        <input
          placeholder="Search by name, mobile, or booking #"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
         <input
    type="date"
    value={dateFilter}
    onChange={(e) => setDateFilter(e.target.value)}
    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
  />
  {dateFilter && (
    <button
      onClick={() => setDateFilter("")}
      className="text-xs text-gray-400 px-2"
    >
      Clear
    </button>
      )}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="waiting">Waiting</option>
          <option value="in-service">In Service</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <ErrorMessage message={actionError} />

      {needsCheckIn.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-5 py-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-amber-800">
              Needs Check-In — Paid, Not Yet Arrived ({needsCheckIn.length})
            </h3>
          </div>
          <div className="space-y-2">
            {needsCheckIn.map((b) => (
              <div
                key={b._id}
                className="flex items-center justify-between bg-white border border-amber-200 rounded-lg px-3 py-2"
              >
                <div>
                  <span className="font-medium text-sm">{b.bookingNumber}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {b.customerId?.name} · {b.customerId?.mobileNumber} · Queue #{b.queueNumber}
                  </span>
                </div>
                <button
                  onClick={() => openCheckIn(b._id)}
                  className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-md"
                >
                  Check In Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">No bookings found.</td></tr>
            )}
            {filtered.map((b) => {
              const totalPaid = b.paymentHistory?.reduce((sum, p) => sum + p.amount, 0) || 0;
              return (
                <tr key={b._id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <div className="font-medium">{b.bookingNumber}</div>
                    <div className="text-xs text-gray-400">Queue #{b.queueNumber}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{b.customerId?.name}</div>
                    <div className="text-xs text-gray-400">{b.customerId?.mobileNumber}</div>
                  </td>
                  <td className="px-4 py-3">{b.roomId?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <PriceTag amount={b.grandTotal} className="font-medium" />
                    <div className="text-xs text-gray-400">Paid: <PriceTag amount={totalPaid} /></div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium capitalize ${paymentColor[b.paymentStatus]}`}>{b.paymentStatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[b.bookingStatus]}`}>
                      {b.bookingStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    {b.bookingStatus === "waiting" && (
                      <button
                        onClick={() => openCheckIn(b._id)}
                        className="text-xs bg-orange-500 text-white px-2.5 py-1 rounded-md"
                      >
                        Check In
                      </button>
                    )}
                    
                    {b.bookingStatus === "in-service" && (
  <>
    <button
      onClick={() => handleStatusChange(b._id, "completed")}
      className="text-xs bg-gray-900 text-white px-2.5 py-1 rounded-md"
    >
      Complete
    </button>
    <button
      onClick={() => openReassign(b._id)}
      className="text-xs border border-gray-300 text-gray-700 px-2.5 py-1 rounded-md"
    >
      Change Room
    </button>
  </>
)}

                    {["waiting", "in-service"].includes(b.bookingStatus) && (
                      <button
                        onClick={() => handleStatusChange(b._id, "cancelled")}
                        className="text-xs border border-red-200 text-red-600 px-2.5 py-1 rounded-md"
                      >
                        Cancel
                      </button>
                    )}
                    <Link to={`/admin/bookings/${b._id}/invoice`} className="text-xs text-gray-500 underline">
  Invoice
</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Room picker modal — appears when checking in, from either the banner or the table row button */}
      {checkInBookingId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-96 max-h-[80vh] overflow-y-auto">
<h3 className="font-medium mb-4">
  {modalMode === "checkin" ? "Choose a Room" : "Move to Different Room"}
</h3>
            {availabilityLoading ? (
              <Loader label="Checking room availability..." />
            ) : (
              <>
                {["vip", "standard"].map((type) => {
                  const roomsOfType = availability.filter((r) => r.type === type);
                  if (roomsOfType.length === 0) return null;

                  return (
                    <div key={type} className="mb-4">
                      <p className={`text-xs font-semibold uppercase mb-2 ${type === "vip" ? "text-purple-600" : "text-gray-500"}`}>
                        {type === "vip" ? "VIP Rooms" : "Standard Rooms"}
                      </p>
                      <div className="space-y-2">
                        {roomsOfType.map((room) => (
                          <button
                            key={room._id}
                            disabled={room.isOccupied}
                            onClick={() => handleRoomPick(room._id)}
                            className={`w-full flex justify-between items-center border rounded-lg px-4 py-2.5 text-sm ${
                              room.isOccupied
                                ? "border-gray-100 text-gray-300 cursor-not-allowed"
                                : "border-gray-200 hover:border-orange-400 hover:bg-orange-50"
                            }`}
                          >
                            <span className="font-medium">{room.name}</span>
                            <span className={room.isOccupied ? "text-gray-300" : "text-green-600"}>
                              {room.isOccupied ? "Occupied" : "Free"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {availability.length > 0 && availability.every((r) => r.isOccupied) && (
                  <p className="text-sm text-amber-600 mb-3">Every room is currently occupied.</p>
                )}

                {availability.length === 0 && (
                  <p className="text-sm text-gray-400 mb-3">No rooms configured yet.</p>
                )}
              </>
            )}

            <button onClick={() => setCheckInBookingId(null)} className="w-full text-xs text-gray-400 py-2 mt-2">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsTable;