import api from "./axios";

export const getMembershipPackages = (all = false) =>
  api.get("/admin/membership-packages", { params: all ? { all: true } : {} }).then((res) => res.data.data);

export const createMembershipPackage = (payload) =>
  api.post("/admin/membership-packages", payload).then((res) => res.data.data);

export const updateMembershipPackage = (id, payload) =>
  api.put(`/admin/membership-packages/${id}`, payload).then((res) => res.data.data);

export const createMembership = (payload) =>
  api.post("/admin/memberships", payload).then((res) => res.data.data);

export const searchMemberships = (params) =>
  api.get("/admin/memberships/search", { params }).then((res) => res.data.data);

export const getMembershipDetail = (id) =>
  api.get(`/admin/memberships/${id}`).then((res) => res.data.data);

export const rechargeMembership = (id, payload) =>
  api.post(`/admin/memberships/${id}/recharge`, payload).then((res) => res.data.data);

export const collectDue = (id, payload) =>
  api.post(`/admin/memberships/${id}/collect-due`, payload).then((res) => res.data.data);

export const adjustMembership = (id, payload) =>
  api.post(`/admin/memberships/${id}/adjust`, payload).then((res) => res.data.data);

export const getMembershipByCustomer = (customerId) =>
  api.get(`/admin/customers/${customerId}/membership`).then((res) => res.data.data);

export const payAddonWithMembership = (bookingId, payload) =>
  api.post(`/admin/bookings/${bookingId}/addon-membership-payment`, payload).then((res) => res.data.data);