import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getBookingById, confirmPayment } from "../../api/bookings.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";

import { launchRazorpayCheckout } from "../../utils/razorpayCheckout";
const BookingConfirmation = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    getBookingById(id)
      .then(setBooking)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const totalPaid = booking?.paymentHistory?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const outstanding = booking ? booking.grandTotal - totalPaid : 0;


// replace handleMockConfirmPayment with:
const handlePayOutstanding = async () => {
  setConfirming(true);
  setError("");
  try {
    const updated = await launchRazorpayCheckout({
      bookingId: booking._id,
      amount: outstanding,
      customerName: booking.customerId?.name,
      customerMobile: booking.customerId?.mobileNumber,
    });
    setBooking(updated);
  } catch (err) {
    setError(err.message);
  } finally {
    setConfirming(false);
  }
};
  if (loading) return <Loader label="Loading booking..." />;
  if (error && !booking) return <ErrorMessage message={error} />;
  if (!booking) return null;

  const statusColor = { paid: "text-green-600", partial: "text-amber-600", pending: "text-gray-500", failed: "text-red-600" };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
        <h1 className="text-2xl font-semibold">Booking Placed</h1>
        <p className="text-gray-500 text-sm mt-1 capitalize">{booking.paymentStatus}</p>
      </div>

      <div className="border border-gray-200 rounded-xl p-5 space-y-3 mb-6">
        <Row label="Booking Number" value={booking.bookingNumber} />
        <Row label="Queue Number" value={`#${booking.queueNumber}`} />
        <Row label="Time Slot" value={booking.timeSlot?.time || "—"} />
        <Row label="Payment Status" value={<span className={`font-medium capitalize ${statusColor[booking.paymentStatus]}`}>{booking.paymentStatus}</span>} />
        <Row label="Booking Status" value={booking.bookingStatus} />
        <div className="border-t border-gray-100 pt-3 mt-1">
          <Row label="Subtotal" value={<PriceTag amount={booking.subtotal} />} />
          {booking.discount > 0 && <Row label="Discount" value={`−₹${booking.discount}`} />}
          <Row label="GST" value={<PriceTag amount={booking.gst} />} />
          <Row label={<span className="font-semibold">Grand Total</span>} value={<PriceTag amount={booking.grandTotal} className="font-semibold" />} />
          <Row label="Paid" value={<PriceTag amount={totalPaid} />} />
          <Row label="Outstanding" value={<PriceTag amount={outstanding} className={outstanding > 0 ? "text-amber-600" : "text-green-600"} />} />
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

      <ErrorMessage message={error} />

      {outstanding > 0 && (
        <div className="mb-4">
          <button onClick={handlePayOutstanding} disabled={confirming} className="...">
  {confirming ? "Processing..." : `Pay ₹${outstanding} with Razorpay`}
</button>
        </div>
      )}

      <Link to="/" className="block text-center text-orange-600 font-medium">← Back to services</Link>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="text-gray-900">{value}</span>
  </div>
);

export default BookingConfirmation;