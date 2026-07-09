import { loadModuleFilterMeta } from "@/lib/contractFilterMeta";
import { ZOHO_VENDOR_INVOICE_MODULE } from "@/lib/vendorInvoiceConfig";
import { getZohoModuleFieldsUrl } from "@/lib/zoho";

export async function GET() {
  try {
    const { sections, fields, source } = await loadModuleFilterMeta(ZOHO_VENDOR_INVOICE_MODULE);

    return Response.json({
      sections,
      fields,
      source,
      zohoUrl: getZohoModuleFieldsUrl(ZOHO_VENDOR_INVOICE_MODULE),
      filterableCount: fields.length,
      sectionCount: sections.length,
    });
  } catch (err) {
    console.error("Vendor invoice filters metadata failed:", err);
    const message = err instanceof Error ? err.message : "Failed to load filter metadata";
    return Response.json(
      { error: message, sections: [], fields: [], source: "fallback" },
      { status: 502 },
    );
  }
}
