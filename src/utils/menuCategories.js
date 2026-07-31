// Kept in sync with MENU_CATEGORIES in server/src/models/Mocktail.js — update both together.
// "Mocktail" internally still refers to the full F&B menu item collection (not just drinks).
export const MENU_CATEGORIES = [
  "Fresh Juice",
  "Boba Mojitos",
  "Crushed Ice Lemonade",
  "Thick Shakes",
  "Elite Special Juices",
  "Fries",
  "Burger",
  "Sandwich",
  "Gym Freaks",
  "Lassi",
  "Falooda",
  "Kulfi",
  "Ice Cream Sundaes",
  "Nutella & Hazelnut",
  "Chocolate Based Shakes",
  "Cold Coffee",
];

// Groups a flat array of menu items ({ category, ... }) into
// [{ category, items: [...] }, ...] ordered by MENU_CATEGORIES.
// Categories with zero items are skipped so empty tabs never show.
export const groupByCategory = (items = []) => {
  return MENU_CATEGORIES
    .map((category) => ({
      category,
      items: items.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0);
};
