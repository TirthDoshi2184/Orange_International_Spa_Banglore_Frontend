import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { createBooking } from "../../api/bookings.api";
import ErrorMessage from "../../components/shared/ErrorMessage";
import { launchRazorpayCheckout } from "../../utils/razorpayCheckout";

const Checkout = () => {
  const { cart, toBookingPayload, isEmpty, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    mobileNumber: "",
    email: "",
    gender: "",
    specialInstructions: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Safety redirect — checkout with no items or no slot shouldn't be reachable directly
  if (isEmpty || !cart.timeSlotId) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">
          {isEmpty ? "Your cart is empty." : "Please select a time slot first."}
        </p>
        <button onClick={() => navigate("/cart")} className="text-orange-600 font-medium">
          ← Back to cart
        </button>
      </div>
    );
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.mobileNumber.trim()) {
      setError("Name and mobile number are required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer: {
          name: form.name.trim(),
          mobileNumber: form.mobileNumber.trim(),
          ...(form.email.trim() ? { email: form.email.trim() } : {}),
          ...(form.gender ? { gender: form.gender } : {}),
        },
        ...toBookingPayload(),
        timeSlotId: cart.timeSlotId,
        ...(form.specialInstructions.trim() ? { specialInstructions: form.specialInstructions.trim() } : {}),
      };

      const booking = await createBooking(payload);
clearCart();

try {
  await launchRazorpayCheckout({
    bookingId: booking._id,
    amount: booking.grandTotal,
    customerName: form.name,
    customerMobile: form.mobileNumber,
  });
} catch (payErr) {
  // Payment failed/cancelled — booking still exists as "pending", customer can pay later from confirmation page
  console.warn("Payment not completed:", payErr.message);
}

navigate(`/booking/${booking._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>

      <div className="bg-orange-50 border border-orange-100 rounded-lg px-4 py-3 mb-6 text-sm text-orange-700">
        Time slot: <span className="font-medium">{cart.timeSlotLabel}</span>
      </div>

      <ErrorMessage message={error} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
          <input
            name="mobileNumber"
            value={form.mobileNumber}
            onChange={handleChange}
            required
            type="tel"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            type="email"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
          <textarea
            name="specialInstructions"
            value={form.specialInstructions}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-orange-500 text-white font-medium py-3 rounded-lg disabled:opacity-50 hover:bg-orange-600"
        >
          {submitting ? "Placing booking..." : "Place Booking"}
        </button>
      </form>
    </div>
  );
};

export default Checkout;