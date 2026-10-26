import { useEffect, useState } from "react";
import { updatePaymentMethod, getAdminBookings, updateBookingStatus, getRoomAvailability, reassignRoom } from "../../api/admin.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";
import { Link } from "react-router-dom";


const statusColor = {
  waiting: "bg-sand-100 text-ink-600",
  "in-service": "bg-gold-500/15 text-gold-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const paymentColor = {
  pending: "text-ink-600",
  partial: "text-amber-600",
  paid: "text-emerald-600",
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

  const [payBookingId, setPayBookingId] = useState(null);
const [payError, setPayError] = useState("");
const [savingIdx, setSavingIdx] = useState(null);

const payBooking = bookings.find((b) => b._id === payBookingId); // always reads the latest data

const handleMethodChange = async (bookingId, index, method) => {
  setPayError("");
  setSavingIdx(index);
  try {
    const updated = await updatePaymentMethod(bookingId, { index, method });
    setBookings((prev) => prev.map((b) => (b._id === bookingId ? updated : b)));
  } catch (err) {
    setPayError(err.message);
  } finally {
    setSavingIdx(null);
  }
};
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
    <div className="px-7 py-7 font-sans">
      <h1 className="font-display font-semibold text-2xl text-ink-900 mb-1">Bookings</h1>
      {dateFilter && (
        <p className="text-sm text-ink-600 mb-6">
          {new Set(filtered.map((b) => b.customerId?._id)).size} unique customer
          {new Set(filtered.map((b) => b.customerId?._id)).size !== 1 ? "s" : ""} ·{" "}
          {filtered.length} booking{filtered.length !== 1 ? "s" : ""} on{" "}
          {new Date(dateFilter).toLocaleDateString()}
        </p>
      )}
      {!dateFilter && <div className="mb-6" />}
      <div className="flex gap-3 mb-5">
        <input
          placeholder="Search by name, mobile, or booking #"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-sand-200 bg-white rounded-lg px-3 py-2 text-sm text-ink-900 placeholder:text-ink-600/50 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border border-sand-200 bg-white rounded-lg px-3 py-2 text-sm text-ink-900 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15"
        />
        {dateFilter && (
          <button
            onClick={() => setDateFilter("")}
            className="text-xs text-ink-600 px-2 hover:text-ink-900"
          >
            Clear
          </button>
        )}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-sand-200 bg-white rounded-lg px-3 py-2 text-sm text-ink-900 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15"
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
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-amber-800">
              Needs check-in — paid, not yet arrived ({needsCheckIn.length})
            </h3>
          </div>
          <div className="space-y-2">
            {needsCheckIn.map((b) => (
              <div
                key={b._id}
                className="flex items-center justify-between bg-white border border-amber-100 rounded-xl px-3.5 py-2.5"
              >
                <div>
                  <span className="font-semibold text-sm text-ink-900">{b.bookingNumber}</span>
                  <span className="text-xs text-ink-600 ml-2">
                    {b.customerId?.name} · {b.customerId?.mobileNumber} · Queue #{b.queueNumber}
                  </span>
                </div>
                <button
                  onClick={() => openCheckIn(b._id)}
                  className="text-xs bg-espresso-950 text-gold-300 font-medium px-3 py-1.5 rounded-lg hover:bg-espresso-800"
                >
                  Check in now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sand-50 text-left text-[11px] text-ink-600 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 font-semibold">Booking</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Room</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Payment</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-ink-600/60">No bookings found.</td></tr>
            )}
            {filtered.map((b) => {
              const totalPaid = b.paymentHistory?.reduce((sum, p) => sum + p.amount, 0) || 0;
              return (
                <tr key={b._id} className="border-t border-sand-100 hover:bg-sand-50/60">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">{b.bookingNumber}</div>
                    <div className="text-xs text-ink-600/60">Queue #{b.queueNumber}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-ink-900">{b.customerId?.name}</div>
                    <div className="text-xs text-ink-600/60">{b.customerId?.mobileNumber}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-900">{b.roomId?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <PriceTag amount={b.grandTotal} className="font-medium text-ink-900" />
                    <div className="text-xs text-ink-600/60">Paid: <PriceTag amount={totalPaid} /></div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium capitalize ${paymentColor[b.paymentStatus]}`}>{b.paymentStatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor[b.bookingStatus]}`}>
                      {b.bookingStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    {b.bookingStatus === "waiting" && (
                      <button
                        onClick={() => openCheckIn(b._id)}
                        className="text-xs bg-gold-500 text-espresso-950 font-semibold px-2.5 py-1.5 rounded-md hover:bg-gold-400"
                      >
                        Check in
                      </button>
                    )}

                    {b.bookingStatus === "in-service" && (
                      <>
                        <button
                          onClick={() => handleStatusChange(b._id, "completed")}
                          className="text-xs bg-espresso-950 text-parchment-50 px-2.5 py-1.5 rounded-md hover:bg-espresso-800"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => openReassign(b._id)}
                          className="text-xs border border-sand-200 text-ink-600 px-2.5 py-1.5 rounded-md hover:border-sand-200 hover:bg-sand-50"
                        >
                          Change room
                        </button>
                      </>
                    )}

                    {["waiting", "in-service"].includes(b.bookingStatus) && (
                      <button
                        onClick={() => handleStatusChange(b._id, "cancelled")}
                        className="text-xs border border-red-200 text-red-600 px-2.5 py-1.5 rounded-md hover:bg-red-50"
                      >
                        Cancel
                      </button>
                    )}
                    {b.paymentHistory?.length > 0 && (
  <button
    onClick={() => { setPayError(""); setPayBookingId(b._id); }}
    className="text-xs border border-sand-200 text-ink-600 px-2.5 py-1.5 rounded-md hover:bg-sand-50"
  >
    Payments
  </button>
)}
                    <Link to={`/admin/bookings/${b._id}/invoice`} className="text-xs text-gold-600 underline underline-offset-2 hover:text-gold-700">
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
        <div className="fixed inset-0 bg-espresso-950/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-5 w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="font-display font-semibold text-lg text-ink-900 mb-4">
              {modalMode === "checkin" ? "Choose a room" : "Move to different room"}
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
                      <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${type === "vip" ? "text-gold-600" : "text-ink-600"}`}>
                        {type === "vip" ? "VIP rooms" : "Standard rooms"}
                      </p>
                      <div className="space-y-2">
                        {roomsOfType.map((room) => (
                          <button
                            key={room._id}
                            disabled={room.isOccupied}
                            onClick={() => handleRoomPick(room._id)}
                            className={`w-full flex justify-between items-center border rounded-xl px-4 py-2.5 text-sm transition-colors ${
                              room.isOccupied
                                ? "border-sand-100 text-ink-600/40 cursor-not-allowed"
                                : "border-sand-200 hover:border-gold-500 hover:bg-[#FEFAF0]"
                            }`}
                          >
                            <span className="font-medium text-ink-900">{room.name}</span>
                            <span className={room.isOccupied ? "text-ink-600/40" : "text-emerald-600"}>
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
                  <p className="text-sm text-ink-600/60 mb-3">No rooms configured yet.</p>
                )}
              </>
            )}

            <button onClick={() => setCheckInBookingId(null)} className="w-full text-xs text-ink-600/60 py-2 mt-2 hover:text-ink-900">
              Cancel
            </button>
          </div>
        </div>
      )}

      {payBooking && (
  <div className="fixed inset-0 bg-espresso-950/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-5 w-[28rem] max-h-[80vh] overflow-y-auto">
      <h3 className="font-display font-semibold text-lg text-ink-900 mb-1">Payments</h3>
      <p className="text-xs text-ink-600 mb-4">{payBooking.bookingNumber} · {payBooking.customerId?.name}</p>

      <ErrorMessage message={payError} />

      <div className="space-y-2">
        {payBooking.paymentHistory.map((p, i) => {
          const locked = ["membership_credit", "razorpay"].includes(p.method);
          return (
            <div key={i} className="border border-sand-200 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <PriceTag amount={p.amount} className="font-semibold text-ink-900" />
                  <p className="text-xs text-ink-600/70">
                    {new Date(p.paidAt).toLocaleString("en-IN")}
                  </p>
                </div>

                {locked ? (
                  <span className="text-xs uppercase text-ink-600 bg-sand-50 px-2.5 py-1.5 rounded-md">
                    {p.method.replace("_", " ")} 🔒
                  </span>
                ) : (
                  <select
                    value={p.method}
                    disabled={savingIdx === i}
                    onChange={(e) => handleMethodChange(payBooking._id, i, e.target.value)}
                    className="border border-sand-200 rounded-lg px-2.5 py-1.5 text-sm bg-white disabled:opacity-50"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="other">Other</option>
                  </select>
                )}
              </div>

              {p.previousMethod && (
                <p className="text-[11px] text-amber-600 mt-1.5">
                  Changed from {p.previousMethod} · {new Date(p.editedAt).toLocaleString("en-IN")}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={() => setPayBookingId(null)} className="w-full text-xs text-ink-600/60 py-2 mt-3 hover:text-ink-900">
        Close
      </button>
    </div>
  </div>
)}
    </div>
  );
};

export default BookingsTable;
