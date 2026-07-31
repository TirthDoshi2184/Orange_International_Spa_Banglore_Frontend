import api from "./axios";

export const getAvailableSlots = () =>
  api.get("/timeslots/available").then((res) => res.data.data);
