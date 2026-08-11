// hooks/useNewOrdersCount.js
import { useEffect, useRef, useState } from "react";

const LAST_SEEN_KEY = "reception_last_seen_order_id";
const POLL_INTERVAL = 10000; // 10s

export const useNewOrdersCount = (fetchOrdersFn) => {
  const [newCount, setNewCount] = useState(0);
  const [latestOrderId, setLatestOrderId] = useState(null);
  const lastSeenRef = useRef(localStorage.getItem(LAST_SEEN_KEY));

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const raw = await fetchOrdersFn();
        if (cancelled || !raw || raw.length === 0) return;

        // sort newest-first regardless of what the API returns
        const orders = [...raw].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setLatestOrderId(orders[0]._id);

        const lastSeenId = lastSeenRef.current;
        if (!lastSeenId) {
          localStorage.setItem(LAST_SEEN_KEY, orders[0]._id);
          lastSeenRef.current = orders[0]._id;
          return;
        }

        const idx = orders.findIndex((o) => o._id === lastSeenId);
        const unseen = idx === -1 ? orders.length : idx;
        setNewCount(unseen);
      } catch {
        // silent fail — don't spam reception with polling errors
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fetchOrdersFn]);

  const markAllSeen = (id) => {
    const idToStore = id || latestOrderId;
    if (!idToStore) return;
    localStorage.setItem(LAST_SEEN_KEY, idToStore);
    lastSeenRef.current = idToStore;
    setNewCount(0);
  };

  return { newCount, markAllSeen, latestOrderId };
};