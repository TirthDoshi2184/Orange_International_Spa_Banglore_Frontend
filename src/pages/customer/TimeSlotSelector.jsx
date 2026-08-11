import { useEffect, useState } from "react";
import { getAvailableSlots } from "../../api/timeslots.api";
import { useCart } from "../../context/CartContext";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import { useTranslation } from "react-i18next";


const TimeSlotSelector = () => {
  const { cart, setTimeSlot } = useCart();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { t } = useTranslation();

  useEffect(() => {
    getAvailableSlots()
      .then(setSlots)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label={t("cart.loadingSlots")} />;
  if (error) return <ErrorMessage message={error} />;

  if (slots.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4">
        {t("cart.noSlots")}
      </p>
    );
  }

  return (
    <div>
      <h3 className="font-medium text-gray-900 mb-3">{t("cart.timeSlot")}</h3>
      <div className="flex flex-wrap gap-3">
        {slots.map((slot) => {
          const remaining = slot.maxCapacity - slot.booked;
          const isFull = remaining <= 0;
          const isSelected = cart.timeSlotId === slot._id;

          return (
            <button
              key={slot._id}
              type="button"
              disabled={isFull}
              onClick={() => setTimeSlot(slot._id, slot.time)}
              className={`px-4 py-2 rounded-lg border text-sm ${
                isFull
                  ? "border-gray-100 text-gray-300 cursor-not-allowed"
                  : isSelected
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="font-medium">{slot.time}</div>
              <div className="text-xs">
                {isFull ? t("cart.full") : t("cart.left", { count: remaining })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimeSlotSelector;