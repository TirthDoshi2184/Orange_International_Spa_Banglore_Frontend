import { useEffect, useRef, useState, useCallback } from "react";
import { getAdminBookings, updateBookingStatus } from "../../api/admin.api";
import Loader from "../../components/shared/Loader";
import ErrorMessage from "../../components/shared/ErrorMessage";

// Generates a short beep using the Web Audio API — no audio file needed.
// Generates a continuous alarm tone (~2.5s) using the Web Audio API — no audio file needed.
const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 2.5; // seconds

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;

    // Gentle pulse (rises/dips in volume every ~0.4s) so a sustained tone still reads as an "alarm"
    // rather than a flat continuous drone.
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    for (let t = 0; t < duration; t += 0.4) {
      gain.gain.exponentialRampToValueAtTime(0.3, now + t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.08, now + t + 0.32);
    }
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
    oscillator.onended = () => ctx.close();
  } catch {
    // Web Audio unsupported/blocked (e.g. before user interaction) — fail silently, visual alert still shows
  }
};

const totalDurationMinutes = (booking) =>
  (booking.services || []).reduce((sum, s) => sum + (s.durationId?.durationMinutes || 0), 0);

const formatClock = (totalSeconds) => {
  const negative = totalSeconds < 0;
  const abs = Math.abs(totalSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = Math.floor(abs % 60);
  const pad = (n) => String(n).padStart(2, "0");
  const clock = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  return negative ? `-${clock}` : clock;
};

const LiveSessions = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [dismissed, setDismissed] = useState(() => new Set()); // bookingIds where the sound is silenced
  const lastBeepRef = useRef({}); // bookingId -> timestamp of last beep, for the 30s repeat

  const load = useCallback(() => {
    getAdminBookings({ status: "in-service" })
      .then((data) => setBookings(data.filter((b) => b.checkInTime)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, 20000); // refresh room/status data every 20s
    return () => clearInterval(poll);
  }, [load]);

  // 1-second tick for the countdown display, independent of the data poll above
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Repeat the alert sound every 30s for any overdue, non-dismissed session
  useEffect(() => {
    bookings.forEach((b) => {
      const minutes = totalDurationMinutes(b);
      if (!minutes || !b.checkInTime) return;
      const endTime = new Date(b.checkInTime).getTime() + minutes * 60000;
      const overdue = now >= endTime;
      if (!overdue || dismissed.has(b._id)) return;

      const last = lastBeepRef.current[b._id] || 0;
      if (now - last >= 30000) {
        playBeep();
        lastBeepRef.current[b._id] = now;
      }
    });
  }, [now, bookings, dismissed]);

  const handleDismiss = (bookingId) => {
    setDismissed((prev) => new Set(prev).add(bookingId));
  };

  const handleComplete = async (bookingId) => {
    setActionError("");
    try {
      await updateBookingStatus(bookingId, { bookingStatus: "completed" });
      setBookings((prev) => prev.filter((b) => b._id !== bookingId));
    } catch (err) {
      setActionError(err.message); // e.g. outstanding payment — same rule as Bookings page
    }
  };

  if (loading) return <Loader label="Loading live sessions..." />;
  if (error) return <ErrorMessage message={error} />;

  const sessions = bookings
    .filter((b) => totalDurationMinutes(b) > 0)
    .map((b) => {
      const minutes = totalDurationMinutes(b);
      const endTime = new Date(b.checkInTime).getTime() + minutes * 60000;
      const remainingSeconds = Math.round((endTime - now) / 1000);
      return { booking: b, remainingSeconds, overdue: remainingSeconds <= 0 };
    })
    .sort((a, b) => a.remainingSeconds - b.remainingSeconds);

  return (
    <div className="px-6 py-6 bg-sand-50 min-h-screen font-sans">
      <h1 className="font-display font-semibold text-2xl text-ink-900 mb-1">Live Sessions</h1>
      <p className="text-sm text-ink-600 mb-6">Rooms currently in service, counting down from check-in.</p>
      <ErrorMessage message={actionError} />

      {sessions.length === 0 && (
        <p className="text-sm text-ink-600/60">No rooms currently in service.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map(({ booking: b, remainingSeconds, overdue }) => (
          <div
            key={b._id}
            className={`rounded-2xl border p-5 transition-colors ${
              overdue ? "bg-red-50 border-red-300" : "bg-white border-sand-200"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-display font-semibold text-lg text-ink-900">
                {b.roomId?.name || "No room"}
              </span>
              {overdue && (
                <span className="text-[11px] font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                  TIME UP
                </span>
              )}
            </div>
            <p className="text-xs text-ink-600 mb-3">
              {b.bookingNumber} · {b.customerId?.name}
            </p>

            <div
              className={`text-4xl font-display font-semibold text-center py-3 mb-3 rounded-xl ${
                overdue ? "text-red-600 bg-red-100" : "text-espresso-950 bg-sand-50"
              }`}
            >
              {formatClock(remainingSeconds)}
            </div>

            <p className="text-xs text-ink-600/60 mb-3">
              {b.services?.map((s) => s.serviceId?.name).filter(Boolean).join(" + ") || "Service"}
              {" · "}
              {totalDurationMinutes(b)} min total
            </p>

            <div className="flex gap-2">
              {overdue && !dismissed.has(b._id) && (
                <button
                  onClick={() => handleDismiss(b._id)}
                  className="flex-1 text-xs border border-red-300 text-red-600 font-medium px-2.5 py-1.5 rounded-md hover:bg-red-100"
                >
                  Dismiss sound
                </button>
              )}
              <button
                onClick={() => handleComplete(b._id)}
                className="flex-1 text-xs bg-espresso-950 text-gold-300 font-medium px-2.5 py-1.5 rounded-md hover:bg-espresso-800"
              >
                Mark Completed
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveSessions;