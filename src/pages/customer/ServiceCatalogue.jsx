import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getServices } from "../../api/services.api";
import { useLanguage } from "../../context/LanguageContext";
import { localize } from "../../utils/localize";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";

const ServiceCatalogue = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getServices().then(setServices).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading services..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">{t("catalogue.title")}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {services.map((service) => {
          const activeDurations = service.durations.filter((d) => d.isActive);
          const minPrice = activeDurations.length ? Math.min(...activeDurations.map((d) => d.price)) : null;

          return (
            <Link key={service._id} to={`/services/${service._id}`} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <img src={service.images?.[0]} alt={localize(service, "name", language)} className="w-full h-40 object-cover" />
              <div className="p-4">
                <p className="text-xs text-orange-600 font-medium uppercase mb-1">{localize(service, "category", language)}</p>
                <h2 className="font-semibold text-gray-900">{localize(service, "name", language)}</h2>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{localize(service, "description", language)}</p>
                {minPrice !== null && (
                  <p className="text-sm mt-2 text-gray-700">
                    {t("catalogue.from")} <PriceTag amount={minPrice} className="font-semibold" />
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceCatalogue;