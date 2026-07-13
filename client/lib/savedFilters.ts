import type { ContractFieldFilterSelection } from "@/lib/contractFilterTypes";

export type SavedManualFilter = {
  apiName: string;
  operator: string;
  value: string;
  value2?: string;
  displayLabel?: string;
};

export type SavedFilterPreset = {
  id: string;
  name: string;
  createdAt: number;
  customViewId: string | null;
  /** Checkbox / picklist selections (apiName → values). */
  checkboxSelections: ContractFieldFilterSelection[];
  /** Free-text / lookup / date drafts. */
  manualFilters: SavedManualFilter[];
};

const STORAGE_PREFIX = "crm-saved-filters-v1:";

export function savedFiltersStorageKey(module: string) {
  return `${STORAGE_PREFIX}${module || "Contracts"}`;
}

function isSavedFilterPreset(value: unknown): value is SavedFilterPreset {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    typeof row.createdAt === "number" &&
    Array.isArray(row.checkboxSelections) &&
    Array.isArray(row.manualFilters)
  );
}

export function loadSavedFilters(module: string): SavedFilterPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(savedFiltersStorageKey(module));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedFilterPreset).sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export function persistSavedFilters(module: string, presets: SavedFilterPreset[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(savedFiltersStorageKey(module), JSON.stringify(presets));
}

export function createSavedFilterId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
