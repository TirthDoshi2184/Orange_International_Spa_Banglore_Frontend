import { groupByCategory, MENU_CATEGORY_LABELS_KN } from "../../utils/menuCategories";

const MenuCategoryAccordion = ({ items, renderItem, defaultOpenFirst = true, gridClassName = "grid grid-cols-1 sm:grid-cols-2 gap-3", language = "en" }) => {
  const groups = groupByCategory(items);

  if (groups.length === 0) {
    return <p className="text-sm text-gray-400">No menu items available right now.</p>;
  }

  return (
    <div className="space-y-2">
      {groups.map((group, i) => (
        <details
          key={group.category}
          open={defaultOpenFirst && i === 0}
          className="border border-parchment-200 rounded-xl overflow-hidden bg-white [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="cursor-pointer select-none px-4 py-3 bg-parchment-50 text-sm font-semibold text-ink-900 font-sans flex items-center justify-between">
            <span>{language === "kn" ? MENU_CATEGORY_LABELS_KN[group.category] || group.category : group.category}</span>
            <span className="text-xs text-gold-600 font-medium">{group.items.length} items</span>
          </summary>
          <div className={`p-3 ${gridClassName}`}>
            {group.items.map((item) => renderItem(item))}
          </div>
        </details>
      ))}
    </div>
  );
};

export default MenuCategoryAccordion;