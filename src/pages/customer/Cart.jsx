import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { getMocktails } from "../../api/mocktails.api";
import { calculateCart } from "../../api/bookings.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";
import MenuCategoryAccordion from "../../components/shared/MenuCategoryAccordion";
import TimeSlotSelector from "./TimeSlotSelector";

const Cart = () => {
  const {
    cart,
    removeService,
    addMocktail,
    updateMocktailQty,
    setCouponCode,
    toBookingPayload,
    isEmpty,
  } = useCart();
  const navigate = useNavigate();

  const [mocktails, setMocktails] = useState([]);
  const [totals, setTotals] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState("");
  const [couponInput, setCouponInput] = useState(cart.couponCode || "");

  useEffect(() => {
    getMocktails().then(setMocktails).catch(() => {});
  }, []);

  const runCalculation = useCallback(() => {
    if (isEmpty) {
      setTotals(null);
      return;
    }
    setCalcLoading(true);
    setCalcError("");
    calculateCart(toBookingPayload())
      .then(setTotals)
      .catch((err) => {
        setCalcError(err.message);
        setTotals(null);
      })
      .finally(() => setCalcLoading(false));
  }, [cart.services, cart.mocktails, cart.couponCode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const debounce = setTimeout(runCalculation, 400);
    return () => clearTimeout(debounce);
  }, [runCalculation]);

  const handleApplyCoupon = () => {
    setCouponCode(couponInput.trim());
  };

  const canProceed = !isEmpty && cart.timeSlotId && totals && !calcError;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Your Cart</h1>

      {isEmpty ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">Your cart is empty.</p>
          <Link to="/" className="text-orange-600 font-medium">Browse services →</Link>
        </div>
      ) : (
        <>
          {/* Selected services */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Services</h3>
            <div className="space-y-2">
              {cart.services.map((s) => (
                <div
                  key={`${s.serviceId}-${s.durationId}`}
                  className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.durationMinutes} min</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <PriceTag amount={s.price} className="text-sm font-medium" />
                    <button
                      onClick={() => removeService(s.serviceId, s.durationId)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Menu (juices, shakes, food, desserts, etc — was "Mocktails", now the full F&B menu) */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Add from Menu</h3>
            <div className="mb-4">
              <MenuCategoryAccordion
                items={mocktails}
                renderItem={(m) => (
                  <div key={m._id} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <PriceTag amount={m.price} className="text-xs text-gray-500" />
                    </div>
                    <button
                      onClick={() => addMocktail({ mocktailId: m._id, name: m.name, price: m.price })}
                      className="text-xs bg-orange-500 text-white px-3 py-1 rounded-md hover:bg-orange-600"
                    >
                      Add
                    </button>
                  </div>
                )}
              />
            </div>

            {cart.mocktails.length > 0 && (
              <div className="space-y-2">
                {cart.mocktails.map((m) => (
                  <div key={m.mocktailId} className="flex items-center justify-between text-sm">
                    <span>{m.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateMocktailQty(m.mocktailId, m.qty - 1)}
                        className="w-6 h-6 border border-gray-300 rounded text-gray-600"
                      >
                        −
                      </button>
                      <span>{m.qty}</span>
                      <button
                        onClick={() => updateMocktailQty(m.mocktailId, m.qty + 1)}
                        className="w-6 h-6 border border-gray-300 rounded text-gray-600"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Time slot */}
          <div className="mb-6">
            <TimeSlotSelector />
          </div>

          {/* Coupon */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Coupon Code</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Enter coupon code"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={handleApplyCoupon}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-4 mb-6">
            {calcLoading && <Loader label="Calculating..." />}
            <ErrorMessage message={calcError} />
            {totals && !calcLoading && (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><PriceTag amount={totals.subtotal} /></div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span><span>−<PriceTag amount={totals.discount} /></span>
                  </div>
                )}
                <div className="flex justify-between"><span>GST</span><PriceTag amount={totals.gst} /></div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-100 mt-2">
                  <span>Grand Total</span><PriceTag amount={totals.grandTotal} />
                </div>
              </div>
            )}
          </div>

          <button
            disabled={!canProceed}
            onClick={() => navigate("/checkout")}
            className="w-full bg-orange-500 text-white font-medium py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-600"
          >
            {!cart.timeSlotId ? "Select a time slot to continue" : "Proceed to Checkout"}
          </button>
        </>
      )}
    </div>
  );
};

export default Cart;