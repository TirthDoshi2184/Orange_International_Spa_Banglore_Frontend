import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBookingById } from "../../api/bookings.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";

const InvoiceView = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getBookingById(id)
      .then(setBooking)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader label="Loading invoice..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!booking) return null;

  const totalPaid = booking.paymentHistory?.reduce((sum, p) => sum + p.amount, 0) || 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-end mb-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm"
        >
          Print Invoice
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-8" id="invoice-content">
        <div className="text-center mb-6 border-b border-gray-200 pb-6">
          <h1 className="text-2xl font-bold">Orange International Spa</h1>
          <p className="text-sm text-gray-500 mt-1">Invoice</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-gray-500">Booking Number</p>
            <p className="font-medium">{booking.bookingNumber}</p>
          </div>
          <div>
            <p className="text-gray-500">Date</p>
            <p className="font-medium">{new Date(booking.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <div>
            <p className="text-gray-500">Customer</p>
            <p className="font-medium">{booking.customerId?.name}</p>
          </div>
          <div>
            <p className="text-gray-500">Mobile</p>
            <p className="font-medium">{booking.customerId?.mobileNumber}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-gray-300 text-left text-gray-500">
              <th className="py-2">Item</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {booking.services.map((s, i) => (
              <tr key={`s-${i}`} className="border-b border-gray-100">
                <td className="py-2">{s.serviceId?.name} ({s.durationId?.durationMinutes} min)</td>
                <td className="py-2 text-right">₹{s.price}</td>
              </tr>
            ))}
            {booking.mocktails.map((m, i) => (
              <tr key={`m-${i}`} className="border-b border-gray-100">
                <td className="py-2">{m.mocktailId?.name} x{m.qty}</td>
                <td className="py-2 text-right">₹{m.price}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-gray-300 pt-3 space-y-1 text-sm mb-6">
          <div className="flex justify-between"><span>Subtotal</span><span>₹{booking.subtotal}</span></div>
          {booking.discount > 0 && (
            <div className="flex justify-between text-green-700"><span>Discount</span><span>−₹{booking.discount}</span></div>
          )}
          <div className="flex justify-between"><span>GST</span><span>₹{booking.gst}</span></div>
          <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-2">
            <span>Grand Total</span><span>₹{booking.grandTotal}</span>
          </div>
        </div>

        <div className="mb-2">
          <p className="text-sm font-medium text-gray-700 mb-2">Payment Details</p>
          <table className="w-full text-sm">
            <tbody>
              {booking.paymentHistory?.map((p, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-1.5 capitalize">{p.method} {p.reference ? `(${p.reference})` : ""}</td>
                  <td className="py-1.5 text-right">₹{p.amount}</td>
                  <td className="py-1.5 text-right text-gray-400 text-xs">
                    {new Date(p.paidAt).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between text-sm font-medium mt-2 pt-2 border-t border-gray-200">
            <span>Total Paid</span><span>₹{totalPaid}</span>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">Thank you for visiting Orange International Spa!</p>
      </div>
    </div>
  );
};

export default InvoiceView;