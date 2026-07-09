import { loadModuleFilterMeta } from "@/lib/contractFilterMeta";
import { ZOHO_SOW_MODULE } from "@/lib/sowConfig";
import { getZohoModuleFieldsUrl } from "@/lib/zoho";

export async function GET() {
  try {
    const { sections, fields, source } = await loadModuleFilterMeta(ZOHO_SOW_MODULE);

    return Response.json({
      sections,
      fields,
      source,
      zohoUrl: getZohoModuleFieldsUrl(ZOHO_SOW_MODULE),
      filterableCount: fields.length,
      sectionCount: sections.length,
    });
  } catch (err) {
    console.error("SOW filters metadata failed:", err);
    const message = err instanceof Error ? err.message : "Failed to load filter metadata";
    return Response.json(
      { error: message, sections: [], fields: [], source: "fallback" },
      { status: 502 },
    );
  }
}
