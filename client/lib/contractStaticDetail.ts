import { CONTRACTS_STATIC_RECORDS, isStaticContractId } from "@/lib/contractStaticData";
import { mapZohoRecord } from "@/lib/zohoContractMap";

const DETAIL_FIELD_NAMES = [
  "Name",
  "Contract_Status",
  "Vendor",
  "Company_Name",
  "Site",
  "Contract_Start_Date",
  "Contract_End_Date",
  "Owner",
  "Created_Time",
  "Modified_Time",
  "Created_By",
  "Modified_By",
] as const;

const STATIC_DETAIL_BY_ID: Record<string, Record<string, unknown>> = {};

for (const row of CONTRACTS_STATIC_RECORDS) {
  STATIC_DETAIL_BY_ID[row.id] = {
    id: row.id,
    ...row.fields,
    Created_Time: "2025-08-01T09:00:00-05:00",
    Modified_Time: "2026-01-10T14:30:00-05:00",
    Created_By: { name: row.fields.Owner ?? "Olio Group", id: "demo-created" },
    Modified_By: { name: "Dan Nelson", id: "demo-modified" },
    $layout_id: { display_label: "Standard", name: "Standard" },
  };
}

export function getStaticContractDetail(recordId: string) {
  const row = STATIC_DETAIL_BY_ID[recordId];
  if (!row) return null;

  const apiNames = [...DETAIL_FIELD_NAMES];
  const mapped = mapZohoRecord(row, apiNames);
  mapped.id = recordId;

  const layout = row.$layout_id;
  const layoutLabel =
    layout && typeof layout === "object" && "display_label" in layout ?
      String(layout.display_label)
    : "Standard";

  return {
    record: mapped,
    layoutLabel,
    zohoRecordId: row.id != null ? String(row.id) : "",
    offlineDemo: true,
  };
}

export { isStaticContractId };
