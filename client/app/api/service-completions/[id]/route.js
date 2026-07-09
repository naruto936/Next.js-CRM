import { fetchZohoRecordById } from "@/lib/fetchZohoModuleRecord";
import {
  allServiceCompletionDetailApiNames,
  ZOHO_SERVICE_COMPLETIONS_MODULE,
} from "@/lib/serviceCompletionConfig";
import { getStaticServiceCompletionDetail, isStaticServiceCompletionId } from "@/lib/serviceCompletionStaticDetail";
import { formatFieldValue, mapZohoRecord } from "@/lib/zohoContractMap";

function mapFleetUnits(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((row, index) => {
    const unit = row?.Fleet_Units;
    const name =
      unit && typeof unit === "object" && unit.name != null ?
        String(unit.name)
      : formatFieldValue(row);
    return {
      id: row?.id != null ? String(row.id) : `row-${index}`,
      unitName: name || "—",
      unitId: unit?.id != null ? String(unit.id) : "",
    };
  });
}

export async function GET(_request, context) {
  const { id } = await context.params;
  if (!id || !String(id).trim()) {
    return Response.json({ error: "Missing record id" }, { status: 400 });
  }

  const recordId = String(id).trim();

  if (isStaticServiceCompletionId(recordId)) {
    const staticDetail = getStaticServiceCompletionDetail(recordId);
    if (!staticDetail) {
      return Response.json({ error: "Service completion not found" }, { status: 404 });
    }
    return Response.json(staticDetail);
  }

  const apiNames = allServiceCompletionDetailApiNames();

  let row;
  try {
    row = await fetchZohoRecordById(ZOHO_SERVICE_COMPLETIONS_MODULE, recordId, apiNames);
  } catch (err) {
    const status = err.status ?? 502;
    if (status === 404) {
      return Response.json({ error: "Service completion not found" }, { status: 404 });
    }
    console.error("Zoho CRM record request failed:", err);
    const message = err instanceof Error ? err.message : "Failed to reach Zoho CRM";
    return Response.json(
      {
        error: message,
        status: err.status,
        details: err.details,
      },
      { status: status >= 400 && status < 600 ? status : 502 },
    );
  }

  const mapped = mapZohoRecord(row, apiNames);
  const fleetUnits = mapFleetUnits(row.Fleet_Units);

  return Response.json({
    record: mapped,
    fleetUnits,
    layoutLabel:
      row.Layout && typeof row.Layout === "object" && row.Layout.display_label ?
        String(row.Layout.display_label)
      : row.Layout?.name ?
        String(row.Layout.name)
      : "",
    zohoRecordId: row.id != null ? String(row.id) : "",
  });
}
