import api from "./axios";

export const loginAdmin = (credentials) =>
  api.post("/auth/admin/login", credentials).then((res) => res.data.data);