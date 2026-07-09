import type {
  ContractFieldFilterSelection,
  ContractFilterFieldMeta,
  ContractFilterSection,
} from "@/lib/contractFilterTypes";
import type { BidsListField } from "@/lib/bidsConfig";

export type StaticBidRecord = {
  id: string;
  fields: Record<BidsListField | string, string>;
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
  { value: "Submitted", label: "Submitted" },
  { value: "Under review", label: "Under review" },
  { value: "Awarded", label: "Awarded" },
  { value: "Declined", label: "Declined" },
];

const staticFieldFilters: ContractFilterFieldMeta[] = [
  picklistField("Status", "Status", STATUS_OPTIONS),
  picklistField("Vendor", "Vendor", [
    { value: "Ghazanfar Ali Dev Test", label: "Ghazanfar Ali Dev Test" },
    { value: "A+ Plus Power Wash Inc - PA-6826", label: "A+ Plus Power Wash Inc - PA-6826" },
  ]),
];

const staticSystemViews: ContractFilterFieldMeta[] = [
  {
    apiName: "__custom_view__bids-all",
    label: "All bids",
    dataType: "custom_view",
    operators: [],
    options: [],
    hasOptions: true,
    section: "system_defined",
    customViewId: "bids-all",
  },
  {
    apiName: "__custom_view__bids-submitted",
    label: "Submitted",
    dataType: "custom_view",
    operators: [],
    options: [],
    hasOptions: true,
    section: "system_defined",
    customViewId: "bids-submitted",
  },
  {
    apiName: "__custom_view__bids-awarded",
    label: "Awarded",
    dataType: "custom_view",
    operators: [],
    options: [],
    hasOptions: true,
    section: "system_defined",
    customViewId: "bids-awarded",
  },
];

export const BIDS_STATIC_ALL_VIEW_ID = "bids-all";

export const BIDS_STATIC_FILTER_SECTIONS: ContractFilterSection[] = [
  { id: "system_defined", title: "System Defined Filters", fields: staticSystemViews },
  { id: "fields", title: "Filter By Fields", fields: staticFieldFilters },
];

export const BIDS_STATIC_FILTER_FIELDS: ContractFilterFieldMeta[] = [
  ...staticSystemViews,
  ...staticFieldFilters,
];

export const BIDS_STATIC_RECORDS: StaticBidRecord[] = [
  {
    id: "static-bid-1001",
    fields: {
      Name: "SOW30073 — Ghazanfar Ali Dev Test",
      Bid_Number: "BID-2026-0142",
      Status: "Awarded",
      Vendor: "Ghazanfar Ali Dev Test",
      SOW: "SOW30073",
      Amount: "23",
      Currency: "USD",
      Due_Date: "2026-06-01",
      Submitted_Date: "2026-05-28",
      Location_Name: "Market Ops - Scranton",
    },
  },
  {
    id: "static-bid-1002",
    fields: {
      Name: "SOW30073 — A+ Plus Power Wash",
      Bid_Number: "BID-2026-0143",
      Status: "Declined",
      Vendor: "A+ Plus Power Wash Inc - PA-6826",
      SOW: "SOW30073",
      Amount: "31",
      Currency: "USD",
      Due_Date: "2026-06-01",
      Submitted_Date: "2026-05-29",
      Location_Name: "Market Ops - Scranton",
    },
  },
  {
    id: "static-bid-1003",
    fields: {
      Name: "SOW30074 — Metro Wash Co.",
      Bid_Number: "BID-2026-0150",
      Status: "Under review",
      Vendor: "Metro Wash Co.",
      SOW: "SOW30074",
      Amount: "18",
      Currency: "USD",
      Due_Date: "2026-06-15",
      Submitted_Date: "2026-06-02",
      Location_Name: "Houston East Yard",
    },
  },
];

function matchesCustomView(record: StaticBidRecord, customViewId: string | null) {
  if (!customViewId || customViewId === BIDS_STATIC_ALL_VIEW_ID) return true;
  const status = record.fields.Status ?? "";
  if (customViewId === "bids-submitted") {
    return status === "Submitted" || status === "Under review";
  }
  if (customViewId === "bids-awarded") return status === "Awarded";
  return true;
}

function matchesFieldSelections(
  record: StaticBidRecord,
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

export function filterStaticBidRecords(
  records: StaticBidRecord[],
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
