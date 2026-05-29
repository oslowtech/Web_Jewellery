import { Search } from "lucide-react";

const SearchBar = ({ query, onChange, suggestions, onSelect, placeholder }) => {
  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-full border border-onyx/10 bg-white/80 px-4 py-2">
        <Search size={16} className="text-stone" />
        <input
          type="text"
          value={query}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder || "Search jewellery"}
          aria-label="Search jewellery"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
      {suggestions.length > 0 ? (
        <div className="absolute left-0 right-0 z-20 mt-2 max-h-56 overflow-y-auto rounded-2xl border border-onyx/10 bg-white/95 p-2 shadow-soft">
          {suggestions.map((item) => (
            <button
              key={item.id}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-blush/60"
              onClick={() => onSelect(item)}
            >
              <img
                src={item.images[0]}
                alt={item.name}
                className="h-10 w-10 rounded-lg object-cover"
                loading="lazy"
              />
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-stone">ID: {item.id}</p>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default SearchBar;
