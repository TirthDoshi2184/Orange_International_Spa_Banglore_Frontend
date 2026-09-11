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

  const totalPaid =
    booking.paymentHistory?.reduce((sum, p) => sum + p.amount, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          html, body {
            width: 80mm;
            margin: 0;
            padding: 0;
          }
          body * {
            visibility: hidden;
          }
          #invoice-content, #invoice-content * {
            visibility: visible;
          }
          #invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            max-width: 80mm;
            box-shadow: none !important;
            padding: 8px 6px !important;
          }
        }
      `}</style>

      <div className="flex justify-center mb-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm"
        >
          Print Invoice
        </button>
      </div>

      {/* Receipt */}
      <div
        id="invoice-content"
        className="mx-auto bg-white text-gray-800 font-mono text-xs leading-relaxed shadow-md"
        style={{ maxWidth: "320px", padding: "20px 16px" }}
      >
        {/* Header */}
        <div className="text-center mb-3">
          <p className="text-sm font-bold tracking-wide uppercase">
            Orange International Spa
          </p>
          <p className="text-[11px] text-gray-500 mt-1">Payment Receipt</p>
          <p className="text-[10px] text-gray-500 mt-1">
            GSTIN: 29GUSPS5944D1ZR
          </p>
        </div>

        <Dashes />

        {/* Meta */}
        <div className="space-y-0.5 my-2">
          <Row label="Booking #" value={booking.bookingNumber} />
          <Row
            label="Date"
            value={new Date(booking.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          />
          <Row
            label="Time"
            value={new Date(booking.createdAt).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
          <Row label="Customer" value={booking.customerId?.name} />
          <Row label="Mobile" value={booking.customerId?.mobileNumber} />
        </div>

        <Dashes />

        {/* Line items */}
        <div className="my-2">
          {booking.services.map((s, i) => (
            <ItemRow
              key={`s-${i}`}
              name={`${s.serviceId?.name} (${s.durationId?.durationMinutes}m)`}
              amount={s.price}
            />
          ))}
          {booking.mocktails.map((m, i) => (
            <ItemRow
              key={`m-${i}`}
              name={`${m.mocktailId?.name} x${m.qty}`}
              amount={m.price}
            />
          ))}
        </div>

        <Dashes />

        {/* Totals */}
        <div className="my-2 space-y-0.5">
          <Row label="Subtotal" value={`₹${booking.subtotal}`} />
          {booking.discount > 0 && (
            <Row label="Discount" value={`-₹${booking.discount}`} />
          )}
          <Row label="GST" value={`₹${booking.gst}`} />
        </div>

        <Dashes char="=" />

        <div className="flex justify-between font-bold text-sm my-2">
          <span>TOTAL</span>
          <span>₹{booking.grandTotal}</span>
        </div>

        <Dashes char="=" />

        {/* Payments */}
        <div className="my-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-1">
            Payment
          </p>
          {booking.paymentHistory?.map((p, i) => (
            <Row
              key={i}
              label={
                (p.method === "membership_credit"
                  ? "Membership Credit"
                  : capitalize(p.method)) + (p.reference ? ` (${p.reference})` : "")
              }
              value={`₹${p.amount}`}
            />
          ))}
        </div>

        <Dashes />

        <div className="flex justify-between font-bold my-2">
          <span>PAID</span>
          <span>₹{totalPaid}</span>
        </div>

        <Dashes />

        <div className="text-center mt-4 space-y-1">
          <p className="text-[11px]">*** THANK YOU ***</p>
          <p className="text-[10px] text-gray-500">
            Visit us again at Orange International Spa
          </p>
        </div>
      </div>
    </div>
  );
};

const Dashes = ({ char = "-" }) => (
  <div className="whitespace-nowrap overflow-hidden text-gray-400 select-none">
    {char.repeat(60)}
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-2">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium text-right">{value}</span>
  </div>
);

const ItemRow = ({ name, amount }) => (
  <div className="flex justify-between gap-2 py-0.5">
    <span className="flex-1">{name}</span>
    <span className="whitespace-nowrap">₹{amount}</span>
  </div>
);

const capitalize = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

export default InvoiceView;

// Second Option:

// import { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { getBookingById } from "../../api/bookings.api";
// import Loader from "../../components/shared/Loader";
// import ErrorMessage from "../../components/shared/ErrorMessage";

// const InvoiceView = () => {
//   const { id } = useParams();
//   const [booking, setBooking] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     getBookingById(id)
//       .then(setBooking)
//       .catch((err) => setError(err.message))
//       .finally(() => setLoading(false));
//   }, [id]);

//   if (loading) return <Loader label="Loading invoice..." />;
//   if (error) return <ErrorMessage message={error} />;
//   if (!booking) return null;

//   const totalPaid =
//     booking.paymentHistory?.reduce((sum, p) => sum + p.amount, 0) || 0;

//   return (
//     <div className="min-h-screen bg-gray-100 py-8 px-4">
//       <style>{`
//         @media print {
//           @page {
//             size: 80mm auto;
//             margin: 0;
//           }
//           html, body {
//             width: 80mm;
//             margin: 0;
//             padding: 0;
//           }
//           body * {
//             visibility: hidden;
//           }
//           #invoice-content, #invoice-content * {
//             visibility: visible;
//           }
//           #invoice-content {
//             position: absolute;
//             left: 0;
//             top: 0;
//             width: 80mm;
//             max-width: 80mm;
//             box-shadow: none !important;
//             padding: 8px 6px !important;
//           }
//         }
//       `}</style>

