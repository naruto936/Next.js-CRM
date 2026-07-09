import { getStaticSowDetail, isStaticSowId } from "@/lib/sowStaticDetail";
import { fetchZohoRecordById } from "@/lib/fetchZohoModuleRecord";
import { allSowDetailApiNames, ZOHO_SOW_MODULE } from "@/lib/sowConfig";
import { formatFieldValue, mapZohoRecord } from "@/lib/zohoContractMap";

function mapScopeOfWork(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((row, index) => {
    const service = row?.OurServices;
    const name =
      service && typeof service === "object" && service.name != null ?
        String(service.name)
      : formatFieldValue(row?.OurServices);
    return {
      id: row?.id != null ? String(row.id) : `sow-line-${index}`,
      serviceName: name || "—",
      category: formatFieldValue(row?.Category),
      startDate: formatFieldValue(row?.Start_Date),
      endDate: formatFieldValue(row?.End_Date),
      invoicePrice: formatFieldValue(row?.Invoice_Price),
      vendorPrice: formatFieldValue(row?.Vendor_Price),
      vendorTargetPrice: formatFieldValue(row?.Vendor_Target_Price),
    };
  });
}

export async function GET(_request, context) {
  const { id } = await context.params;
  if (!id || !String(id).trim()) {
    return Response.json({ error: "Missing record id" }, { status: 400 });
  }

  const recordId = String(id).trim();

  if (isStaticSowId(recordId)) {
    const staticDetail = getStaticSowDetail(recordId);
    if (!staticDetail) {
      return Response.json({ error: "SOW not found" }, { status: 404 });
    }
    return Response.json(staticDetail);
  }

  const apiNames = allSowDetailApiNames();

  let row;
  try {
    row = await fetchZohoRecordById(ZOHO_SOW_MODULE, recordId, apiNames);
  } catch (err) {
    const status = err.status ?? 502;
    if (status === 404) {
      return Response.json({ error: "SOW not found" }, { status: 404 });
    }
    console.error("Zoho CRM SOW record request failed:", err);
    const message = err instanceof Error ? err.message : "Failed to reach Zoho CRM";
    return Response.json(
      { error: message, status: err.status, details: err.details },
      { status: status >= 400 && status < 600 ? status : 502 },
    );
  }

  const mapped = mapZohoRecord(row, apiNames);
  const scopeOfWork = mapScopeOfWork(row.Scope_of_Work);

  return Response.json({
    record: mapped,
    scopeOfWork,
    layoutLabel:
      row.Layout && typeof row.Layout === "object" && row.Layout.display_label ?
        String(row.Layout.display_label)
      : row.Layout?.name ?
        String(row.Layout.name)
      : "",
    zohoRecordId: row.id != null ? String(row.id) : "",
  });
}
