import type {
  ContractFieldFilterSelection,
  ContractFilterFieldMeta,
  ContractFilterSection,
} from "@/lib/contractFilterTypes";
import type { ServiceCompletionListField } from "@/lib/serviceCompletionConfig";

export type StaticServiceCompletionRecord = {
  id: string;
  fields: Record<ServiceCompletionListField | string, string>;
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

const STATUS_OPTIONS = [
  { value: "Washed", label: "Washed" },
  { value: "Pending approval", label: "Pending approval" },
  { value: "Pending vendor", label: "Pending vendor" },
  { value: "Rejected", label: "Rejected" },
];

const VENDOR_OPTIONS = [
  { value: "Acme Fleet Services", label: "Acme Fleet Services" },
  { value: "Metro Wash Co.", label: "Metro Wash Co." },
  { value: "Sunrise Mobile Detail", label: "Sunrise Mobile Detail" },
];

const LAYOUT_OPTIONS = [
  { value: "Standard", label: "Standard" },
  { value: "Express", label: "Express" },
];

const staticFieldFilters: ContractFilterFieldMeta[] = [
  picklistField("Status", "Status", STATUS_OPTIONS),
  picklistField("Vendor", "Vendor", VENDOR_OPTIONS),
  picklistField("Layout", "Layout", LAYOUT_OPTIONS),
];

const staticSystemViews: ContractFilterFieldMeta[] = [
  {
    apiName: "__custom_view__sc-all",
    label: "All completions",
    dataType: "custom_view",
    operators: [],
    options: [],
    hasOptions: true,
    section: "system_defined",
    customViewId: "sc-all",
  },
  {
    apiName: "__custom_view__sc-pending",
    label: "Pending approval",
    dataType: "custom_view",
    operators: [],
    options: [],
    hasOptions: true,
    section: "system_defined",
    customViewId: "sc-pending",
  },
  {
    apiName: "__custom_view__sc-washed",
    label: "Washed",
    dataType: "custom_view",
    operators: [],
    options: [],
    hasOptions: true,
    section: "system_defined",
    customViewId: "sc-washed",
  },
];

export const SERVICE_COMPLETION_STATIC_ALL_VIEW_ID = "sc-all";

export const SERVICE_COMPLETION_STATIC_FILTER_SECTIONS: ContractFilterSection[] = [
  {
    id: "system_defined",
    title: "System Defined Filters",
    fields: staticSystemViews,
  },
  {
    id: "fields",
    title: "Filter By Fields",
    fields: staticFieldFilters,
  },
];

export const SERVICE_COMPLETION_STATIC_FILTER_FIELDS: ContractFilterFieldMeta[] = [
  ...staticSystemViews,
  ...staticFieldFilters,
];

export const SERVICE_COMPLETION_STATIC_RECORDS: StaticServiceCompletionRecord[] = [
  {
    id: "static-sc-1001",
    fields: {
      Name: "Carvana-CAR2548 - 2026-07-09",
      Status: "Washed",
      Wash_Date: "2026-07-09",
      Vendor: "A+ Plus Power Wash Inc - PA-6826",
      Site_Number: "Carvana-CAR2548",
      Contract: "CAR2548_VC_F_2026",
      Location_Name: "Market Ops - Scranton",
      Layout: "Fleet Wash Service",
    },
  },
  {
    id: "static-sc-1002",
    fields: {
      Name: "Site 2201 — Express cycle",
      Status: "Pending approval",
      Wash_Date: "2026-03-14",
      Vendor: "Metro Wash Co.",
      Site_Number: "2201",
      Contract: "CNT-2025-014",
      Location_Name: "Houston East Yard",
      Layout: "Express",
    },
  },
  {
    id: "static-sc-1003",
    fields: {
      Name: "Site 0876 — Vendor scheduled",
      Status: "Pending vendor",
      Wash_Date: "2026-03-15",
      Vendor: "Sunrise Mobile Detail",
      Site_Number: "0876",
      Contract: "CNT-2023-442",
      Location_Name: "Phoenix Hub",
      Layout: "Standard",
    },
  },
  {
    id: "static-sc-1004",
    fields: {
      Name: "Site 3310 — Rejected photos",
      Status: "Rejected",
      Wash_Date: "2026-03-10",
      Vendor: "Metro Wash Co.",
      Site_Number: "3310",
      Contract: "CNT-2024-119",
      Location_Name: "Atlanta South",
      Layout: "Standard",
    },
  },
  {
    id: "static-sc-1005",
    fields: {
      Name: "Site 1544 — Weekly wash",
      Status: "Washed",
      Wash_Date: "2026-03-16",
      Vendor: "Acme Fleet Services",
      Site_Number: "1544",
      Contract: "CNT-2025-201",
      Location_Name: "Chicago O'Hare Lot",
      Layout: "Express",
    },
  },
  {
    id: "static-sc-1006",
    fields: {
      Name: "Site 0091 — Awaiting QA",
      Status: "Pending approval",
      Wash_Date: "2026-03-17",
      Vendor: "Sunrise Mobile Detail",
      Site_Number: "0091",
      Contract: "CNT-2024-556",
      Location_Name: "Denver Central",
      Layout: "Standard",
    },
  },
];

function matchesCustomView(record: StaticServiceCompletionRecord, customViewId: string | null) {
  if (!customViewId || customViewId === SERVICE_COMPLETION_STATIC_ALL_VIEW_ID) return true;
  const status = record.fields.Status ?? "";
  if (customViewId === "sc-pending") {
    return status === "Pending approval" || status === "Pending vendor";
  }
  if (customViewId === "sc-washed") {
    return status === "Washed";
  }
  return true;
}

function matchesFieldSelections(
  record: StaticServiceCompletionRecord,
  selections: ContractFieldFilterSelection[],
) {
  if (selections.length === 0) return true;

  for (const selection of selections) {
    const fieldValue = (record.fields[selection.apiName] ?? "").trim();
    const values = selection.values.map((v) => v.trim()).filter(Boolean);
    if (values.length === 0) continue;

    if (selection.operator === "between" && values.length >= 2) {
      if (fieldValue < values[0] || fieldValue > values[1]) return false;
      continue;
    }

    const normalized = values.map((v) => v.toLowerCase());
    if (!normalized.includes(fieldValue.toLowerCase())) return false;
  }

  return true;
}

export function filterStaticServiceCompletionRecords(
  records: StaticServiceCompletionRecord[],
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
