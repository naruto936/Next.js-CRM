import { VENDOR_STATIC_RECORDS } from "@/lib/vendorStaticData";
import { allVendorDetailApiNames } from "@/lib/vendorConfig";
import { mapZohoRecord } from "@/lib/zohoContractMap";

const STATIC_VENDOR_1001_RAW: Record<string, unknown> = {
  id: "2168928000037970160",
  Name: "Ghazanfar Ali Dev Test",
  Vendor_Status: "Active",
  Vendor_Type: "Service provider",
  Record_Status__s: "Available",
  Description: "Dev/test vendor used for SOW, bids, and vendor invoice demos.",
  Email: "ghazanfar.dev@example.com",
  Phone: "(612) 555-0142",
  Website: "https://example.com/ghazanfar-dev",
  Street: "100 Demo Boulevard",
  City: "Minneapolis",
  State: "MN",
  Zip_Code: "55401",
  Country: "United States",
  Tax_ID: "XX-1234567",
  Payment_Terms: "Net 30",
  Owner: {
    name: "Gabriel Brent",
    id: "2168928000027767001",
    email: "gabrielbrent@oliogroupmn.com",
  },
  Created_Time: "2024-11-02T10:15:00-06:00",
  Modified_Time: "2026-05-28T14:22:00-05:00",
  Created_By: {
    name: "Gabriel Brent",
    id: "2168928000027767001",
    email: "gabrielbrent@oliogroupmn.com",
  },
  Modified_By: {
    name: "Dan Nelson",
    id: "2168928000000107007",
    email: "dan@oliogroupmn.com",
  },
  $layout_id: {
    display_label: "Standard",
    name: "Standard",
    id: "2168928000033656001",
  },
};

const STATIC_RAW_BY_ID: Record<string, Record<string, unknown>> = {
  "static-vendor-1001": STATIC_VENDOR_1001_RAW,
  "2168928000037970160": STATIC_VENDOR_1001_RAW,
};

for (const listRow of VENDOR_STATIC_RECORDS) {
  if (listRow.id in STATIC_RAW_BY_ID) continue;
  STATIC_RAW_BY_ID[listRow.id] = {
    id: listRow.id,
    ...listRow.fields,
    $layout_id: { display_label: "Standard", name: "Standard" },
  };
}

export function isStaticVendorId(recordId: string) {
  return recordId.startsWith("static-vendor-") || recordId in STATIC_RAW_BY_ID;
}

function layoutLabelFromRow(row: Record<string, unknown>) {
  const layout = row.$layout_id ?? row.Layout;
  if (layout && typeof layout === "object" && "display_label" in layout && layout.display_label) {
    return String(layout.display_label);
  }
  if (layout && typeof layout === "object" && "name" in layout && layout.name) {
    return String(layout.name);
  }
  return "";
}

export function getStaticVendorDetail(recordId: string) {
  const row = STATIC_RAW_BY_ID[recordId];
  if (!row) return null;

  const apiNames = allVendorDetailApiNames();
  const mapped = mapZohoRecord(row, apiNames);
  mapped.id = recordId;

  return {
    record: mapped,
    layoutLabel: layoutLabelFromRow(row),
    zohoRecordId: row.id != null ? String(row.id) : "",
  };
}
