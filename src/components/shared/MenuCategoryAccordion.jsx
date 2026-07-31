import { groupByCategory } from "../../utils/menuCategories";

// Groups a flat menu-item array into collapsible <details> sections by category.
// Each page passes its own renderItem so the add/select behavior stays page-specific
// (Cart adds directly, AddOnOrder toggles a selection, ReceptionCheckout adds directly).
const MenuCategoryAccordion = ({ items, renderItem, defaultOpenFirst = true, gridClassName = "grid grid-cols-1 sm:grid-cols-2 gap-3" }) => {
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
          className="border border-gray-200 rounded-lg overflow-hidden"
        >
          <summary className="cursor-pointer select-none px-4 py-2.5 bg-gray-50 text-sm font-medium text-gray-800 flex items-center justify-between">
            <span>{group.category}</span>
            <span className="text-xs text-gray-400 font-normal">{group.items.length} items</span>
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
