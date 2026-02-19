import Filter from "./Filter"

interface FilterTag {
  title: string
  category: string
  items: string[]
}

interface SearchSideBarProps {
  filter: FilterTag[]
  onFilterChange: (filterType: string, selectedItems: string[]) => void
}

function SearchSideBar({ filter, onFilterChange }: SearchSideBarProps) {
  return (
    <>
      {/* Side Bar */}
      <aside className="w-82 bg-[#F5F5F5] min-h-screen sticky shadow-[4px_0_4px_rgba(0,0,0,0.25)]">
        <div>
          {/* Filter Tag */}
          {filter.map((tag) => (
            <Filter key={tag.title} title={tag.title} category={tag.category} items={tag.items} onFilterChange={onFilterChange} />
          ))}
        </div>
      </aside>
    </>
  )
}

export default SearchSideBar