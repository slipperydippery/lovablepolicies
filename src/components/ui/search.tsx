import * as React from "react";
import { cn } from "@/lib/utils";

/** Highlights matching portions of text */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-warning/30 text-foreground rounded-sm px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export interface SearchItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  onSelect?: () => void;
}

export interface SearchGroup {
  id: string;
  label: string;
  items: SearchItem[];
}

export interface SearchProps {
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Groups of searchable items */
  groups?: SearchGroup[];
  /** Called when an item is selected */
  onItemSelect?: (item: SearchItem) => void;
  /** Called when search term changes */
  onSearchChange?: (term: string) => void;
  /** Whether the search is disabled */
  disabled?: boolean;
  /** Whether to show the loading spinner */
  loading?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Additional class names */
  className?: string;
}

function Search({
  placeholder = "Search...",
  groups = [],
  onItemSelect,
  onSearchChange,
  disabled,
  loading,
  emptyMessage = "No results found.",
  className,
}: SearchProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [recentSearches, setRecentSearches] = React.useState<SearchItem[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Filter items based on search term
  const filteredGroups = React.useMemo(() => {
    if (!searchTerm.trim()) return groups;
    const lower = searchTerm.toLowerCase();
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(lower) ||
            item.description?.toLowerCase().includes(lower)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, searchTerm]);

  // Build flat list for keyboard navigation
  const flatItems = React.useMemo(() => {
    const showRecent = !searchTerm.trim() && recentSearches.length > 0;
    const fromGroups = filteredGroups.flatMap((g) => g.items);
    return showRecent ? [...recentSearches, ...fromGroups] : fromGroups;
  }, [filteredGroups, recentSearches, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setActiveIndex(-1);
    onSearchChange?.(val);
    if (!open) setOpen(true);
  };

  const handleSelect = (item: SearchItem) => {
    // Add to recent searches (dedup, max 5)
    setRecentSearches((prev) => {
      const filtered = prev.filter((r) => r.id !== item.id);
      return [item, ...filtered].slice(0, 5);
    });
    onItemSelect?.(item);
    item.onSelect?.();
    setSearchTerm("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < flatItems.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : flatItems.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < flatItems.length) {
          handleSelect(flatItems[activeIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  // Scroll active item into view
  React.useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.querySelector(
        `[data-index="${activeIndex}"]`
      );
      activeEl?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  // Close on click outside
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showRecent = !searchTerm.trim() && recentSearches.length > 0;
  const hasResults = filteredGroups.some((g) => g.items.length > 0);
  const showDropdown = open && (showRecent || hasResults || searchTerm.trim());

  // Track flat index for keyboard nav
  let flatIndex = 0;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Search Input */}
      <div className="relative w-full">
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground pointer-events-none h-4 w-4">
          {loading ? (
            <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
          ) : (
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex w-full h-9 px-2 pl-8 rounded text-sm text-foreground transition-colors",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none",
            "disabled:cursor-not-allowed",
            !disabled && [
              "border border-grey-300 bg-white shadow-input",
              "dark:border-grey-600 dark:bg-grey-800",
              "hover:border-grey-400 hover:shadow-none",
              "focus:border-primary focus:shadow-input-focus",
            ],
            disabled && [
              "border border-grey-200 bg-grey-100 shadow-input",
              "dark:border-grey-600 dark:bg-grey-700",
            ]
          )}
          role="combobox"
          aria-expanded={showDropdown ? true : undefined}
          aria-autocomplete="list"
          aria-controls="search-listbox"
        />
        {searchTerm && !disabled && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              onSearchChange?.("");
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground hover:text-foreground h-4 w-4"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          id="search-listbox"
          ref={listRef}
          role="listbox"
          className={cn(
            "absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded border border-grey-300 bg-popover text-popover-foreground shadow-md",
            "dark:border-grey-600"
          )}
        >
          {/* Recent Searches */}
          {showRecent && (
            <div className="py-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Recent
              </div>
              {recentSearches.map((item) => {
                const idx = flatIndex++;
                return (
                  <div
                    key={`recent-${item.id}`}
                    data-index={idx}
                    role="option"
                    aria-selected={activeIndex === idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded mx-1",
                      activeIndex === idx
                        ? "bg-state-hover"
                        : "hover:bg-state-hover"
                    )}
                  >
                    <i
                      className="fa-solid fa-clock-rotate-left w-4 text-center text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Grouped Results */}
          {filteredGroups.map((group) => (
            <div key={group.id} className="py-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {group.label}
              </div>
              {group.items.map((item) => {
                const idx = flatIndex++;
                return (
                  <div
                    key={item.id}
                    data-index={idx}
                    role="option"
                    aria-selected={activeIndex === idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded mx-1",
                      activeIndex === idx
                        ? "bg-state-hover"
                        : "hover:bg-state-hover"
                    )}
                  >
                    {item.icon && (
                      <i
                        className={cn(item.icon, "w-4 text-center text-muted-foreground")}
                        aria-hidden="true"
                      />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">
                        <HighlightText text={item.label} query={searchTerm} />
                      </span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground truncate">
                          <HighlightText text={item.description} query={searchTerm} />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Empty State */}
          {!hasResults && searchTerm.trim() && !showRecent && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { Search };
