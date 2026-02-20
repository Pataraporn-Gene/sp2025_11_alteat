import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import Filter from "./Filter";

interface FilterTag {
  title: string;
  category: string;
  items: string[];
}

interface SearchSideBarProps {
  filter: FilterTag[];
  onFilterChange: (filterType: string, selectedItems: string[]) => void;
}

function SearchSideBar({ filter, onFilterChange }: SearchSideBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile floating filter button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-50 md:hidden bg-[#562C0C] text-white p-3 rounded-full shadow-lg"
        aria-label="Open filters"
      >
        <SlidersHorizontal className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 w-72 bg-[#F5F5F5] shadow-[4px_0_4px_rgba(0,0,0,0.25)] overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:sticky md:translate-x-0 md:w-82 md:min-h-screen md:z-auto
      `}>
        {/* Mobile close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close filters"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          {filter.map((tag) => (
            <Filter
              key={tag.title}
              title={tag.title}
              category={tag.category}
              items={tag.items}
              onFilterChange={onFilterChange}
            />
          ))}
        </div>
      </aside>
    </>
  );
}

export default SearchSideBar;