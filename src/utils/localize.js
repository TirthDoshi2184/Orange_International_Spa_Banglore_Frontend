/**
 * Returns the Kannada version of a field if present and language is 'kn',
 * otherwise falls back to English — so content admin hasn't translated yet
 * doesn't show up blank.
 */
export const localize = (obj, field, language) => {
  if (!obj) return "";
  if (language === "kn" && obj[`${field}_kn`]) return obj[`${field}_kn`];
  return obj[field] || "";
};

export const localizeArray = (obj, field, language) => {
  if (!obj) return [];
  if (language === "kn" && obj[`${field}_kn`]?.length) return obj[`${field}_kn`];
  return obj[field] || [];
};