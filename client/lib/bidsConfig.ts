export const ZOHO_BIDS_MODULE = "Bids";

export const BIDS_LIST_FIELDS = [
  "Name",
  "Bid_Number",
  "Status",
  "Vendor",
  "SOW",
  "Amount",
  "Currency",
  "Due_Date",
  "Submitted_Date",
  "Location_Name",
] as const;

export type BidsListField = (typeof BIDS_LIST_FIELDS)[number];

export const BIDS_FIELD_LABELS: Record<string, string> = {
  Name: "Name",
  Bid_Number: "Bid number",
  Status: "Status",
  Vendor: "Vendor",
  SOW: "SOW",
  Amount: "Amount",
  Currency: "Currency",
  Due_Date: "Due date",
  Submitted_Date: "Submitted date",
  Location_Name: "Location",
  Owner: "Owner",
  Stage: "Stage",
  Site_Number: "Site",
  Record_Status__s: "Record status",
  Created_Time: "Created",
  Modified_Time: "Modified",
  Created_By: "Created by",
  Modified_By: "Modified by",
  Ops_Owner: "Ops owner",
  Sales_Owner: "Sales owner",
  Bid_Notes: "Bid notes",
  Internal_Notes: "Internal notes",
  Vendor_Notes: "Vendor notes",
  Rejection_Reason: "Rejection reason",
  Round: "Round",
  Is_Awarded: "Awarded",
};

export const BIDS_DETAIL_SECTIONS = [
  {
    title: "Bid overview",
    defaultOpen: true,
    fields: [
      "Name",
      "Bid_Number",
      "Status",
      "Stage",
      "Round",
      "Is_Awarded",
      "Amount",
      "Currency",
      "Due_Date",
      "Submitted_Date",
      "Record_Status__s",
      "Created_Time",
      "Modified_Time",
    ],
  },
  {
    title: "Relationships",
    defaultOpen: true,
    fields: ["Vendor", "SOW", "Site_Number", "Location_Name", "Owner", "Ops_Owner", "Sales_Owner"],
  },
  {
    title: "Notes",
    defaultOpen: true,
    fields: ["Bid_Notes", "Internal_Notes", "Vendor_Notes", "Rejection_Reason"],
  },
  {
    title: "Audit",
    defaultOpen: false,
    fields: ["Created_By", "Modified_By"],
  },
] as const;

export function allBidsDetailApiNames() {
  const names = new Set<string>();
  for (const section of BIDS_DETAIL_SECTIONS) {
    for (const f of section.fields) names.add(f);
  }
  return [...names];
}

export function labelForBidsField(apiName: string) {
  return BIDS_FIELD_LABELS[apiName] ?? apiName.replace(/_/g, " ");
}

export function parseBidsListFields(searchParams: URLSearchParams) {
  const raw = searchParams.get("fields");
  if (!raw?.trim()) return [...BIDS_LIST_FIELDS];
  const names = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((name) => name !== "id");
  return names.length > 0 ? names : [...BIDS_LIST_FIELDS];
}
