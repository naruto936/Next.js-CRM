import { loadContractsFilterMeta } from "@/lib/contractFilterMeta";
import { getContractsOfflineFilterMeta } from "@/lib/contractStaticData";
import { getZohoModuleFieldsUrl } from "@/lib/zoho";

export async function GET() {
  try {
    const { sections, fields, source } = await loadContractsFilterMeta();

    return Response.json({
      sections,
      fields,
      source,
      zohoUrl: getZohoModuleFieldsUrl("Contracts"),
      filterableCount: fields.length,
      sectionCount: sections.length,
      offlineDemo: source === "offline-demo",
    });
  } catch (err) {
    console.error("Contract filters metadata failed:", err);
    const message = err instanceof Error ? err.message : "Failed to load filter metadata";
    const offline = getContractsOfflineFilterMeta();
    return Response.json({
      error: message,
      sections: offline.sections,
      fields: offline.fields,
      source: offline.source,
      offlineDemo: true,
    });
  }
}