//       <div className="flex justify-center mb-4 print:hidden">
//         <button
//           onClick={() => window.print()}
//           className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm"
//         >
//           Print Invoice
//         </button>
//       </div>

//       {/* Receipt */}
//       <div
//         id="invoice-content"
//         className="mx-auto bg-white text-gray-800 font-mono text-xs leading-relaxed shadow-md"
//         style={{ maxWidth: "320px", padding: "20px 16px" }}
//       >
//         {/* Header */}
//         <div className="text-center mb-3">
//           <p className="text-sm font-bold tracking-wide uppercase">
//             Orange International Spa
//           </p>
//           <p className="text-[11px] text-gray-500 mt-1">Payment Receipt</p>
//         </div>

//         <Dashes />

//         {/* Meta */}
//         <div className="space-y-0.5 my-2">
//           <Row label="Booking #" value={booking.bookingNumber} />
//           <Row
//             label="Date"
//             value={new Date(booking.createdAt).toLocaleDateString("en-IN", {
//               day: "numeric",
//               month: "short",
//               year: "numeric",
//             })}
//           />
//           <Row
//             label="Time"
//             value={new Date(booking.createdAt).toLocaleTimeString("en-IN", {
//               hour: "2-digit",
//               minute: "2-digit",
//             })}
//           />
//           <Row label="Customer" value={booking.customerId?.name} />
//           <Row label="Mobile" value={booking.customerId?.mobileNumber} />
//         </div>

//         <Dashes />

//         {/* Line items */}
//         <div className="my-2">
//           {booking.services.map((s, i) => (
//             <ItemRow
//               key={`s-${i}`}
//               name={`${s.serviceId?.name} (${s.durationId?.durationMinutes}m)`}
//               amount={s.price}
//             />
//           ))}
//           {booking.mocktails.map((m, i) => (
//             <ItemRow
//               key={`m-${i}`}
//               name={`${m.mocktailId?.name} x${m.qty}`}
//               amount={m.price}
//             />
//           ))}
//         </div>

//         <Dashes />

//         {/* Totals */}
//         <div className="my-2 space-y-0.5">
//           <Row label="Subtotal" value={`₹${booking.subtotal}`} />
//           {booking.discount > 0 && (
//             <Row label="Discount" value={`-₹${booking.discount}`} />
//           )}
//           <Row label="GST" value={`₹${booking.gst}`} />
//         </div>

//         <Dashes char="=" />

//         <div className="flex justify-between font-bold text-sm my-2">
//           <span>TOTAL</span>
//           <span>₹{booking.grandTotal}</span>
//         </div>

//         <Dashes char="=" />

//         {/* Payments */}
//         <div className="my-2">
//           <p className="text-[11px] font-semibold uppercase tracking-wide mb-1">
//             Payment
//           </p>
//           {booking.paymentHistory?.map((p, i) => (
//             <Row
//               key={i}
//               label={
//                 (p.method === "membership_credit"
//                   ? "Membership Credit"
//                   : capitalize(p.method)) + (p.reference ? ` (${p.reference})` : "")
//               }
//               value={`₹${p.amount}`}
//             />
//           ))}
//         </div>

//         <Dashes />

//         <div className="flex justify-between font-bold my-2">
//           <span>PAID</span>
//           <span>₹{totalPaid}</span>
//         </div>

//         <Dashes />

//         <div className="text-center mt-4 space-y-1">
//           <p className="text-[11px]">*** THANK YOU ***</p>
//           <p className="text-[10px] text-gray-500">
//             Visit us again at Orange International Spa
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Dashes = ({ char = "-" }) => (
//   <div className="whitespace-nowrap overflow-hidden text-gray-400 select-none">
//     {char.repeat(60)}
//   </div>
// );

// const Row = ({ label, value }) => (
//   <div className="flex justify-between gap-2">
//     <span className="text-gray-600">{label}</span>
//     <span className="font-medium text-right">{value}</span>
//   </div>
// );

// const ItemRow = ({ name, amount }) => (
//   <div className="flex justify-between gap-2 py-0.5">
//     <span className="flex-1">{name}</span>
//     <span className="whitespace-nowrap">₹{amount}</span>
//   </div>
// );

// const capitalize = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

// export default InvoiceView;