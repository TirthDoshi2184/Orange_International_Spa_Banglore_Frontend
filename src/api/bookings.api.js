import api from "./axios";

export const calculateCart = (payload) =>
  api.post("/bookings/calculate", payload).then((res) => res.data.data);

export const createBooking = (payload) =>
  api.post("/bookings", payload).then((res) => res.data.data);

export const confirmPayment = (id, payload = {}) =>
  api.post(`/bookings/${id}/confirm-payment`, payload).then((res) => res.data.data);

export const getBookingById = (id) =>
  api.get(`/bookings/${id}`).then((res) => res.data.data);

// New — for QR add-on flow
export const findBookingByRoom = (roomId) =>
  api.get(`/bookings/by-room/${roomId}`).then((res) => res.data.data);

export const addItemsToBooking = (id, payload) =>
  api.post(`/bookings/${id}/add-items`, payload).then((res) => res.data.data);

export const createRazorpayOrder = (bookingId, amount) =>
  api.post(`/bookings/${bookingId}/razorpay-order`, { amount }).then((res) => res.data.data);

export const verifyRazorpayPayment = (bookingId, payload) =>
  api.post(`/bookings/${bookingId}/verify-payment`, payload).then((res) => res.data.data);

export const createAddonOrder = (bookingId, payload) =>
  api.post(`/bookings/${bookingId}/addon-order`, payload).then((res) => res.data.data);

export const confirmAddonPayment = (bookingId, payload) =>
  api.post(`/bookings/${bookingId}/addon-confirm`, payload).then((res) => res.data.data);

// ADD:
export const confirmPaymentWithMembership = (id, payload) =>
  api.post(`/bookings/${id}/confirm-payment`, payload).then((res) => res.data.data);

export const getRoomMembership = (roomId) =>
  api.get(`/bookings/room/${roomId}/membership`).then((res) => res.data.data);

export const confirmAddonWithMembership = (bookingId, payload) =>
  api.post(`/bookings/${bookingId}/addon-confirm-membership`, payload).then((res) => res.data.data);

