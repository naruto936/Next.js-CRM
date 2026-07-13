/**
 * Field filters that need `contains` (and related) use Zoho's `filters` JSON param,
 * which is encoded into the existing `criteria` query string with this prefix so
 * pages/tables do not need a separate state field.
 */
export const ZOHO_FILTERS_PREFIX = "__zoho_filters__:";

/** @param {unknown} filtersObj */
export function encodeZohoFiltersParam(filtersObj) {
  return `${ZOHO_FILTERS_PREFIX}${JSON.stringify(filtersObj)}`;
}

/**
 * @param {string | null | undefined} raw
 * @returns {{ criteria: string | null; filters: string | null }}
 */
export function parseListSearchParam(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return { criteria: null, filters: null };
  if (value.startsWith(ZOHO_FILTERS_PREFIX)) {
    const filters = value.slice(ZOHO_FILTERS_PREFIX.length).trim();
    return { criteria: null, filters: filters || null };
  }
  return { criteria: value, filters: null };
}

/**
 * Build list + count URLs for a Zoho module.
 * @param {{
 *   module: string;
 *   base?: string;
 *   fields: string;
 *   page: number;
 *   perPage: number;
 *   criteria?: string | null;
 *   filters?: string | null;
 *   cvid?: string | null;
 * }} opts
 */
export function buildZohoModuleListUrls({
  module,
  base = "https://www.zohoapis.com/crm/v3",
  fields,
  page,
  perPage,
  criteria = null,
  filters = null,
  cvid = null,
}) {
  const encodedModule = encodeURIComponent(module);
  const fieldsQ = encodeURIComponent(fields);

  if (cvid) {
    return {
      listUrl: `${base}/${encodedModule}?cvid=${encodeURIComponent(cvid)}&fields=${fieldsQ}&per_page=${perPage}&page=${page}`,
      countUrl: `${base}/${encodedModule}/actions/count?cvid=${encodeURIComponent(cvid)}`,
    };
  }

  if (filters) {
    const filtersQ = encodeURIComponent(filters);
    return {
      listUrl: `${base}/${encodedModule}?fields=${fieldsQ}&per_page=${perPage}&page=${page}&filters=${filtersQ}`,
      countUrl: `${base}/${encodedModule}/actions/count?filters=${filtersQ}`,
    };
  }

  if (criteria) {
    const params = new URLSearchParams();
    params.set("criteria", criteria);
    params.set("fields", fields);
    params.set("page", String(page));
    params.set("per_page", String(perPage));
    return {
      listUrl: `${base}/${encodedModule}/search?${params.toString()}`,
      countUrl: `${base}/${encodedModule}/actions/count?criteria=${encodeURIComponent(criteria)}`,
    };
  }

  return {
    listUrl: `${base}/${encodedModule}?fields=${fieldsQ}&per_page=${perPage}&page=${page}`,
    countUrl: `${base}/${encodedModule}/actions/count`,
  };
}
