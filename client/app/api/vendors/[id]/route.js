import { getStaticVendorDetail, isStaticVendorId } from "@/lib/vendorStaticDetail";
import { fetchZohoRecordById } from "@/lib/fetchZohoModuleRecord";
import { allVendorDetailApiNames, ZOHO_VENDORS_MODULE } from "@/lib/vendorConfig";
import { mapZohoRecord } from "@/lib/zohoContractMap";

function layoutLabelFromRow(row) {
  const layout = row?.$layout_id ?? row?.Layout;
  if (layout && typeof layout === "object" && layout.display_label) {
    return String(layout.display_label);
  }
  if (layout?.name) return String(layout.name);
  return "";
}

export async function GET(_request, context) {
  const { id } = await context.params;
  if (!id || !String(id).trim()) {
    return Response.json({ error: "Missing record id" }, { status: 400 });
  }

  const recordId = String(id).trim();

  if (isStaticVendorId(recordId)) {
    const staticDetail = getStaticVendorDetail(recordId);
    if (!staticDetail) {
      return Response.json({ error: "Vendor not found" }, { status: 404 });
    }
    return Response.json(staticDetail);
  }

  const apiNames = allVendorDetailApiNames();

  let row;
  try {
    row = await fetchZohoRecordById(ZOHO_VENDORS_MODULE, recordId, apiNames);
  } catch (err) {
    const status = err.status ?? 502;
    if (status === 404) {
      return Response.json({ error: "Vendor not found" }, { status: 404 });
    }
    console.error("Zoho CRM vendor record request failed:", err);
    const message = err instanceof Error ? err.message : "Failed to reach Zoho CRM";
    return Response.json(
      { error: message, status: err.status, details: err.details },
      { status: status >= 400 && status < 600 ? status : 502 },
    );
  }

  const mapped = mapZohoRecord(row, apiNames);

  return Response.json({
    record: mapped,
    layoutLabel: layoutLabelFromRow(row),
    zohoRecordId: row.id != null ? String(row.id) : "",
  });
}
