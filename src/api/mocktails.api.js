import api from "./axios";

export const getMocktails = (category) =>
  api.get("/mocktails", { params: category ? { category } : {} }).then((res) => res.data.data);

export const getMenuCategories = () =>
  api.get("/mocktails/categories").then((res) => res.data.data);

