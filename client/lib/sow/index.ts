import { formatFieldValue, mapZohoRecord } from "@/lib/zoho";

/** Zoho CRM module API name (UI route remains `/sow`). */
export const ZOHO_SOW_MODULE = "Deals";

export const SOW_FIELD_LABELS: Record<string, string> = {
  SOWID: "SOW ID",
  Deal_Name: "Deal name",
  Stage: "Stage",
  Pipeline: "Pipeline",
  Vendor: "Vendor",
  Company_Name: "Company",
  Account_Name: "Account",
  Start_Date: "Start date",
  End_Date: "End date",
  Ops_Owner: "Ops owner",
  Owner: "Owner",
  Sales_Owner: "Sales owner",
  Sales_Associate_New: "Sales associate",
  Operations_Associate_New: "Operations associate",
  Created_By: "Created by",
  Modified_By: "Modified by",
  Category: "Category",
  Type: "Type",
  Currency: "Currency",
  Amount: "Amount",
  Days: "Days",
  SOW_Summary: "SOW summary",
  Record_Status__s: "Record status",
  Created_Time: "Created",
  Modified_Time: "Modified",
  Client_Signed_Status: "Client signed status",
  Vendor_Signed_Status: "Vendor signed status",
  Expected_Contract_Start_Date: "Expected contract start",
  Expected_Contract_End_Date: "Expected contract end",
  Contract_Term: "Contract term",
  Vendor_Bid_Due_Date: "Vendor bid due",
  Client_Bid_Due_Date: "Client bid due",
  Location_Name: "Location name",
  Site_Street: "Site street",
  Site_City: "Site city",
  Site_State: "Site state",
  Site_Zip: "Site zip",
  Site_Acreage: "Site acreage",
  Address: "Address",
  Internal_Notes_for_Olio_Team: "Internal notes (team)",
  Progress_Notes: "Progress notes",
  Sourcing_Notes: "Sourcing notes",
  Client_Preference_Notes: "Client preference notes",
  Notes_To_Vendor_Bidding: "Notes to vendor bidding",
  Site_Visit_Assignment: "Site visit assignment",
  Is_OTS_SOW: "OTS SOW",
  Priority: "Priority",
  Urgency: "Urgency",
  Region_District_Zone: "Region / district / zone",
};

export const SOW_DETAIL_SECTIONS = [
  {
    title: "SOW overview",
    defaultOpen: true,
    fields: [
      "SOWID",
      "Deal_Name",
      "Stage",
      "Pipeline",
      "Category",
      "Type",
      "Currency",
      "Amount",
      "Days",
      "Site_Visit_Assignment",
      "Is_OTS_SOW",
      "SOW_Summary",
      "Record_Status__s",
      "Created_Time",
      "Modified_Time",
    ],
  },
  {
    title: "Ownership",
    defaultOpen: true,
    fields: [
      "Owner",
      "Ops_Owner",
      "Sales_Owner",
      "Sales_Associate_New",
      "Operations_Associate_New",
      "Created_By",
      "Modified_By",
    ],
  },
  {
    title: "Client & vendor",
    defaultOpen: true,
    fields: [
      "Account_Name",
      "Company_Name",
      "Vendor",
      "Client_Signed_Status",
      "Vendor_Signed_Status",
      "Priority",
      "Urgency",
      "Region_District_Zone",
    ],
  },
  {
    title: "Dates & terms",
    defaultOpen: true,
    fields: [
      "Start_Date",
      "End_Date",
      "Expected_Contract_Start_Date",
      "Expected_Contract_End_Date",
      "Contract_Term",
      "Vendor_Bid_Due_Date",
      "Client_Bid_Due_Date",
    ],
  },
  {
    title: "Site",
    defaultOpen: true,
    fields: [
      "Location_Name",
      "Address",
      "Site_Street",
      "Site_City",
      "Site_State",
      "Site_Zip",
      "Site_Acreage",
    ],
  },
  {
    title: "Notes",
    defaultOpen: true,
    fields: [
      "Internal_Notes_for_Olio_Team",
      "Progress_Notes",
      "Sourcing_Notes",
      "Client_Preference_Notes",
      "Notes_To_Vendor_Bidding",
    ],
  },
] as const;

export function allSowDetailApiNames() {
  const names = new Set<string>();
  for (const section of SOW_DETAIL_SECTIONS) {
    for (const f of section.fields) names.add(f);
  }
  return [...names];
}

export function labelForSowField(apiName: string) {
  return SOW_FIELD_LABELS[apiName] ?? apiName.replace(/_/g, " ");
}

/* ─── Static SOW detail ─── */

