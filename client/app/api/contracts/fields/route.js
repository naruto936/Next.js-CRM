import {
  FALLBACK_FIELD_CATALOG,
  isExcludedContractCatalogField,
  normalizeContractFieldApiName,
} from "@/lib/contracts/columns";
import {
  buildFallbackRecordSections,
  loadContractsRecordSections,
} from "@/lib/contracts/recordLayout";
import { getZohoModuleFieldsUrl, loadContractsFieldCatalog } from "@/lib/zoho";

function filterClientFields(fields, droppedSectionFieldApiNames) {
  const dropped = new Set(
    (droppedSectionFieldApiNames ?? []).map((name) => normalizeContractFieldApiName(name)),
  );
  return fields.filter(
    (f) =>
      !dropped.has(normalizeContractFieldApiName(f.apiName)) &&
      !isExcludedContractCatalogField(f),
  );
}

function fallbackPayload(warning) {
  const fields = FALLBACK_FIELD_CATALOG.map((f) => ({ ...f, visible: true }));
  return {
    fields,
    sections: buildFallbackRecordSections(fields),
    droppedSectionFieldApiNames: [],
    sectionSource: "fallback",
    source: "fallback",
    warning,
    count: FALLBACK_FIELD_CATALOG.length,
  };
}

export async function GET() {
  const zohoUrl = getZohoModuleFieldsUrl("Contracts");

  try {
    const { fields, source } = await loadContractsFieldCatalog();
    const { sections, droppedSectionFieldApiNames, source: sectionSource } =
      await loadContractsRecordSections(fields);
    const clientFields = filterClientFields(fields, droppedSectionFieldApiNames);

    if (source === "zoho") {
      return Response.json({
        fields: clientFields,
        sections,
        droppedSectionFieldApiNames,
        sectionSource,
        source: "zoho",
        zohoUrl,
        count: clientFields.length,
      });
    }

    return Response.json({
      ...fallbackPayload(
        "Could not load fields from Zoho. Add OAuth scope ZohoCRM.settings.fields.READ (or ZohoCRM.settings.ALL), generate a new token, and update credentials in lib/zoho-oauth.js. Showing a short fallback list.",
      ),
      sections: sections ?? null,
      sectionSource,
      zohoUrl,
    });
  } catch (err) {
    console.error("Zoho fields request failed:", err);
    const message = err instanceof Error ? err.message : "Failed to reach Zoho CRM";
    return Response.json(
      fallbackPayload(
        `Could not reach Zoho (${message}). Showing a short fallback list.`,
      ),
    );
  }
}
