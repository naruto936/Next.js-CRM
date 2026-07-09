import { loadModuleFilterMeta } from "@/lib/contractFilterMeta";
import { getZohoModuleFieldsUrl } from "@/lib/zoho";
import { ZOHO_SERVICE_COMPLETIONS_MODULE } from "@/lib/serviceCompletionConfig";

export async function GET() {
  try {
    const { sections, fields, source } = await loadModuleFilterMeta(ZOHO_SERVICE_COMPLETIONS_MODULE);

    return Response.json({
      sections,
      fields,
      source,
      zohoUrl: getZohoModuleFieldsUrl(ZOHO_SERVICE_COMPLETIONS_MODULE),
      filterableCount: fields.length,
      sectionCount: sections.length,
    });
  } catch (err) {
    console.error("Service completion filters metadata failed:", err);
    const message = err instanceof Error ? err.message : "Failed to load filter metadata";
    return Response.json(
      { error: message, sections: [], fields: [], source: "fallback" },
      { status: 502 },
    );
  }
}
