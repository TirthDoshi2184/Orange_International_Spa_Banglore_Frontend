import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getServices } from "../../api/services.api";
import { getMocktails } from "../../api/mocktails.api";
import { getAvailableSlots } from "../../api/timeslots.api";
import { calculateCart, createBooking, confirmPayment } from "../../api/bookings.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";
import { groupByCategory } from "../../utils/menuCategories";
import { launchRazorpayCheckout } from "../../utils/razorpayCheckout";

// Services don't have a fixed category list like the menu does (admin can add
// any category), so group dynamically by whatever's actually present, in the
// order categories first appear in the data.
const groupServicesByCategory = (items = []) => {
  const order = [];
  const map = new Map();
  items.forEach((item) => {
    const cat = item.category || "Other";
    if (!map.has(cat)) {
      map.set(cat, []);
      order.push(cat);
    }
    map.get(cat).push(item);
  });
  return order.map((category) => ({ category, items: map.get(category) }));
};

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-medium text-ink-600 mb-1">{label}</label>
    {children}
  </div>
);

const inputClass =
  "w-full border border-sand-200 bg-white rounded-xl px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-600/50 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15";

const SectionHeading = ({ title, icon }) => (
  <div className="flex items-center gap-2.5 mt-7 mb-3">
    <svg className="w-4 h-4 text-gold-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      {icon === "treatment" && (
        <>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 5c-2 2-2.5 3.5-1.3 5.4S12 13 12 13" />
        </>
      )}
      {icon === "menu" && <path d="M6 3l12 0M8 3l1.2 9a4 4 0 0 0 5.6 0L16 3M12 12v9" />}
      {icon === "clock" && <path d="M12 8v4l3 2M20 12a8 8 0 11-16 0 8 8 0 0116 0z" />}
      {icon === "user" && <path d="M9 12a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" />}
    </svg>
    <h2 className="font-display font-semibold text-lg text-ink-900">{title}</h2>
    <div className="flex-1 h-px bg-gradient-to-r from-sand-200 to-transparent" />
  </div>
);

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

  const [serviceSearch, setServiceSearch] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);

  const [totals, setTotals] = useState(null);
  const [calcError, setCalcError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [booking, setBooking] = useState(null); // set once created — switches UI into payment mode
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "cash", reference: "" });
  const [paymentError, setPaymentError] = useState("");
  const [payingNow, setPayingNow] = useState(false);

  // Scrollspy: which section is currently in view, and whether the bottom
  // CTA is visible — together these decide what the floating button shows.
  const [currentZone, setCurrentZone] = useState(null); // "services" | "menu" | null
  const [ctaVisible, setCtaVisible] = useState(false);

  const servicesTopRef = useRef(null);
  const menuTopRef = useRef(null);
  const ctaRef = useRef(null);
  const serviceSectionRefs = useRef({});
  const menuSectionRefs = useRef({});

  const scrollToServiceCategory = (category) => {
    serviceSectionRefs.current[category]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const scrollToMenuCategory = (category) => {
    menuSectionRefs.current[category]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

  useEffect(() => {
    if (loading || booking) return;
    const zoneOptions = { rootMargin: "-10% 0px -80% 0px", threshold: 0 };
    const servicesObs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setCurrentZone("services");
    }, zoneOptions);
    const menuObs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setCurrentZone("menu");
    }, zoneOptions);
    const ctaObs = new IntersectionObserver(
      ([entry]) => setCtaVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    if (servicesTopRef.current) servicesObs.observe(servicesTopRef.current);
    if (menuTopRef.current) menuObs.observe(menuTopRef.current);
    if (ctaRef.current) ctaObs.observe(ctaRef.current);

    return () => {
      servicesObs.disconnect();
      menuObs.disconnect();
      ctaObs.disconnect();
    };
  }, [loading, booking]);

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

  const toggleService = (service, duration) => {
    const exists = selectedServices.some((x) => x.serviceId === service._id && x.durationId === duration._id);
    if (exists) removeService(service._id, duration._id);
    else addService(service, duration);
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

  const selectionCount = selectedServices.length + selectedMocktails.length;

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
    setServiceSearch("");
    setMenuSearch("");
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
      <div className="min-h-screen bg-sand-50 font-sans">
        <div className="max-w-md mx-auto px-4 py-10">
          <h1 className="font-display font-semibold text-2xl text-ink-900 mb-1">Booking Created</h1>
          <p className="text-sm text-ink-600 mb-6">
            {booking.bookingNumber} · Queue #{booking.queueNumber}
          </p>

          <div className="bg-white border border-sand-200 rounded-2xl px-4 py-3 mb-6 space-y-1 text-sm">
            <div className="flex justify-between text-ink-900"><span>Grand Total</span><PriceTag amount={booking.grandTotal} className="font-semibold" /></div>
            <div className="flex justify-between text-ink-900"><span>Paid so far</span><PriceTag amount={totalPaid} /></div>
            <div className="flex justify-between font-medium text-ink-900">
              <span>Outstanding</span>
              <PriceTag amount={outstanding} className={outstanding > 0 ? "text-amber-600" : "text-emerald-600"} />
            </div>
            <div className="pt-1 text-ink-600">
              Status: <span className="font-medium capitalize text-ink-900">{booking.paymentStatus}</span>
            </div>
          </div>

          {booking.paymentHistory?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-ink-900 mb-2">Payment History</h3>
              <div className="space-y-1 text-sm text-ink-600">
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
            <form onSubmit={handleCollectPayment} className="bg-white border border-sand-200 rounded-2xl p-4 space-y-3 mb-6">
              <h3 className="text-sm font-medium text-ink-900">Collect Payment</h3>
              <ErrorMessage message={paymentError} />
              <input
                type="number"
                placeholder="Amount"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
                className={inputClass}
              />
              <select
                value={paymentForm.method}
                onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))}
                className={`${inputClass} bg-white`}
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
                className={inputClass}
              />
              <button
                type="submit"
                disabled={payingNow}
                className="w-full bg-gold-500 text-espresso-950 font-semibold py-2.5 rounded-lg disabled:opacity-50 hover:bg-gold-400"
              >
                {payingNow ? "Recording..." : "Record Payment"}
              </button>
            </form>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3 mb-6 text-center">
              Fully paid.
            </div>
          )}

          <button onClick={startNewBooking} className="w-full border border-sand-200 bg-white text-ink-900 py-2.5 rounded-lg text-sm hover:border-gold-500">
            Start Next Customer
          </button>
        </div>
      </div>
    );
  }

  // ---------- BUILDING MODE ----------
  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(serviceSearch.trim().toLowerCase())
  );
  const serviceGroups = groupServicesByCategory(filteredServices);
  const allServiceGroups = groupServicesByCategory(services);

  const filteredMocktails = mocktails.filter((m) =>
    m.name.toLowerCase().includes(menuSearch.trim().toLowerCase())
  );
  const menuGroups = groupByCategory(filteredMocktails);
  const allMenuGroups = groupByCategory(mocktails);

  const selectionTotal = totals?.grandTotal;

  const showFloatingCTA = selectionCount > 0 && !ctaVisible;
  const showFloatingCategories = currentZone && !ctaVisible;
  const sheetGroups = currentZone === "services" ? allServiceGroups : allMenuGroups;
  const sheetOnPick = currentZone === "services" ? scrollToServiceCategory : scrollToMenuCategory;

  return (
    <div className="min-h-screen bg-sand-50 font-sans">
      {/* Header */}
      <div
        className="px-6 pt-8 pb-9"
        style={{ background: "radial-gradient(circle at 30% -20%, #2e2013 0%, #1c130c 65%)" }}
      >
        <h1 className="font-display font-semibold text-2xl text-parchment-50 leading-tight mb-1">Reception Checkout</h1>
        <p className="text-sm text-parchment-200/70">Pick treatments and menu items for the customer below.</p>
      </div>

      <div className="px-5 -mt-5 relative z-10 max-w-2xl mx-auto">
        {/* Live order summary — receipt card */}
        <div className="bg-white rounded-2xl border border-sand-200 shadow-[0_10px_26px_rgba(60,40,20,0.10)] px-4.5 py-4 text-sm">
          {selectionCount === 0 ? (
            <p className="text-xs text-ink-600/50 py-2 text-center">Nothing added yet — pick treatments or menu items below.</p>
          ) : (
            <>
              {selectedServices.map((s, i) => (
                <div key={`s-${i}`} className="flex items-center justify-between py-1.5">
                  <span className="text-ink-600 truncate mr-2">
                    {s.name} ({s.durationMinutes} min)
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PriceTag amount={s.price} className="text-ink-900" />
                    <button onClick={() => removeService(s.serviceId, s.durationId)} className="text-ink-600/40 hover:text-red-600 text-xs">✕</button>
                  </div>
                </div>
              ))}
              {selectedMocktails.map((m) => (
                <div key={m.mocktailId} className="flex items-center justify-between py-1.5">
                  <span className="text-ink-600 truncate mr-2">{m.name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => updateMocktailQty(m.mocktailId, m.qty - 1)} className="w-5 h-5 border border-sand-200 rounded text-ink-600 text-xs leading-none hover:border-gold-500">−</button>
                    <span className="text-ink-900 text-xs w-3 text-center">{m.qty}</span>
                    <button onClick={() => updateMocktailQty(m.mocktailId, m.qty + 1)} className="w-5 h-5 border border-sand-200 rounded text-ink-600 text-xs leading-none hover:border-gold-500">+</button>
                    <PriceTag amount={m.price * m.qty} className="text-ink-900" />
                  </div>
                </div>
              ))}

              {totals && (
                <>
                  <div className="border-t border-dashed border-sand-200 my-2" />
                  <div className="flex justify-between py-1 text-ink-900">
                    <span>Subtotal</span><PriceTag amount={totals.subtotal} />
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between py-1 text-emerald-600">
                      <span>Discount</span><span>−₹{totals.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 text-ink-900">
                    <span>GST</span><PriceTag amount={totals.gst} />
                  </div>
                  <div className="border-t border-espresso-800 my-2" />
                  <div className="flex justify-between font-semibold text-[15px] text-ink-900 py-1">
                    <span>Grand Total</span><PriceTag amount={totals.grandTotal} />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <ErrorMessage message={submitError} />
        <ErrorMessage message={calcError} />

        {/* Services */}
        <SectionHeading title="Add Services" icon="treatment" />
        <div ref={servicesTopRef}>
          <input
            type="text"
            value={serviceSearch}
            onChange={(e) => setServiceSearch(e.target.value)}
            placeholder="Search treatments..."
            className={`${inputClass} mb-4`}
          />

          {serviceGroups.length === 0 && (
            <p className="text-sm text-ink-600/60 py-4 text-center">
              {serviceSearch ? `No treatments match "${serviceSearch}"` : "No treatments available right now."}
            </p>
          )}

          <div className="space-y-6">
            {serviceGroups.map((group) => (
              <div key={group.category} ref={(el) => (serviceSectionRefs.current[group.category] = el)}>
                <p className="sticky top-0 bg-sand-50/95 backdrop-blur-sm text-xs font-semibold uppercase tracking-wide text-gold-600 py-1.5 z-10">
                  {group.category}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {group.items.map((s) => {
                    const activeDurations = s.durations.filter((d) => d.isActive);
                    const minPrice = activeDurations.length
                      ? Math.min(...activeDurations.map((d) => d.price))
                      : null;

                    return (
                      <div
                        key={s._id}
                        className="bg-white border border-sand-200 rounded-2xl overflow-hidden shadow-[0_6px_16px_rgba(60,40,20,0.06)]"
                      >
                        <div className="relative w-full h-24">
                          {s.images?.[0] ? (
                            <img src={s.images[0]} alt={s.name} className="w-full h-full object-cover" />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{ background: "linear-gradient(135deg, #3a2a1c 0%, #1c130c 100%)" }}
                            >
                              <svg className="w-7 h-7 text-gold-500/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                                <circle cx="12" cy="13" r="8" />
                                <path d="M12 5c-2 2-2.5 3.5-1.3 5.4S12 13 12 13" />
                              </svg>
                            </div>
                          )}
                          <span className="absolute top-1.5 left-1.5 bg-espresso-950/80 backdrop-blur-sm text-gold-300 text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full">
                            {group.category}
                          </span>
                          {minPrice !== null && (
                            <span className="absolute top-1.5 right-1.5 bg-white/95 backdrop-blur-sm text-ink-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              ₹{minPrice}
                            </span>
                          )}
                        </div>

                        <div className="px-3 pt-2.5 pb-3">
                          <p className="font-display font-semibold text-[14px] text-ink-900 leading-tight mb-2 line-clamp-2">
                            {s.name}
                          </p>

                          <div className="flex flex-wrap gap-1.5">
                            {activeDurations.map((d) => {
                              const selected = selectedServices.some(
                                (x) => x.serviceId === s._id && x.durationId === d._id
                              );
                              return (
                                <button
                                  key={d._id}
                                  onClick={() => toggleService(s, d)}
                                  className={`relative flex flex-col items-center justify-center min-w-[58px] px-2 py-1.5 rounded-lg border text-center transition-all ${
                                    selected
                                      ? "border-gold-500 bg-gold-500/10 ring-1 ring-gold-500/15"
                                      : "border-sand-200 bg-sand-50"
                                  }`}
                                >
                                  {selected && (
                                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gold-500 text-white text-[8px] font-bold flex items-center justify-center border border-white">
                                      ✓
                                    </span>
                                  )}
                                  <span className="text-[9px] text-ink-600">{d.durationMinutes}min</span>
                                  <span className={`text-[11px] font-bold ${selected ? "text-gold-600" : "text-ink-900"}`}>
                                    ₹{d.price}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Menu */}
        <SectionHeading title="Add from Menu" icon="menu" />
        <div ref={menuTopRef}>
          <input
            type="text"
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
            placeholder="Search the menu..."
            className={`${inputClass} mb-4`}
          />

          {menuGroups.length === 0 && (
            <p className="text-sm text-ink-600/60 py-4 text-center">
              {menuSearch ? `No items match "${menuSearch}"` : "No menu items available right now."}
            </p>
          )}

          <div className="space-y-5">
            {menuGroups.map((group) => (
              <div key={group.category} ref={(el) => (menuSectionRefs.current[group.category] = el)}>
                <p className="sticky top-0 bg-sand-50/95 backdrop-blur-sm text-xs font-semibold uppercase tracking-wide text-gold-600 py-1.5 z-10">
                  {group.category}
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {group.items.map((m) => {
                    const selected = selectedMocktails.find((x) => x.mocktailId === m._id);
                    return (
                      <button
                        key={m._id}
                        onClick={() => addMocktail(m)}
                        className={`relative flex flex-col items-start text-left border rounded-xl px-3.5 py-3 transition-all ${
                          selected ? "border-gold-500 bg-gold-500/10" : "border-sand-200 bg-white"
                        }`}
                      >
                        {selected && (
                          <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-gold-500 text-espresso-950 text-[10px] font-bold flex items-center justify-center border-2 border-white">
                            {selected.qty}
                          </span>
                        )}
                        <span className="text-[13px] font-semibold text-ink-900 leading-snug mb-1.5">{m.name}</span>
                        <span className={`text-[13px] font-bold ${selected ? "text-gold-600" : "text-ink-900"}`}>₹{m.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time slot */}
        <SectionHeading title="Time Slot" icon="clock" />
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => {
            const remaining = slot.maxCapacity - slot.booked;
            const isFull = remaining <= 0;
            return (
              <button
                key={slot._id}
                disabled={isFull}
                onClick={() => setTimeSlot({ id: slot._id, label: slot.time })}
                className={`text-xs font-medium px-3 py-2 rounded-md border ${
                  isFull
                    ? "text-ink-600/30 border-sand-100 bg-sand-50 cursor-not-allowed"
                    : timeSlot.id === slot._id
                    ? "border-gold-500 bg-gold-500/10 text-gold-700"
                    : "border-sand-200 bg-white text-ink-900 hover:border-gold-500/50"
                }`}
              >
                {slot.time} {isFull ? "(Full)" : `(${remaining} left)`}
              </button>
            );
          })}
        </div>

        {/* Customer details */}
        <SectionHeading title="Customer Details" icon="user" />
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="col-span-2">
            <Field label="Customer Name *">
              <input
                value={customer.name}
                onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Mobile Number *">
              <input
                value={customer.mobileNumber}
                onChange={(e) => setCustomer((c) => ({ ...c, mobileNumber: e.target.value }))}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Email (optional)">
            <input
              value={customer.email}
              onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
              className={inputClass}
            />
          </Field>
          <Field label="Gender (optional)">
            <select
              value={customer.gender}
              onChange={(e) => setCustomer((c) => ({ ...c, gender: e.target.value }))}
              className={`${inputClass} bg-white`}
            >
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <div className="col-span-2">
            <Field label="Coupon Code (optional)">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        {/* Create Booking — the "I've reviewed everything" moment at the end of the page */}
        <div ref={ctaRef} className="pt-4 pb-8">
          <button
            onClick={handleCreateBooking}
            disabled={!canCreateBooking || submitting}
            className="w-full bg-gradient-to-br from-espresso-800 to-espresso-950 text-gold-300 font-bold text-[15px] py-4 rounded-2xl shadow-[0_10px_24px_rgba(28,19,12,0.35)] disabled:opacity-40 transition-opacity"
          >
            {submitting
              ? "Creating..."
              : selectionTotal
              ? `Create Booking · ₹${selectionTotal}`
              : "Create Booking"}
          </button>
          {!canCreateBooking && selectionCount > 0 && (
            <p className="text-xs text-ink-600/60 text-center mt-2">
              {!timeSlot.id ? "Select a time slot to continue." : "Enter the customer's name and mobile number to continue."}
            </p>
          )}
        </div>
      </div>

      {/* Floating "jump to category" button */}
      {showFloatingCategories && sheetGroups.length > 0 && (
        <button
          onClick={() => setCategorySheetOpen(true)}
          className={`fixed right-5 z-30 flex items-center gap-2 bg-espresso-950 text-gold-300 pl-3.5 pr-4 py-3 rounded-full shadow-[0_8px_20px_rgba(28,19,12,0.4)] transition-all ${
            showFloatingCTA ? "bottom-24" : "bottom-6"
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h10" />
          </svg>
          <span className="text-xs font-semibold">
            {currentZone === "services" ? "Treatments" : "Categories"}
          </span>
        </button>
      )}

      {/* Floating create-booking bar — reachable from anywhere once something's selected */}
      {showFloatingCTA && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-3 bg-gradient-to-t from-sand-50 via-sand-50/95 to-transparent">
          <button
            onClick={handleCreateBooking}
            disabled={!canCreateBooking || submitting}
            className="w-full flex items-center justify-between bg-gradient-to-br from-espresso-800 to-espresso-950 text-gold-300 rounded-2xl px-5 py-3.5 shadow-[0_10px_24px_rgba(28,19,12,0.4)] disabled:opacity-60"
          >
            <span className="text-xs text-parchment-200/80">
              {selectionCount} item{selectionCount !== 1 ? "s" : ""} selected
            </span>
            <span className="flex items-center gap-2 font-bold text-[15px]">
              {submitting ? "Creating..." : selectionTotal ? `Create Booking · ₹${selectionTotal}` : "Create Booking"}
              {!submitting && (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </span>
          </button>
        </div>
      )}

      {/* Category bottom sheet */}
      {categorySheetOpen && (
        <>
          <div className="fixed inset-0 bg-espresso-950/40 z-40" onClick={() => setCategorySheetOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[70vh] overflow-y-auto shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
            <div className="sticky top-0 bg-white px-5 pt-3 pb-2 border-b border-sand-200">
              <div className="w-10 h-1 rounded-full bg-sand-200 mx-auto mb-3" />
              <p className="font-display font-semibold text-base text-ink-900">
                {currentZone === "services" ? "Jump to treatment" : "Jump to category"}
              </p>
            </div>
            <div className="py-1.5">
              {sheetGroups.map((group) => (
                <button
                  key={group.category}
                  onClick={() => {
                    sheetOnPick(group.category);
                    setCategorySheetOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-5 py-3 text-sm text-ink-900 hover:bg-sand-50 text-left"
                >
                  <span>{group.category}</span>
                  <span className="text-xs text-ink-600/50">{group.items.length} items</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReceptionCheckout;