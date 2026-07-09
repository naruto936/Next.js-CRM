import type {
  ContractFieldFilterSelection,
  ContractFilterFieldMeta,
  ContractFilterSection,
} from "@/lib/contractFilterTypes";
import type { VendorListField } from "@/lib/vendorConfig";

export type StaticVendorRecord = {
  id: string;
  fields: Record<VendorListField | string, string>;
};

function picklistField(
  apiName: string,
  label: string,
  options: { value: string; label: string }[],
): ContractFilterFieldMeta {
  return {
    apiName,
    label,
    dataType: "picklist",
    operators: [],
    options,
    hasOptions: true,
    section: "fields",
  };
}

const staticFieldFilters: ContractFilterFieldMeta[] = [
  picklistField("Vendor_Status", "Status", [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Pending", label: "Pending" },
  ]),
  picklistField("State", "State", [
    { value: "MN", label: "MN" },
    { value: "PA", label: "PA" },
    { value: "TX", label: "TX" },
  ]),
];

const staticSystemViews: ContractFilterFieldMeta[] = [
  {
    apiName: "__custom_view__vendors-all",
    label: "All vendors",
    dataType: "custom_view",
    operators: [],
    options: [],
    hasOptions: true,
    section: "system_defined",
    customViewId: "vendors-all",
  },
  {
    apiName: "__custom_view__vendors-active",
    label: "Active vendors",
    dataType: "custom_view",
    operators: [],
    options: [],
    hasOptions: true,
    section: "system_defined",
    customViewId: "vendors-active",
  },
];

export const VENDOR_STATIC_ALL_VIEW_ID = "vendors-all";

export const VENDOR_STATIC_FILTER_SECTIONS: ContractFilterSection[] = [
  { id: "system_defined", title: "System Defined Filters", fields: staticSystemViews },
  { id: "fields", title: "Filter By Fields", fields: staticFieldFilters },
];

export const VENDOR_STATIC_FILTER_FIELDS: ContractFilterFieldMeta[] = [
  ...staticSystemViews,
  ...staticFieldFilters,
];

export const VENDOR_STATIC_RECORDS: StaticVendorRecord[] = [
  {
    id: "static-vendor-1001",
    fields: {
      Name: "Ghazanfar Ali Dev Test",
      Vendor_Status: "Active",
      Email: "ghazanfar.dev@example.com",
      Phone: "(612) 555-0142",
      City: "Minneapolis",
      State: "MN",
      Owner: "Gabriel Brent",
      Record_Status__s: "Available",
    },
  },
  {
    id: "static-vendor-1002",
    fields: {
      Name: "Test-Standard Solar",
      Vendor_Status: "Active",
      Email: "ops@standardsolar.example",
      Phone: "(703) 555-0198",
      City: "Arlington",
      State: "VA",
      Owner: "Olio Group",
      Record_Status__s: "Available",
    },
  },
  {
    id: "static-vendor-1003",
    fields: {
      Name: "Carvana Fleet Services",
      Vendor_Status: "Active",
      Email: "fleet@carvana.example",
      Phone: "(480) 555-0100",
      City: "Tempe",
      State: "AZ",
      Owner: "Jake Bednar",
      Record_Status__s: "Available",
    },
  },
  {
    id: "static-vendor-1004",
    fields: {
      Name: "A+ Plus Power Wash Inc - PA-6826",
      Vendor_Status: "Pending",
      Email: "dispatch@apluswash.example",
      Phone: "(570) 555-0166",
      City: "Scranton",
      State: "PA",
      Owner: "Jim Bjorgaard",
      Record_Status__s: "Available",
    },
  },
];

function matchesCustomView(record: StaticVendorRecord, customViewId: string | null) {
  if (!customViewId || customViewId === VENDOR_STATIC_ALL_VIEW_ID) return true;
  if (customViewId === "vendors-active") {
    return (record.fields.Vendor_Status ?? "").toLowerCase() === "active";
  }
  return true;
}

function matchesFieldSelections(
  record: StaticVendorRecord,
  selections: ContractFieldFilterSelection[],
) {
  if (selections.length === 0) return true;
  for (const selection of selections) {
    const fieldValue = (record.fields[selection.apiName] ?? "").trim();
    const values = selection.values.map((v) => v.trim()).filter(Boolean);
    if (values.length === 0) continue;
    const normalized = values.map((v) => v.toLowerCase());
    if (!normalized.includes(fieldValue.toLowerCase())) return false;
  }
  return true;
}

export function filterStaticVendorRecords(
  records: StaticVendorRecord[],
  {
    fieldSelections = [],
    customViewId = null,
  }: {
    fieldSelections?: ContractFieldFilterSelection[];
    customViewId?: string | null;
  },
) {
  return records.filter(
    (record) =>
      matchesCustomView(record, customViewId) &&
      matchesFieldSelections(record, fieldSelections),
  );
}
