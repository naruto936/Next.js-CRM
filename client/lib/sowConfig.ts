export const ZOHO_SOW_MODULE = "SOW";

export const SOW_LIST_FIELDS = [
  "SOWID",
  "Deal_Name",
  "Stage",
  "Pipeline",
  "Vendor",
  "Company_Name",
  "Account_Name",
  "Start_Date",
  "End_Date",
  "Ops_Owner",
] as const;

export type SowListField = (typeof SOW_LIST_FIELDS)[number];

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

export function parseSowListFields(searchParams: URLSearchParams) {
  const raw = searchParams.get("fields");
  if (!raw?.trim()) return [...SOW_LIST_FIELDS];
  const names = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((name) => name !== "id");
  return names.length > 0 ? names : [...SOW_LIST_FIELDS];
}
