import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getServiceById } from "../../api/services.api";
import { useCart } from "../../context/CartContext";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../context/LanguageContext";
import { localize, localizeArray } from "../../utils/localize";

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addService } = useCart();

  const [service, setService] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { t } = useTranslation();
const { language } = useLanguage();


  useEffect(() => {
    getServiceById(id)
      .then((data) => {
        setService(data);
        const firstActive = data.durations?.find((d) => d.isActive);
        setSelectedDuration(firstActive || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!selectedDuration) return;
    addService({
  serviceId: service._id,
  durationId: selectedDuration._id,
  name: localize(service, "name", language),
  durationMinutes: selectedDuration.durationMinutes,
  price: selectedDuration.price,
});
    navigate("/cart");
  };

  if (loading) return <Loader label="Loading service details..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!service) return null;

  const activeDurations = service.durations.filter((d) => d.isActive);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <img
        src={service.images?.[0]}
        alt={service.name}
        className="w-full h-64 object-cover rounded-xl mb-6"
      />

      <p className="text-xs text-orange-600 font-medium uppercase mb-1">{service.category}</p>
      <h1 className="text-2xl font-semibold mb-3">{localize(service, "name", language)}</h1>
<p className="text-gray-600 mb-6">{localize(service, "description", language)}</p>

{localizeArray(service, "benefits", language).length > 0 && (
  <div className="mb-5">
    <h3 className="font-medium text-gray-900 mb-2">{t("serviceDetail.benefits")}</h3>
    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
      {localizeArray(service, "benefits", language).map((b, i) => <li key={i}>{b}</li>)}
    </ul>
  </div>
)}

{localizeArray(service, "instructions", language).length > 0 && (
  <div className="mb-6">
    <h3 className="font-medium text-gray-900 mb-2">{t("serviceDetail.instructions")}</h3>
    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
      {localizeArray(service, "instructions", language).map((instr, i) => <li key={i}>{instr}</li>)}
    </ul>
  </div>
)}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Select Duration</h3>
        {activeDurations.length === 0 ? (
          <p className="text-sm text-gray-500">No durations currently available for this service.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {activeDurations.map((d) => (
              <button
                key={d._id}
                onClick={() => setSelectedDuration(d)}
                className={`px-4 py-3 rounded-lg border text-sm ${
                  selectedDuration?._id === d._id
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="font-medium">{d.durationMinutes} min</div>
                <PriceTag amount={d.price} />
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleAddToCart}
        disabled={!selectedDuration}
        className="w-full bg-orange-500 text-white font-medium py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
      >
        Add to Cart
      </button>
    </div>
  );
};

export default ServiceDetail;