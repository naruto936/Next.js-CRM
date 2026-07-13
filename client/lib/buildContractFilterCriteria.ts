import { buildAndCriteria } from "@/lib/zohoSearchCriteria";
import { encodeZohoFiltersParam } from "@/lib/zohoListQuery";
import type { ContractFieldFilterSelection } from "@/lib/contractFilterTypes";

/** Map UI / search operators → Zoho `filters` JSON comparators. */
const FILTERS_COMPARATOR: Record<string, string> = {
  equals: "equal",
  equal: "equal",
  not_equal: "not_equal",
  starts_with: "starts_with",
  contains: "contains",
  in: "in",
  between: "between",
  greater_than: "greater_than",
  greater_equal: "greater_equal",
  less_than: "less_than",
  less_equal: "less_equal",
};

export function buildCriteriaFromFieldFilters(
  selections: ContractFieldFilterSelection[],
): string | null {
  const clauses = selections
    .filter((s) => s.values.length > 0)
    .map((s) => {
      const operator =
        s.operator ||
        (s.values.length > 1 ? "in" : "equals");
      return { apiName: s.apiName, operator, values: s.values };
    });

  return buildAndCriteria(clauses);
}

/**
 * Build Zoho Get Records `filters` JSON (supports `contains`, unlike Search API).
 */
export function buildFiltersObjectFromFieldFilters(
  selections: ContractFieldFilterSelection[],
): { group_operator: "and"; group: unknown[] } | null {
  const group: unknown[] = [];

  for (const selection of selections) {
    const values = selection.values.map((v) => String(v).trim()).filter(Boolean);
    if (!selection.apiName || values.length === 0) continue;

    const operator =
      selection.operator ||
      (values.length > 1 ? "in" : "equals");
    const comparator = FILTERS_COMPARATOR[operator] ?? operator;

    const value =
      operator === "in" || operator === "between" || comparator === "in" || comparator === "between" ?
        values
      : values[0];

    group.push({
      field: { api_name: selection.apiName },
      comparator,
      value,
    });
  }

  if (group.length === 0) return null;
  return { group_operator: "and", group };
}

/**
 * Prefer Zoho `filters` encoding so operators like `contains` work.
 * Falls back to classic search criteria only if filters cannot be built.
 */
export function buildSearchParamFromFieldFilters(
  selections: ContractFieldFilterSelection[],
): string | null {
  const filtersObj = buildFiltersObjectFromFieldFilters(selections);
  if (filtersObj) return encodeZohoFiltersParam(filtersObj);
  return buildCriteriaFromFieldFilters(selections);
}

/** @param {Map<string, Set<string>>} selectedByField */
export function selectionsFromCheckboxState(
  selectedByField: Map<string, Set<string>>,
): ContractFieldFilterSelection[] {
  const result: ContractFieldFilterSelection[] = [];
  for (const [apiName, valueSet] of selectedByField) {
    const values = [...valueSet];
    if (values.length === 0) continue;
    result.push({
      apiName,
      operator: values.length > 1 ? "in" : "equals",
      values,
    });
  }
  return result;
}
