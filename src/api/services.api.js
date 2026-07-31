import api from "./axios";

export const getServices = () =>
  api.get("/services").then((res) => res.data.data);

export const getServiceById = (id) =>
  api.get(`/services/${id}`).then((res) => res.data.data);

