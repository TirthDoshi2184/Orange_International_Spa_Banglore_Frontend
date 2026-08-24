import api from "./axios";

export const getDashboardStats = () =>
  api.get("/admin/dashboard/stats").then((res) => res.data.data);

export const getAdminBookings = (params = {}) =>
  api.get("/admin/bookings", { params }).then((res) => res.data.data);

export const updateBookingStatus = (id, payload) =>
  api.patch(`/admin/bookings/${id}/status`, payload).then((res) => res.data.data);

// Services
export const getAdminServices = () => api.get("/admin/services").then((res) => res.data.data);
export const createService = (payload) => api.post("/admin/services", payload).then((res) => res.data.data);
export const updateService = (id, payload) => api.put(`/admin/services/${id}`, payload).then((res) => res.data.data);
export const deleteService = (id) => api.delete(`/admin/services/${id}`).then((res) => res.data);
export const addServiceDuration = (serviceId, payload) =>
  api.post(`/admin/services/${serviceId}/durations`, payload).then((res) => res.data.data);
export const updateServiceDuration = (durationId, payload) =>
  api.put(`/admin/services/durations/${durationId}`, payload).then((res) => res.data.data);
export const deleteServiceDuration = (durationId) =>
  api.delete(`/admin/services/durations/${durationId}`).then((res) => res.data);

// Mocktails
export const getAdminMocktails = () => api.get("/admin/mocktails").then((res) => res.data.data);
export const createMocktail = (payload) => api.post("/admin/mocktails", payload).then((res) => res.data.data);
export const updateMocktail = (id, payload) => api.put(`/admin/mocktails/${id}`, payload).then((res) => res.data.data);
export const deleteMocktail = (id) => api.delete(`/admin/mocktails/${id}`).then((res) => res.data);

// Time Slots
export const getAdminTimeSlots = () => api.get("/admin/timeslots").then((res) => res.data.data);
export const createTimeSlot = (payload) => api.post("/admin/timeslots", payload).then((res) => res.data.data);
export const updateTimeSlot = (id, payload) => api.put(`/admin/timeslots/${id}`, payload).then((res) => res.data.data);

// Rooms
export const getRooms = () => api.get("/admin/rooms").then((res) => res.data.data);
export const createRoom = (payload) => api.post("/admin/rooms", payload).then((res) => res.data.data);
export const updateRoom = (id, payload) => api.put(`/admin/rooms/${id}`, payload).then((res) => res.data.data);
export const deleteRoom = (id) => api.delete(`/admin/rooms/${id}`).then((res) => res.data);
export const getRoomAvailability = () =>
  api.get("/admin/rooms/availability").then((res) => res.data.data);

export const reassignRoom = (bookingId, roomId) =>
  api.patch(`/admin/bookings/${bookingId}/reassign-room`, { roomId }).then((res) => res.data.data);

// Customers
export const getAllCustomers = (search) =>
  api.get("/admin/customers", { params: search ? { search } : {} }).then((res) => res.data.data);

export const getCustomerProfile = (id) =>
  api.get(`/admin/customers/${id}`).then((res) => res.data.data);

// Coupons
export const getAllCoupons = () => api.get("/admin/coupons").then((res) => res.data.data);
export const createCoupon = (payload) => api.post("/admin/coupons", payload).then((res) => res.data.data);

// Reports
export const getRevenueTrend = (days = 7) =>
  api.get("/admin/reports/revenue-trend", { params: { days } }).then((res) => res.data.data);

export const getPopularServicesReport = (days = 30) =>
  api.get("/admin/reports/popular-services", { params: { days } }).then((res) => res.data.data);

export const getPeakHoursReport = (days = 30) =>
  api.get("/admin/reports/peak-hours", { params: { days } }).then((res) => res.data.data);

// Add-on Orders
export const getAddonOrders = (status) =>
  api.get("/admin/addon-orders", { params: status ? { status } : {} }).then((res) => res.data.data);

export const updateAddonOrderStatus = (id, status) =>
  api.patch(`/admin/addon-orders/${id}/status`, { status }).then((res) => res.data.data);

export const triggerDayEndCleanup = () =>
  api.post("/admin/day-end-cleanup").then((res) => res.data.data);

export const getMembershipReport = () =>
  api.get("/admin/reports/membership-overview").then((res) => res.data.data);