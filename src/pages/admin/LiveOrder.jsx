import { useEffect, useState, useCallback } from "react";
import { getAddonOrders, updateAddonOrderStatus } from "../../api/admin.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PriceTag from "../../components/shared/PriceTag";

const columns = [
  { status: "pending", label: "Pending", color: "border-amber-300 bg-amber-50", next: "preparing", nextLabel: "Start Preparing" },
  { status: "preparing", label: "Preparing", color: "border-orange-300 bg-orange-50", next: "delivered", nextLabel: "Mark Delivered" },
  { status: "delivered", label: "Delivered", color: "border-green-300 bg-green-50", next: null, nextLabel: null },
];

const timeAgo = (date) => {
  const diffMin = Math.floor((Date.now() - new Date(date)) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ${diffMin % 60}m ago`;
};

const LiveOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const load = useCallback(() => {
    getAddonOrders()
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // poll every 15s — simple, no websocket needed for this scale
    return () => clearInterval(interval);
  }, [load]);

  const handleAdvance = async (id, nextStatus) => {
    setActionError("");
    try {
      const updated = await updateAddonOrderStatus(id, nextStatus);
      setOrders((prev) => prev.map((o) => (o._id === id ? updated : o)));
    } catch (err) {
      setActionError(err.message);
    }
  };

  if (loading) return <Loader label="Loading orders..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="px-6 py-6">
      <h1 className="text-xl font-semibold mb-6">Live Orders</h1>
      <ErrorMessage message={actionError} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => {
          const columnOrders = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status} className={`border rounded-xl p-4 ${col.color}`}>
              <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
                {col.label}
                <span className="text-xs font-normal bg-white rounded-full px-2 py-0.5">{columnOrders.length}</span>
              </h3>

              <div className="space-y-3">
                {columnOrders.length === 0 && (
                  <p className="text-xs text-gray-400">Nothing here.</p>
                )}
                {columnOrders.map((order) => (
                  <div key={order._id} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                       <span className="text-sm font-medium">
                       {order.roomId?.name || (order.source === "initial" ? "New Booking · no room yet" : "—")}
                     </span>
                      <span className="text-xs text-gray-400">{timeAgo(order.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {order.bookingId?.bookingNumber} · {order.bookingId?.customerId?.name}
                    </p>
                    <div className="text-xs text-gray-700 space-y-0.5 mb-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{item.name} {item.qty > 1 ? `x${item.qty}` : ""}</span>
                          <PriceTag amount={item.price} />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                      <PriceTag amount={order.amount} className="text-xs font-medium" />
                      {col.next && (
                        <button
                          onClick={() => handleAdvance(order._id, col.next)}
                          className="text-xs bg-gray-900 text-white px-2.5 py-1 rounded-md"
                        >
                          {col.nextLabel}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveOrders;