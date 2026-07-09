export const ZOHO_SERVICE_COMPLETIONS_MODULE = "ServiceCompletions";

export const SERVICE_COMPLETION_LIST_FIELDS = [
  "Name",
  "Status",
  "Wash_Date",
  "Vendor",
  "Site_Number",
  "Contract",
  "Location_Name",
  "Record_Status__s",
] as const;

/** Not accepted on Zoho module list `fields` param (use $layout_id on record fetch). */
export const SERVICE_COMPLETION_LIST_FIELDS_EXCLUDED_FROM_ZOHO = ["Layout"] as const;

export function serviceCompletionFieldsForZohoList(apiNames: string[]) {
  const excluded = new Set<string>(SERVICE_COMPLETION_LIST_FIELDS_EXCLUDED_FROM_ZOHO);
  return apiNames.filter((name) => name && !excluded.has(name));
}

export type ServiceCompletionListField = (typeof SERVICE_COMPLETION_LIST_FIELDS)[number];

export const SERVICE_COMPLETION_FIELD_LABELS: Record<string, string> = {
  Name: "Name",
  Status: "Status",
  Wash_Date: "Wash date",
  Service_Date: "Service date",
  Service_Time: "Service time",
  Layout: "Layout",
  Record_Status__s: "Record status",
  Created_Time: "Created",
  Modified_Time: "Modified",
  Site_Number: "Site",
  Contract: "Contract",
  Vendor: "Vendor",
  Operation_Associate: "Operations associate",
  Owner: "Owner",
  Created_By: "Created by",
  Modified_By: "Modified by",
  Location_Name: "Location name",
  Location_Street: "Street",
  Location_City: "City",
  Location_State: "State",
  Location_Code: "Location code",
  Location_Country: "Country",
  Service_Comments: "Service comments",
  Progress_Notes: "Progress notes",
  Units_Washed_Num: "Units washed",
  Catalyst: "Catalyst",
  Currency: "Currency",
  Vendor_Invoice: "Vendor invoice",
  Client_Company_Name: "Client company",
  Company_Name: "Company",
};

export const SERVICE_COMPLETION_DETAIL_SECTIONS = [
  {
    title: "Service overview",
    defaultOpen: true,
    fields: [
      "Name",
      "Status",
      "Wash_Date",
      "Service_Date",
      "Service_Time",
      "Layout",
      "Record_Status__s",
      "Units_Washed_Num",
      "Currency",
      "Catalyst",
      "Created_Time",
      "Modified_Time",
    ],
  },
  {
    title: "Site & relationships",
    defaultOpen: true,
    fields: [
      "Site_Number",
      "Contract",
      "Vendor",
      "Operation_Associate",
      "Owner",
      "Created_By",
      "Modified_By",
      "Vendor_Invoice",
      "Client_Company_Name",
      "Company_Name",
    ],
  },
  {
    title: "Location",
    defaultOpen: true,
    fields: [
      "Location_Name",
      "Location_Street",
      "Location_City",
      "Location_State",
      "Location_Code",
      "Location_Country",
    ],
  },
  {
    title: "Notes & comments",
    defaultOpen: true,
    fields: ["Service_Comments", "Progress_Notes", "Rejection_Comments"],
  },
] as const;

export function allServiceCompletionDetailApiNames() {
  const names = new Set<string>();
  for (const section of SERVICE_COMPLETION_DETAIL_SECTIONS) {
    for (const f of section.fields) names.add(f);
  }
  names.add("Fleet_Units");
  return [...names];
}

export function parseServiceCompletionListFields(searchParams: URLSearchParams) {
  const raw = searchParams.get("fields");
  if (!raw?.trim()) {
    return [...SERVICE_COMPLETION_LIST_FIELDS];
  }
  const names = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((name) => name !== "id");
  return names.length > 0 ? names : [...SERVICE_COMPLETION_LIST_FIELDS];
}

export function labelForServiceCompletionField(apiName: string) {
  return SERVICE_COMPLETION_FIELD_LABELS[apiName] ?? apiName.replace(/_/g, " ");
}
