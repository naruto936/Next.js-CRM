import type {
  ContractFieldFilterSelection,
  ContractFilterFieldMeta,
  ContractFilterSection,
} from "@/lib/contractFilterTypes";
import type { SowListField } from "@/lib/sowConfig";

export type StaticSowRecord = {
  id: string;
  fields: Record<SowListField | string, string>;
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

const STAGE_OPTIONS = [
  { value: "Won - Active", label: "Won - Active" },
  { value: "Open", label: "Open" },
  { value: "Closed", label: "Closed" },
];

const PIPELINE_OPTIONS = [{ value: "Sales - Ops Flow", label: "Sales - Ops Flow" }];

const staticFieldFilters: ContractFilterFieldMeta[] = [
  picklistField("Stage", "Stage", STAGE_OPTIONS),
  picklistField("Pipeline", "Pipeline", PIPELINE_OPTIONS),
  picklistField("Vendor", "Vendor", [
    { value: "Ghazanfar Ali Dev Test", label: "Ghazanfar Ali Dev Test" },
  ]),
];

const staticSystemViews: ContractFilterFieldMeta[] = [
  {
    apiName: "__custom_view__sow-all",
    label: "All SOWs",
    dataType: "custom_view",
    operators: [],
    options: [],
    hasOptions: true,
    section: "system_defined",
    customViewId: "sow-all",
  },
  {
    apiName: "__custom_view__sow-won",
    label: "Won - Active",
    dataType: "custom_view",
    operators: [],
    options: [],
    hasOptions: true,
    section: "system_defined",
    customViewId: "sow-won",
  },
];

export const SOW_STATIC_ALL_VIEW_ID = "sow-all";

export const SOW_STATIC_FILTER_SECTIONS: ContractFilterSection[] = [
  { id: "system_defined", title: "System Defined Filters", fields: staticSystemViews },
  { id: "fields", title: "Filter By Fields", fields: staticFieldFilters },
];

export const SOW_STATIC_FILTER_FIELDS: ContractFilterFieldMeta[] = [
  ...staticSystemViews,
  ...staticFieldFilters,
];

export const SOW_STATIC_RECORDS: StaticSowRecord[] = [
  {
    id: "static-sow-30073",
    fields: {
      SOWID: "SOW30073",
      Deal_Name: "SOW30073",
      Stage: "Won - Active",
      Pipeline: "Sales - Ops Flow",
      Vendor: "Ghazanfar Ali Dev Test",
      Company_Name: "test my site",
      Account_Name: "Test H",
      Start_Date: "2026-06-04",
      End_Date: "2026-06-12",
      Ops_Owner: "Jake Bednar",
    },
  },
];

function matchesCustomView(record: StaticSowRecord, customViewId: string | null) {
  if (!customViewId || customViewId === SOW_STATIC_ALL_VIEW_ID) return true;
  const stage = record.fields.Stage ?? "";
  if (customViewId === "sow-won") return stage === "Won - Active";
  return true;
}

function matchesFieldSelections(
  record: StaticSowRecord,
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

export function filterStaticSowRecords(
  records: StaticSowRecord[],
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
