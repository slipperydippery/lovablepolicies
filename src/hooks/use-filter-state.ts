import { useState, useMemo, useCallback } from "react";
import type { FilterItemDef } from "@/components/ui/filter-panel";

function isValueActive(value: any): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    return Object.values(value).some((v) => isValueActive(v));
  }
  return true;
}

export interface ValueChip {
  filterKey: string;
  valueKey: string;
  displayLabel: string;
}

export interface UseFilterStateOptions {
  defaultFilters: FilterItemDef[];
  defaultValues?: Record<string, any>;
  /** Map of filterKey -> { value: label } for resolving display labels (e.g. dropdowns) */
  valueLabelMap?: Record<string, Record<string, string>>;
}

export function useFilterState({ defaultFilters, defaultValues = {}, valueLabelMap = {} }: UseFilterStateOptions) {
  const [filters, setFilters] = useState<FilterItemDef[]>([...defaultFilters]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({ ...defaultValues });

  const setFilterValue = useCallback((key: string, value: any) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilterValue = useCallback((key: string) => {
    setFilterValues((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearAllValues = useCallback(() => {
    setFilterValues({});
  }, []);

  const resetToDefault = useCallback(() => {
    setFilters([...defaultFilters]);
    setFilterValues({ ...defaultValues });
  }, [defaultFilters, defaultValues]);

  const activeFilters = useMemo(
    () => filters.filter((f) => f.visible !== false && isValueActive(filterValues[f.key])),
    [filters, filterValues]
  );

  /** Flattened list of individual value chips for display */
  const activeValueChips = useMemo<ValueChip[]>(() => {
    const chips: ValueChip[] = [];
    for (const filter of filters) {
      if (filter.visible === false) continue;
      const val = filterValues[filter.key];
      if (!isValueActive(val)) continue;

      if (Array.isArray(val)) {
        // Multiselect: one chip per item
        for (const item of val) {
          const label = valueLabelMap[filter.key]?.[item] ?? String(item);
          chips.push({ filterKey: filter.key, valueKey: String(item), displayLabel: label });
        }
      } else if (typeof val === "object" && val !== null) {
        // Range object: single chip "from - to"
        const from = val.from ?? "";
        const to = val.to ?? "";
        if (from || to) {
          const label = from && to ? `${from} - ${to}` : from ? `≥ ${from}` : `≤ ${to}`;
          chips.push({ filterKey: filter.key, valueKey: "__range__", displayLabel: label });
        }
      } else {
        // String/number: single chip
        const label = valueLabelMap[filter.key]?.[String(val)] ?? String(val);
        chips.push({ filterKey: filter.key, valueKey: String(val), displayLabel: label });
      }
    }
    return chips;
  }, [filters, filterValues, valueLabelMap]);

  /** Remove a single chip value from a filter */
  const removeChip = useCallback((filterKey: string, valueKey: string) => {
    setFilterValues((prev) => {
      const val = prev[filterKey];
      if (Array.isArray(val)) {
        const next = val.filter((v: any) => String(v) !== valueKey);
        if (next.length === 0) {
          const copy = { ...prev };
          delete copy[filterKey];
          return copy;
        }
        return { ...prev, [filterKey]: next };
      }
      // For string/range, removing the chip clears the whole value
      const copy = { ...prev };
      delete copy[filterKey];
      return copy;
    });
  }, []);

  return {
    filters,
    setFilters,
    filterValues,
    setFilterValue,
    clearFilterValue,
    clearAllValues,
    resetToDefault,
    activeFilters,
    activeValueChips,
    removeChip,
  };
}
