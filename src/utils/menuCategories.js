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

// Display-only translations for category labels. Grouping/filtering always
// uses the English MENU_CATEGORIES value above — never these.
export const MENU_CATEGORY_LABELS_KN = {
  "Fresh Juice": "ತಾಜಾ ಜ್ಯೂಸ್",
  "Boba Mojitos": "ಬೋಬಾ ಮೊಜಿಟೊ",
  "Crushed Ice Lemonade": "ಕ್ರಶ್ಡ್ ಐಸ್ ಲೆಮನೇಡ್",
  "Thick Shakes": "ಥಿಕ್ ಶೇಕ್",
  "Elite Special Juices": "ಎಲೈಟ್ ಸ್ಪೆಷಲ್ ಜ್ಯೂಸ್",
  "Fries": "ಫ್ರೈಸ್",
  "Burger": "ಬರ್ಗರ್",
  "Sandwich": "ಸ್ಯಾಂಡ್‌ವಿಚ್",
  "Gym Freaks": "ಜಿಮ್ ಫ್ರೀಕ್ಸ್",
  "Lassi": "ಲಸ್ಸಿ",
  "Falooda": "ಫಲೂದಾ",
  "Kulfi": "ಕುಲ್ಫಿ",
  "Ice Cream Sundaes": "ಐಸ್ ಕ್ರೀಂ ಸಂಡೇ",
  "Nutella & Hazelnut": "ನುಟೆಲ್ಲಾ & ಹೇಜಲ್‌ನಟ್",
  "Chocolate Based Shakes": "ಚಾಕಲೇಟ್ ಶೇಕ್",
  "Cold Coffee": "ಕೋಲ್ಡ್ ಕಾಫಿ",
};

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