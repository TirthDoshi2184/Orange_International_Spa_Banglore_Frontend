import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { findBookingByRoom } from "../../api/bookings.api";
import { getServices } from "../../api/services.api";
import { getMocktails } from "../../api/mocktails.api";
import { useLanguage } from "../../context/LanguageContext";
import { localize } from "../../utils/localize";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";
import MenuCategoryAccordion from "../../components/shared/MenuCategoryAccordion";
import { launchAddonCheckout } from "../../utils/razorpayCheckout";

const AddOnOrder = () => {
  const { roomId } = useParams();
  const { t } = useTranslation();
  const { language } = useLanguage();

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
          name: localize(service, "name", language), // stored localized at selection time
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
      return [...prev, { mocktailId: m._id, name: localize(m, "name", language), qty: 1 }];
    });
  };

  const totalPaid = booking?.paymentHistory?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const outstanding = booking ? booking.grandTotal - totalPaid : 0;

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
      setAddError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Loader label={t("addon.loading")} />;
  if (error && !booking) return <ErrorMessage message={error} />;

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-1">{t("addon.title")}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {t("addon.bookingLabel")} {booking.bookingNumber} · {t("addon.roomLabel")} {booking.roomId?.name}
      </p>

      {/* Current order summary */}
      <div className="border border-gray-200 rounded-lg px-4 py-3 mb-6 text-sm space-y-2">
        {booking.services.map((s, i) => (
          <div key={`s-${i}`} className="flex justify-between">
            <span>
              {localize(s.serviceId, "name", language) || t("addon.serviceFallback")} (
              {s.durationId?.durationMinutes || "?"} {t("addon.minSuffix")})
            </span>
            <PriceTag amount={s.price} />
          </div>
        ))}
        {booking.mocktails.map((m, i) => (
          <div key={`m-${i}`} className="flex justify-between">
            <span>{localize(m.mocktailId, "name", language) || t("addon.menuItemFallback")} x{m.qty}</span>
            <PriceTag amount={m.price} />
          </div>
        ))}
        <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold">
          <span>{t("cart.grandTotal")}</span>
          <PriceTag amount={booking.grandTotal} />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{t("addon.paidSoFar")}</span>
          <PriceTag amount={totalPaid} />
        </div>
        <div className={`flex justify-between text-xs font-medium ${outstanding > 0 ? "text-amber-600" : "text-green-600"}`}>
          <span>{t("confirmation.outstanding")}</span>
          <PriceTag amount={outstanding} />
        </div>
      </div>

      <ErrorMessage message={error} />
      <ErrorMessage message={addError} />

      <h3 className="font-medium text-gray-900 mb-3">{t("addon.addServices")}</h3>
      <div className="space-y-2 mb-6">
        {services.map((s) => (
          <div key={s._id} className="border border-gray-200 rounded-lg px-3 py-2">
            <p className="text-sm font-medium mb-1">{localize(s, "name", language)}</p>
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
                    {d.durationMinutes}{t("addon.minSuffix")} · ₹{d.price}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <h3 className="font-medium text-gray-900 mb-3">{t("addon.addFromMenu")}</h3>
      <div className="mb-6">
         <MenuCategoryAccordion
          items={mocktails}
          language={language}
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
                <p className="font-medium">{localize(m, "name", language)}</p>
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
          ? t("addon.openingPayment")
          : selectionTotal > 0
          ? t("addon.addAndPayAmount", { amount: selectionTotal })
          : t("addon.addAndPay")}
      </button>
      <p className="text-xs text-gray-400 text-center mt-2">{t("addon.note")}</p>
    </div>
  );
};

export default AddOnOrder;