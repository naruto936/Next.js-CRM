import { fetchZohoJson, getZohoModuleLayoutsUrl } from "@/lib/zoho";
import {
  buildFallbackRecordSections,
  parseZohoLayout,
} from "@/lib/contractRecordLayout";

/**
 * @param {import("@/lib/contractColumns").CrmFieldMeta[]} catalog
 * @returns {Promise<{ sections: import("@/lib/contractRecordLayout").CrmRecordSection[], droppedSectionFieldApiNames: string[], source: "zoho" | "fallback" }>}
 */
export async function loadContractsRecordSections(catalog) {
  const url = getZohoModuleLayoutsUrl("Contracts");

  try {
    const { res, body } = await fetchZohoJson(url);
    if (res.ok) {
      const parsed = parseZohoLayout(body);
      if (parsed && (parsed.sections.length > 0 || parsed.droppedSectionFieldApiNames.length > 0)) {
        return {
          sections: parsed.sections,
          droppedSectionFieldApiNames: parsed.droppedSectionFieldApiNames,
          source: /** @type {const} */ ("zoho"),
        };
      }
    }
  } catch (err) {
    console.error("Zoho layouts request failed:", err);
  }

  return {
    sections: buildFallbackRecordSections(catalog),
    droppedSectionFieldApiNames: [],
    source: /** @type {const} */ ("fallback"),
  };
}
