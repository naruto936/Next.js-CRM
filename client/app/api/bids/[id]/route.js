import { getStaticBidDetail, isStaticBidId } from "@/lib/bidsStaticDetail";
import { fetchZohoRecordById } from "@/lib/fetchZohoModuleRecord";
import { allBidsDetailApiNames, ZOHO_BIDS_MODULE } from "@/lib/bidsConfig";
import { formatFieldValue, mapZohoRecord } from "@/lib/zohoContractMap";

function mapBidLineItems(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((row, index) => {
    const service = row?.Service;
    const name =
      service && typeof service === "object" && service.name != null ?
        String(service.name)
      : formatFieldValue(row?.Service);
    return {
      id: row?.id != null ? String(row.id) : `bid-line-${index}`,
      serviceName: name || "—",
      category: formatFieldValue(row?.Category),
      quantity: formatFieldValue(row?.Quantity),
      unitPrice: formatFieldValue(row?.Unit_Price),
      clientPrice: formatFieldValue(row?.Client_Price),
      lineTotal: formatFieldValue(row?.Line_Total),
    };
  });
}

export async function GET(_request, context) {
  const { id } = await context.params;
  if (!id || !String(id).trim()) {
    return Response.json({ error: "Missing record id" }, { status: 400 });
  }

  const recordId = String(id).trim();

  if (isStaticBidId(recordId)) {
    const staticDetail = getStaticBidDetail(recordId);
    if (!staticDetail) {
      return Response.json({ error: "Bid not found" }, { status: 404 });
    }
    return Response.json(staticDetail);
  }

  const apiNames = allBidsDetailApiNames();

  let row;
  try {
    row = await fetchZohoRecordById(ZOHO_BIDS_MODULE, recordId, apiNames);
  } catch (err) {
    const status = err.status ?? 502;
    if (status === 404) {
      return Response.json({ error: "Bid not found" }, { status: 404 });
    }
    console.error("Zoho CRM bid record request failed:", err);
    const message = err instanceof Error ? err.message : "Failed to reach Zoho CRM";
    return Response.json(
      { error: message, status: err.status, details: err.details },
      { status: status >= 400 && status < 600 ? status : 502 },
    );
  }

  const mapped = mapZohoRecord(row, apiNames);
  const lineItems = mapBidLineItems(row.Bid_Line_Items);

  return Response.json({
    record: mapped,
    lineItems,
    layoutLabel:
      row.Layout && typeof row.Layout === "object" && row.Layout.display_label ?
        String(row.Layout.display_label)
      : row.Layout?.name ?
        String(row.Layout.name)
      : "",
    zohoRecordId: row.id != null ? String(row.id) : "",
  });
}
