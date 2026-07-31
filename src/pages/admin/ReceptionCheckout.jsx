import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getServices } from "../../api/services.api";
import { getMocktails } from "../../api/mocktails.api";
import { getAvailableSlots } from "../../api/timeslots.api";
import { calculateCart, createBooking, confirmPayment } from "../../api/bookings.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";
import MenuCategoryAccordion from "../../components/shared/MenuCategoryAccordion";
import { launchRazorpayCheckout } from "../../utils/razorpayCheckout";

// Staff-operated checkout — reception picks everything on the customer's behalf.
// Deliberately NOT using CartContext/sessionStorage: this device may also be
// used for genuine customer self-checkout, and the two flows must never mix state.
const ReceptionCheckout = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [mocktails, setMocktails] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedServices, setSelectedServices] = useState([]); // {serviceId,durationId,name,durationMinutes,price}
  const [selectedMocktails, setSelectedMocktails] = useState([]); // {mocktailId,name,price,qty}
  const [timeSlot, setTimeSlot] = useState({ id: null, label: null });
  const [customer, setCustomer] = useState({ name: "", mobileNumber: "", email: "", gender: "" });
  const [couponCode, setCouponCode] = useState("");

  const [totals, setTotals] = useState(null);
  const [calcError, setCalcError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [booking, setBooking] = useState(null); // set once created — switches UI into payment mode
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "cash", reference: "" });
  const [paymentError, setPaymentError] = useState("");
  const [payingNow, setPayingNow] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
      return;
    }
    Promise.all([getServices(), getMocktails(), getAvailableSlots()])
      .then(([s, m, t]) => {
        setServices(s);
        setMocktails(m);
        setSlots(t);
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const toPayload = () => ({
    services: selectedServices.map(({ serviceId, durationId }) => ({ serviceId, durationId })),
    mocktails: selectedMocktails.map(({ mocktailId, qty }) => ({ mocktailId, qty })),
    ...(couponCode ? { couponCode } : {}),
  });

  const runCalculation = useCallback(() => {
    if (selectedServices.length === 0 && selectedMocktails.length === 0) {
      setTotals(null);
      return;
    }
    setCalcError("");
    calculateCart(toPayload())
      .then(setTotals)
      .catch((err) => {
        setCalcError(err.message);
        setTotals(null);
      });
  }, [selectedServices, selectedMocktails, couponCode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const debounce = setTimeout(runCalculation, 350);
    return () => clearTimeout(debounce);
  }, [runCalculation]);

  const addService = (service, duration) => {
    setSelectedServices((prev) => {
      const exists = prev.some((s) => s.serviceId === service._id && s.durationId === duration._id);
      if (exists) return prev;
      return [
        ...prev,
        {
          serviceId: service._id,
          durationId: duration._id,
          name: service.name,
          durationMinutes: duration.durationMinutes,
          price: duration.price,
        },
      ];
    });
  };

  const removeService = (serviceId, durationId) => {
    setSelectedServices((prev) =>
      prev.filter((s) => !(s.serviceId === serviceId && s.durationId === durationId))
    );
  };

  const addMocktail = (m) => {
    setSelectedMocktails((prev) => {
      const existing = prev.find((x) => x.mocktailId === m._id);
      if (existing) {
        return prev.map((x) => (x.mocktailId === m._id ? { ...x, qty: x.qty + 1 } : x));
      }
      return [...prev, { mocktailId: m._id, name: m.name, price: m.price, qty: 1 }];
    });
  };

  const updateMocktailQty = (mocktailId, qty) => {
    setSelectedMocktails((prev) =>
      qty <= 0
        ? prev.filter((m) => m.mocktailId !== mocktailId)
        : prev.map((m) => (m.mocktailId === mocktailId ? { ...m, qty } : m))
    );
  };

  const canCreateBooking =
    (selectedServices.length > 0 || selectedMocktails.length > 0) &&
    timeSlot.id &&
    customer.name.trim() &&
    customer.mobileNumber.trim() &&
    totals &&
    !calcError;

  const handleCreateBooking = async () => {
    setSubmitError("");
    setSubmitting(true);
    try {
      const payload = {
        customer: {
          name: customer.name.trim(),
          mobileNumber: customer.mobileNumber.trim(),
          ...(customer.email.trim() ? { email: customer.email.trim() } : {}),
          ...(customer.gender ? { gender: customer.gender } : {}),
        },
        ...toPayload(),
        timeSlotId: timeSlot.id,
      };
      const created = await createBooking(payload);
      setBooking(created);
      setPaymentForm((prev) => ({ ...prev, amount: created.grandTotal.toString() }));
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCollectPayment = async (e) => {
  e.preventDefault();
  setPaymentError("");
  const amount = Number(paymentForm.amount);
  if (!amount || amount <= 0) {
    setPaymentError("Enter a valid amount.");
    return;
  }
  setPayingNow(true);
  try {
    let updated;
    if (paymentForm.method === "razorpay") {
      updated = await launchRazorpayCheckout({
        bookingId: booking._id,
        amount,
        customerName: customer.name,
        customerMobile: customer.mobileNumber,
      });
    } else {
      updated = await confirmPayment(booking._id, {
        amount,
        method: paymentForm.method,
        reference: paymentForm.reference.trim() || undefined,
      });
    }
    setBooking(updated);
    setPaymentForm({ amount: "", method: "cash", reference: "" });
  } catch (err) {
    setPaymentError(err.message);
  } finally {
    setPayingNow(false);
  }
};
  const startNewBooking = () => {
    setBooking(null);
    setSelectedServices([]);
    setSelectedMocktails([]);
    setTimeSlot({ id: null, label: null });
    setCustomer({ name: "", mobileNumber: "", email: "", gender: "" });
    setCouponCode("");
    setTotals(null);
    // refresh slots since capacity may have changed
    getAvailableSlots().then(setSlots).catch(() => {});
  };

  if (loading) return <Loader label="Loading services..." />;
  if (loadError) return <ErrorMessage message={loadError} />;

  // ---------- PAYMENT MODE (booking already created) ----------
  if (booking) {
    const totalPaid = booking.paymentHistory?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const outstanding = booking.grandTotal - totalPaid;

    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold mb-1">Booking Created</h1>
        <p className="text-sm text-gray-500 mb-6">
          {booking.bookingNumber} · Queue #{booking.queueNumber}
        </p>

        <div className="border border-gray-200 rounded-lg px-4 py-3 mb-6 space-y-1 text-sm">
          <div className="flex justify-between"><span>Grand Total</span><PriceTag amount={booking.grandTotal} className="font-semibold" /></div>
          <div className="flex justify-between"><span>Paid so far</span><PriceTag amount={totalPaid} /></div>
          <div className="flex justify-between font-medium">
            <span>Outstanding</span>
            <PriceTag amount={outstanding} className={outstanding > 0 ? "text-amber-600" : "text-green-600"} />
          </div>
          <div className="pt-1">
            Status: <span className="font-medium capitalize">{booking.paymentStatus}</span>
          </div>
        </div>

        {booking.paymentHistory?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Payment History</h3>
            <div className="space-y-1 text-sm text-gray-600">
              {booking.paymentHistory.map((p, i) => (
                <div key={i} className="flex justify-between">
                  <span className="capitalize">{p.method} {p.reference ? `(${p.reference})` : ""}</span>
                  <PriceTag amount={p.amount} />
                </div>
              ))}
            </div>
          </div>
        )}

        {outstanding > 0 ? (
          <form onSubmit={handleCollectPayment} className="space-y-3 mb-6">
            <h3 className="text-sm font-medium text-gray-700">Collect Payment</h3>
            <ErrorMessage message={paymentError} />
            <input
              type="number"
              placeholder="Amount"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={paymentForm.method}
              onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="razorpay">Razorpay</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Reference (optional)"
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm((p) => ({ ...p, reference: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={payingNow}
              className="w-full bg-orange-500 text-white font-medium py-2.5 rounded-lg disabled:opacity-50"
            >
              {payingNow ? "Recording..." : "Record Payment"}
            </button>
          </form>
        ) : (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-6 text-center">
            Fully paid.
          </div>
        )}

        <button onClick={startNewBooking} className="w-full border border-gray-300 py-2.5 rounded-lg text-sm">
          Start Next Customer
        </button>
      </div>
    );
  }

  // ---------- BUILDING MODE ----------
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-6">Reception Checkout</h1>
      <ErrorMessage message={submitError} />

      {/* Services */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Add Services</h3>
        <div className="space-y-3">
          {services.map((s) => (
            <div key={s._id} className="border border-gray-200 rounded-lg px-3 py-2">
              <p className="text-sm font-medium mb-2">{s.name}</p>
              <div className="flex flex-wrap gap-2">
                {s.durations.filter((d) => d.isActive).map((d) => {
                  const selected = selectedServices.some(
                    (x) => x.serviceId === s._id && x.durationId === d._id
                  );
                  return (
                    <button
                      key={d._id}
                      onClick={() =>
                        selected ? removeService(s._id, d._id) : addService(s, d)
                      }
                      className={`text-xs px-3 py-1.5 rounded-md border ${
                        selected ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200"
                      }`}
                    >
                      {d.durationMinutes}min · ₹{d.price}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Menu (juices, shakes, food, desserts, etc — was "Mocktails", now the full F&B menu) */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Add from Menu</h3>
        <MenuCategoryAccordion
          items={mocktails}
          defaultOpenFirst={false}
          gridClassName="grid grid-cols-2 gap-2"
          renderItem={(m) => (
            <button
              key={m._id}
              onClick={() => addMocktail(m)}
              className="text-left border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {m.name} · ₹{m.price}
            </button>
          )}
        />
        {selectedMocktails.length > 0 && (
          <div className="mt-3 space-y-1">
            {selectedMocktails.map((m) => (
              <div key={m.mocktailId} className="flex items-center justify-between text-sm">
                <span>{m.name}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateMocktailQty(m.mocktailId, m.qty - 1)} className="w-6 h-6 border rounded">−</button>
                  <span>{m.qty}</span>
                  <button onClick={() => updateMocktailQty(m.mocktailId, m.qty + 1)} className="w-6 h-6 border rounded">+</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Time slot */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Time Slot</h3>
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => {
            const remaining = slot.maxCapacity - slot.booked;
            const isFull = remaining <= 0;
            return (
              <button
                key={slot._id}
                disabled={isFull}
                onClick={() => setTimeSlot({ id: slot._id, label: slot.time })}
                className={`text-xs px-3 py-2 rounded-md border ${
                  isFull ? "text-gray-300 border-gray-100" :
                  timeSlot.id === slot._id ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200"
                }`}
              >
                {slot.time} {isFull ? "(Full)" : `(${remaining} left)`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Customer details */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <input
          placeholder="Customer Name *"
          value={customer.name}
          onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2"
        />
        <input
          placeholder="Mobile Number *"
          value={customer.mobileNumber}
          onChange={(e) => setCustomer((c) => ({ ...c, mobileNumber: e.target.value }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2"
        />
        <input
          placeholder="Email (optional)"
          value={customer.email}
          onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2"
        />
        <input
          placeholder="Coupon Code (optional)"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2"
        />
      </div>

      {/* Totals */}
      <div className="border-t border-gray-200 pt-4 mb-6">
        <ErrorMessage message={calcError} />
        {totals && (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><PriceTag amount={totals.subtotal} /></div>
            {totals.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−₹{totals.discount}</span></div>}
            <div className="flex justify-between"><span>GST</span><PriceTag amount={totals.gst} /></div>
            <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-100 mt-2">
              <span>Grand Total</span><PriceTag amount={totals.grandTotal} />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleCreateBooking}
        disabled={!canCreateBooking || submitting}
        className="w-full bg-orange-500 text-white font-medium py-3 rounded-lg disabled:opacity-40"
      >
        {submitting ? "Creating..." : "Create Booking"}
      </button>
    </div>
  );
};

export default ReceptionCheckout;