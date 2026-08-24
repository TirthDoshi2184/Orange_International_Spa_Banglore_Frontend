import { useEffect, useRef, useState } from "react";
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
import { groupByCategory, MENU_CATEGORY_LABELS_KN } from "../../utils/menuCategories";
import { launchAddonCheckout } from "../../utils/razorpayCheckout";
import logoMark from "../../assets/logo-mark.png";

import { getRoomMembership, confirmAddonWithMembership } from "../../api/bookings.api";

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

  const [serviceSearch, setServiceSearch] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);

  // Scrollspy: which section is currently in view, and whether the footer
  // CTA is visible — together these decide what the floating button shows
  // (or whether it shows at all).
  const [currentZone, setCurrentZone] = useState(null); // "services" | "menu" | null
  const [ctaVisible, setCtaVisible] = useState(false);

  const [membership, setMembership] = useState(null);
const [payMethod, setPayMethod] = useState("razorpay"); // "razorpay" | "membership_credit"

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
    Promise.all([findBookingByRoom(roomId), getServices(), getMocktails(), getRoomMembership(roomId)])
      .then(([b, s, m, mem]) => {
        setBooking(b);
        setServices(s);
        setMocktails(m);
        setMembership(mem);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [roomId]);

  useEffect(() => {
    if (loading) return;
    // Trigger band near the top of the viewport — whichever section's
    // heading crosses it becomes the "current zone".
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
  }, [loading]);

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

  const selectionCount = selectedServices.length + selectedMocktails.length;
  const selectionTotal =
    selectedServices.reduce((sum, s) => sum + s.price, 0) +
    selectedMocktails.reduce((sum, m) => sum + m.price, 0);

  const handleAddAndPay = async () => {
    if (selectedServices.length === 0 && selectedMocktails.length === 0) return;

    if (payMethod === "membership_credit" && (!membership || membership.balance < selectionTotal)) {
      setAddError(
        membership
          ? `Insufficient membership balance. Available: ₹${membership.balance}, Required: ₹${selectionTotal}, Shortfall: ₹${selectionTotal - membership.balance}`
          : "No membership found for this booking."
      );
      return;
    }

    setProcessing(true);
    setAddError("");
    try {
      const payload = {
        services: selectedServices.map(({ serviceId, durationId }) => ({ serviceId, durationId })),
        mocktails: selectedMocktails.map(({ mocktailId }) => ({ mocktailId, qty: 1 })),
      };
      const updated =
        payMethod === "membership_credit"
          ? await confirmAddonWithMembership(booking._id, payload)
          : await launchAddonCheckout({
              bookingId: booking._id,
              ...payload,
              customerName: booking.customerId?.name,
              customerMobile: booking.customerId?.mobileNumber,
            });
      setBooking(updated);
      setSelectedServices([]);
      setSelectedMocktails([]);
      if (payMethod === "membership_credit") {
        getRoomMembership(roomId).then(setMembership).catch(() => {});
      }
    } catch (err) {
      setAddError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Loader label={t("addon.loading")} />;
  if (error && !booking) return <ErrorMessage message={error} />;

  const filteredServices = services.filter((s) =>
    localize(s, "name", language).toLowerCase().includes(serviceSearch.trim().toLowerCase())
  );
  const serviceGroups = groupServicesByCategory(filteredServices);
  const allServiceGroups = groupServicesByCategory(services);
  const allMenuGroups = groupByCategory(mocktails);

  const showFloatingPayBar = selectionCount > 0 && !ctaVisible;
  const showFloatingCategories = currentZone && !ctaVisible;
  const sheetGroups = currentZone === "services" ? allServiceGroups : allMenuGroups;
  const sheetOnPick = currentZone === "services" ? scrollToServiceCategory : scrollToMenuCategory;
  const sheetLabel = (category) =>
    currentZone === "menu" && language === "kn"
      ? MENU_CATEGORY_LABELS_KN[category] || category
      : category;

  return (
    <div className="min-h-screen bg-parchment-50 font-sans">
      {/* Header */}
      <div
        className="px-6 pt-8 pb-9 text-parchment-50"
        style={{ background: "radial-gradient(circle at 30% -20%, #2e2013 0%, #1c130c 65%)" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <img
            src={logoMark}
            alt="Orange International Spa"
            className="w-11 h-11 rounded-full object-cover border border-gold-500"
          />
          <div>
            <p className="font-display uppercase tracking-wide text-gold-300 text-[15px] leading-tight">
              Orange International Spa
            </p>
            <p className="text-[10px] uppercase tracking-widest text-parchment-200/60 mt-0.5">
              {t("addon.title")}
            </p>
          </div>
        </div>
        <h1 className="font-display font-semibold text-3xl leading-tight mb-2">{t("addon.title")}</h1>
        <p className="text-sm text-parchment-200/70">
          {t("addon.bookingLabel")} <span className="text-gold-300 font-medium">{booking.bookingNumber}</span>
          {" · "}
          {t("addon.roomLabel")} <span className="text-gold-300 font-medium">{booking.roomId?.name}</span>
        </p>
      </div>

      <div className="px-5 -mt-5 relative z-10">
        {/* Current order — receipt card */}
        <div className="bg-white rounded-2xl border border-parchment-200 shadow-[0_10px_26px_rgba(60,40,20,0.10)] px-4.5 py-4 text-sm">
          {booking.services.map((s, i) => (
            <div key={`s-${i}`} className="flex justify-between py-1.5 text-ink-900">
              <span className="text-ink-600">
                {localize(s.serviceId, "name", language) || t("addon.serviceFallback")} (
                {s.durationId?.durationMinutes || "?"} {t("addon.minSuffix")})
              </span>
              <PriceTag amount={s.price} />
            </div>
          ))}
          {booking.mocktails.map((m, i) => (
            <div key={`m-${i}`} className="flex justify-between py-1.5 text-ink-900">
              <span className="text-ink-600">
                {localize(m.mocktailId, "name", language) || t("addon.menuItemFallback")} ×{m.qty}
              </span>
              <PriceTag amount={m.price} />
            </div>
          ))}

          <div className="border-t border-dashed border-parchment-200 my-2" />

          <div className="flex justify-between font-semibold text-[15px] text-ink-900 py-1">
            <span>{t("cart.grandTotal")}</span>
            <PriceTag amount={booking.grandTotal} />
          </div>

          <div className="border-t border-espresso-800 my-2" />

          <div className="flex justify-between text-xs text-emerald-700 mt-1.5">
            <span className="opacity-85">{t("addon.paidSoFar")}</span>
            <PriceTag amount={totalPaid} />
          </div>
          <div className={`flex justify-between text-xs font-medium mt-1 ${outstanding > 0 ? "text-amber-700" : "text-emerald-700"}`}>
            <span className="opacity-85">{t("confirmation.outstanding")}</span>
            <PriceTag amount={outstanding} />
          </div>
        </div>

        <ErrorMessage message={error} />
        <ErrorMessage message={addError} />

        {/* Add a treatment — photo cards grouped by category, 2-up grid */}
        <SectionHeading title={t("addon.addServices")} icon="treatment" />
        <div ref={servicesTopRef}>
          <input
            type="text"
            value={serviceSearch}
            onChange={(e) => setServiceSearch(e.target.value)}
            placeholder="Search treatments..."
            className="w-full border border-parchment-200 bg-white rounded-xl px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-600/50 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15 mb-4"
          />

          {serviceGroups.length === 0 && (
            <p className="text-sm text-ink-600/60 py-4 text-center">
              {serviceSearch ? `No treatments match "${serviceSearch}"` : "No treatments available right now."}
            </p>
          )}

          <div className="space-y-6">
            {serviceGroups.map((group) => (
              <div key={group.category} ref={(el) => (serviceSectionRefs.current[group.category] = el)}>
                <p className="sticky top-0 bg-parchment-50/95 backdrop-blur-sm text-xs font-semibold uppercase tracking-wide text-gold-600 py-1.5 z-10">
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
                        className="bg-white border border-parchment-200 rounded-2xl overflow-hidden shadow-[0_6px_16px_rgba(60,40,20,0.06)]"
                      >
                        {/* Photo header — falls back to a branded gradient panel if no image */}
                        <div className="relative w-full h-24">
                          {s.images?.[0] ? (
                            <img
                              src={s.images[0]}
                              alt={localize(s, "name", language)}
                              className="w-full h-full object-cover"
                            />
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
                            {localize(s, "name", language)}
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
                                      ? "border-gold-500 bg-[#FEFAF0] ring-1 ring-gold-500/15"
                                      : "border-parchment-200 bg-parchment-50"
                                  }`}
                                >
                                  {selected && (
                                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gold-500 text-white text-[8px] font-bold flex items-center justify-center border border-white">
                                      ✓
                                    </span>
                                  )}
                                  <span className="text-[9px] text-ink-600">
                                    {d.durationMinutes}
                                    {t("addon.minSuffix")}
                                  </span>
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

        {/* Add from the menu */}
        <SectionHeading title={t("addon.addFromMenu")} icon="menu" />
        <div ref={menuTopRef}>
          {(() => {
            const filtered = mocktails.filter((m) =>
              localize(m, "name", language).toLowerCase().includes(menuSearch.trim().toLowerCase())
            );
            const groups = groupByCategory(filtered);

            return (
              <div className="mb-2">
                <input
                  type="text"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Search the menu..."
                  className="w-full border border-parchment-200 bg-white rounded-xl px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-600/50 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15 mb-4"
                />

                {groups.length === 0 && (
                  <p className="text-sm text-ink-600/60 py-4 text-center">
                    {menuSearch ? `No items match "${menuSearch}"` : "No menu items available right now."}
                  </p>
                )}

                <div className="space-y-5">
                  {groups.map((group) => {
                    const label =
                      language === "kn"
                        ? MENU_CATEGORY_LABELS_KN[group.category] || group.category
                        : group.category;
                    return (
                      <div key={group.category} ref={(el) => (menuSectionRefs.current[group.category] = el)}>
                        <p className="sticky top-0 bg-parchment-50/95 backdrop-blur-sm text-xs font-semibold uppercase tracking-wide text-gold-600 py-1.5 z-10">
                          {label}
                        </p>
                        <div className="grid grid-cols-2 gap-2.5">
                          {group.items.map((m) => {
                            const isSelected = selectedMocktails.some((x) => x.mocktailId === m._id);
                            return (
                              <button
                                key={m._id}
                                onClick={() => toggleMocktail(m)}
                                className={`relative flex flex-col items-start text-left border rounded-xl px-3.5 py-3 transition-all ${
                                  isSelected ? "border-gold-500 bg-[#FEFAF0]" : "border-parchment-200 bg-white"
                                }`}
                              >
                                {isSelected && (
                                  <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-gold-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                                    ✓
                                  </span>
                                )}
                                <span className="text-[13px] font-semibold text-ink-900 leading-snug mb-1.5">
                                  {localize(m, "name", language)}
                                </span>
                                <PriceTag
                                  amount={m.price}
                                  className={`text-[13px] font-bold ${isSelected ? "text-gold-600" : "text-ink-900"}`}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Add & pay — the "I've reviewed everything" moment at the end of the page */}
      <div ref={ctaRef} className="px-5 pt-4 pb-8">
        {membership && (
          <div className="mb-3">
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm mb-2">
              <span className="text-emerald-800">{membership.tier} Membership Balance</span>
              <span className="font-semibold text-emerald-800">₹{membership.balance.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPayMethod("razorpay")}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${
                  payMethod === "razorpay" ? "bg-espresso-950 text-gold-300 border-espresso-950" : "border-parchment-200 text-ink-900"
                }`}
              >
                Pay Online
              </button>
              <button
                onClick={() => setPayMethod("membership_credit")}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${
                  payMethod === "membership_credit" ? "bg-espresso-950 text-gold-300 border-espresso-950" : "border-parchment-200 text-ink-900"
                }`}
              >
                Use Membership
              </button>
            </div>
          </div>
        )}
        <button
          onClick={handleAddAndPay}
          disabled={(selectedServices.length === 0 && selectedMocktails.length === 0) || processing}
          className="w-full bg-gradient-to-br from-espresso-800 to-espresso-950 text-gold-300 font-bold text-[15px] py-4 rounded-2xl shadow-[0_10px_24px_rgba(28,19,12,0.35)] disabled:opacity-40 transition-opacity"
        >
          {processing
            ? t("addon.openingPayment")
            : selectionTotal > 0
            ? t("addon.addAndPayAmount", { amount: selectionTotal })
            : t("addon.addAndPay")}
        </button>
        <p className="text-xs text-ink-600/70 text-center mt-2">{t("addon.note")}</p>
      </div>

      {/* Floating "jump to category" button — sits ABOVE the pay bar when both are showing */}
      {showFloatingCategories && sheetGroups.length > 0 && (
        <button
          onClick={() => setCategorySheetOpen(true)}
          className={`fixed right-5 z-30 flex items-center gap-2 bg-espresso-950 text-gold-300 pl-3.5 pr-4 py-3 rounded-full shadow-[0_8px_20px_rgba(28,19,12,0.4)] transition-all ${
            showFloatingPayBar ? "bottom-24" : "bottom-6"
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

      {/* Floating pay bar — reachable from anywhere once something's selected, no scrolling needed */}
      {showFloatingPayBar && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-3 bg-gradient-to-t from-parchment-50 via-parchment-50/95 to-transparent">
          <button
            onClick={handleAddAndPay}
            disabled={processing}
            className="w-full flex items-center justify-between bg-gradient-to-br from-espresso-800 to-espresso-950 text-gold-300 rounded-2xl px-5 py-3.5 shadow-[0_10px_24px_rgba(28,19,12,0.4)] disabled:opacity-60"
          >
            <span className="text-xs text-parchment-200/80">
              {selectionCount} item{selectionCount !== 1 ? "s" : ""} selected
            </span>
            <span className="flex items-center gap-2 font-bold text-[15px]">
              {processing ? t("addon.openingPayment") : `${t("addon.addAndPay")} · ₹${selectionTotal}`}
              {!processing && (
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
            <div className="sticky top-0 bg-white px-5 pt-3 pb-2 border-b border-parchment-200">
              <div className="w-10 h-1 rounded-full bg-parchment-200 mx-auto mb-3" />
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
                  className="w-full flex items-center justify-between px-5 py-3 text-sm text-ink-900 hover:bg-parchment-50 text-left"
                >
                  <span>{sheetLabel(group.category)}</span>
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

const SectionHeading = ({ title, icon }) => (
  <div className="flex items-center gap-2.5 mt-7 mb-3">
    <svg className="w-4 h-4 text-gold-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      {icon === "treatment" ? (
        <>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 5c-2 2-2.5 3.5-1.3 5.4S12 13 12 13" />
        </>
      ) : (
        <path d="M6 3l12 0M8 3l1.2 9a4 4 0 0 0 5.6 0L16 3M12 12v9" />
      )}
    </svg>
    <h2 className="font-display font-semibold text-lg text-ink-900">{title}</h2>
    <div className="flex-1 h-px bg-gradient-to-r from-parchment-200 to-transparent" />
  </div>
);

export default AddOnOrder;