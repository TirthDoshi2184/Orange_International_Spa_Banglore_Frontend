import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { findBookingByRoom } from "../../api/bookings.api";
import { getServices } from "../../api/services.api";
import { getMocktails } from "../../api/mocktails.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";
import MenuCategoryAccordion from "../../components/shared/MenuCategoryAccordion";
import { launchAddonCheckout } from "../../utils/razorpayCheckout";



const AddOnOrder = () => {
  const { roomId } = useParams();
  const [booking, setBooking] = useState(null);
  const [services, setServices] = useState([]);
  const [mocktails, setMocktails] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]); // {serviceId,durationId,name,durationMinutes,price}
  const [selectedMocktails, setSelectedMocktails] = useState([]); // {mocktailId,name,qty}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [processing, setProcessing] = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    Promise.all([findBookingByRoom(roomId), getServices(), getMocktails()])
      .then(([b, s, m]) => {
        setBooking(b);
        setServices(s);
        setMocktails(m);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [roomId]);

  const toggleService = (service, duration) => {
    setSelectedServices((prev) => {
      const exists = prev.some((x) => x.serviceId === service._id && x.durationId === duration._id);
      if (exists) return prev.filter((x) => !(x.serviceId === service._id && x.durationId === duration._id));
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

  const toggleMocktail = (m) => {
    setSelectedMocktails((prev) => {
      const exists = prev.find((x) => x.mocktailId === m._id);
      if (exists) return prev.filter((x) => x.mocktailId !== m._id);
      return [...prev, { mocktailId: m._id, name: m.name, qty: 1 }];
    });
  };

  const totalPaid = booking?.paymentHistory?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const outstanding = booking ? booking.grandTotal - totalPaid : 0;

  // Selected-but-not-yet-added items' combined price — shown as a live preview
  // before the customer commits to paying for them.
  const selectionTotal =
    selectedServices.reduce((sum, s) => sum + s.price, 0) +
    selectedMocktails.reduce((sum, m) => sum + m.price, 0);

  const handleAddAndPay = async () => {
    if (selectedServices.length === 0 && selectedMocktails.length === 0) return;
    setProcessing(true);
    setAddError("");
    try {
      const updated = await launchAddonCheckout({
        bookingId: booking._id,
        services: selectedServices.map(({ serviceId, durationId }) => ({ serviceId, durationId })),
        mocktails: selectedMocktails.map(({ mocktailId }) => ({ mocktailId, qty: 1 })),
        customerName: booking.customerId?.name,
        customerMobile: booking.customerId?.mobileNumber,
      });
      setBooking(updated);
      setSelectedServices([]);
      setSelectedMocktails([]);
    } catch (err) {
      // Covers both "payment cancelled" and genuine verification failures —
      // in either case, nothing was written to the booking.
      setAddError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Loader label="Finding your order..." />;
  if (error && !booking) return <ErrorMessage message={error} />;

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-1">Add to Your Order</h1>
      <p className="text-sm text-gray-500 mb-6">
        Booking {booking.bookingNumber} · Room {booking.roomId?.name}
      </p>

      {/* Current order summary */}
      <div className="border border-gray-200 rounded-lg px-4 py-3 mb-6 text-sm space-y-2">
        {booking.services.map((s, i) => (
          <div key={`s-${i}`} className="flex justify-between">
            <span>
              {s.serviceId?.name || "Service"} ({s.durationId?.durationMinutes || "?"} min)
            </span>
            <PriceTag amount={s.price} />
          </div>
        ))}
        {booking.mocktails.map((m, i) => (
          <div key={`m-${i}`} className="flex justify-between">
            <span>{m.mocktailId?.name || "Mocktail"} x{m.qty}</span>
            <PriceTag amount={m.price} />
          </div>
        ))}
        <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold">
          <span>Grand Total</span>
          <PriceTag amount={booking.grandTotal} />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Paid so far</span>
          <PriceTag amount={totalPaid} />
        </div>
        <div className={`flex justify-between text-xs font-medium ${outstanding > 0 ? "text-amber-600" : "text-green-600"}`}>
          <span>Outstanding</span>
          <PriceTag amount={outstanding} />
        </div>
      </div>

      <ErrorMessage message={error} />
      <ErrorMessage message={addError} />

      <h3 className="font-medium text-gray-900 mb-3">Add Services</h3>
      <div className="space-y-2 mb-6">
        {services.map((s) => (
          <div key={s._id} className="border border-gray-200 rounded-lg px-3 py-2">
            <p className="text-sm font-medium mb-1">{s.name}</p>
            <div className="flex flex-wrap gap-2">
              {s.durations.filter((d) => d.isActive).map((d) => {
                const selected = selectedServices.some(
                  (x) => x.serviceId === s._id && x.durationId === d._id
                );
                return (
                  <button
                    key={d._id}
                    onClick={() => toggleService(s, d)}
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

      <h3 className="font-medium text-gray-900 mb-3">Add from Menu</h3>
      <div className="mb-6">
        <MenuCategoryAccordion
          items={mocktails}
          gridClassName="grid grid-cols-2 gap-3"
          renderItem={(m) => {
            const isSelected = selectedMocktails.some((x) => x.mocktailId === m._id);
            return (
              <button
                key={m._id}
                onClick={() => toggleMocktail(m)}
                className={`text-left border rounded-lg px-3 py-2 text-sm ${
                  isSelected ? "border-orange-500 bg-orange-50" : "border-gray-200"
                }`}
              >
                <p className="font-medium">{m.name}</p>
                <PriceTag amount={m.price} className="text-xs text-gray-500" />
              </button>
            );
          }}
        />
      </div>

      <button
        onClick={handleAddAndPay}
        disabled={(selectedServices.length === 0 && selectedMocktails.length === 0) || processing}
        className="w-full bg-orange-500 text-white font-medium py-3 rounded-lg disabled:opacity-40"
      >
        {processing
          ? "Opening payment..."
          : selectionTotal > 0
          ? `Add & Pay ₹${selectionTotal}`
          : "Add & Pay Now"}
      </button>
      <p className="text-xs text-gray-400 text-center mt-2">
        Payment is required immediately — items are added to your order only after payment succeeds.
      </p>
    </div>
  );
};

export default AddOnOrder;