/** Zoho-shaped SOW row (`SOW30073` sample). */
const STATIC_SOW_30073_RAW: Record<string, unknown> = {
  Owner: {
    name: "Olio Group",
    id: "2168928000035310001",
    email: "no-reply@oliogroupmn.com",
  },
  Address: null,
  Site_Acreage: 25.88,
  Site_Number: null,
  Currency: "USD",
  Stage: "Won - Active",
  id: "2168928000114292432",
  Ops_Owner: { name: "Jake Bednar", id: "2168928000000938001" },
  Status: null,
  Site_Visit_Assignment: "Operations",
  Created_Time: "2026-04-27T10:16:28-05:00",
  Created_By: {
    name: "Olio Group",
    id: "2168928000035310001",
    email: "no-reply@oliogroupmn.com",
  },
  Sales_Owner: { name: "Jim Bjorgaard", id: "2168928000000893001" },
  End_Date: "2026-06-12",
  Days: 43,
  Sales_Associate_New: { name: "Olio Group", id: "2168928000035310001" },
  Account_Name: { name: "Test H", id: "2168928000102691004" },
  Start_Date: "2026-06-04",
  SOWID: "SOW30073",
  Record_Status__s: "Available",
  Pipeline: "Sales - Ops Flow",
  Deal_Name: "SOW30073",
  Is_OTS_SOW: false,
  Company_Name: { name: "test my site", id: "2168928000108371533" },
  Scope_of_Work: [
    {
      Category: "OTS",
      OurServices: { name: "Test One Off", id: "2168928000030424094" },
      Vendor_Price: 12,
      End_Date: "2026-06-12",
      id: "2168928000119791152",
      Start_Date: "2026-06-04",
      Invoice_Price: 11,
      Vendor_Target_Price: 0,
    },
    {
      Category: "F",
      OurServices: { name: "Test My Service SOW", id: "2168928000086841179" },
      Vendor_Price: null,
      End_Date: "2026-06-09",
      id: "2168928000119791316",
      Start_Date: "2026-06-04",
      Invoice_Price: 11,
      Vendor_Target_Price: 0,
    },
  ],
  Category: ["OTS"],
  Modified_By: {
    name: "Dan Nelson",
    id: "2168928000000107007",
    email: "dan@oliogroupmn.com",
  },
  Modified_Time: "2026-06-10T16:58:55-05:00",
  SOW_Summary:
    "SOW Item Name | Client Price | Vendor Price\n---------------------------------------------------------\nTest One Off              | 11           | 12          \nTest My Service SOW       | 11           | 0",
  Vendor: { name: "Ghazanfar Ali Dev Test", id: "2168928000037970160" },
  Operations_Associate_New: { name: "Olio Group", id: "2168928000035310001" },
  Layout: {
    display_label: "SOW",
    name: "SOW",
    id: "2168928000000091023",
  },
};

const STATIC_RAW_BY_ID: Record<string, Record<string, unknown>> = {
  "static-sow-30073": STATIC_SOW_30073_RAW,
  "2168928000114292432": STATIC_SOW_30073_RAW,
};

export function isStaticSowId(recordId: string) {
  return recordId.startsWith("static-sow-") || recordId in STATIC_RAW_BY_ID;
}

export type SowScopeOfWorkRow = {
  id: string;
  serviceName: string;
  category: string;
  startDate: string;
  endDate: string;
  invoicePrice: string;
  vendorPrice: string;
  vendorTargetPrice: string;
};

function mapScopeOfWork(raw: unknown): SowScopeOfWorkRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row, index) => {
    const r = row as Record<string, unknown>;
    const service = r.OurServices as { name?: string } | undefined;
    return {
      id: r.id != null ? String(r.id) : `sow-line-${index}`,
      serviceName: service?.name != null ? String(service.name) : formatFieldValue(r.OurServices),
      category: formatFieldValue(r.Category),
      startDate: formatFieldValue(r.Start_Date),
      endDate: formatFieldValue(r.End_Date),
      invoicePrice: formatFieldValue(r.Invoice_Price),
      vendorPrice: formatFieldValue(r.Vendor_Price),
      vendorTargetPrice: formatFieldValue(r.Vendor_Target_Price),
    };
  });
}

export function getStaticSowDetail(recordId: string) {
  const row = STATIC_RAW_BY_ID[recordId];
  if (!row) return null;

  const apiNames = allSowDetailApiNames();
  const mapped = mapZohoRecord(row, apiNames);
  mapped.id = recordId;

  const scopeOfWork = mapScopeOfWork(row.Scope_of_Work);
  const layout = row.Layout;
  const layoutLabel =
    layout && typeof layout === "object" && "display_label" in layout && layout.display_label ?
      String(layout.display_label)
    : layout && typeof layout === "object" && "name" in layout && layout.name ?
      String(layout.name)
    : "";

  return {
    record: mapped,
    scopeOfWork,
    layoutLabel,
    zohoRecordId: row.id != null ? String(row.id) : "",
  };
}
