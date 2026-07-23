/**
 * Port of Deluge `create_service_completion_from_contracts` (see deluge.dg).
 * Prefills a draft from Contract + Site, then creates on Save.
 */

import { fetchZohoJson, ZOHO_CRM_BASE } from "@/lib/zoho";
import type {
  CreateServiceCompletionDraftResult,
  CreateServiceCompletionPayload,
  CreateServiceCompletionResult,
  ServiceCompletionDraft,
  ServiceCompletionEditableFields,
} from "@/widgets/create-service-completion/types";
import {
  SC_LAYOUT_CARVANA,
  SC_LAYOUT_DEFAULT,
  SC_LAYOUT_STANDARD_SOLAR,
  SERVICE_COMPLETION_ZOHO_RECORD_URL,
  SERVICE_COMPLETIONS_MODULE,
} from "@/widgets/create-service-completion/types";

type ZohoLookup = { id?: string; name?: string } | string | null | undefined;

function lookupId(value: ZohoLookup): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object" && value.id != null) {
    return String(value.id).trim();
  }
  return "";
}

function lookupName(value: ZohoLookup): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object" && value.name != null) {
    return String(value.name).trim();
  }
  return "";
}

function startsWithIgnoreCase(value: string, prefix: string): boolean {
  return value.toLowerCase().startsWith(prefix.toLowerCase());
}

/** Deluge: `current_date.toString("MM-dd-YYYY")` */
function formatServiceCompletionDate(date = new Date()): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${mm}-${dd}-${yyyy}`;
}

function resolveLayout(siteName: string): { id: string; name: string } {
  if (
    startsWithIgnoreCase(siteName, "standard solar") ||
    startsWithIgnoreCase(siteName, "ameresco") ||
    startsWithIgnoreCase(siteName, "madison")
  ) {
    return { id: SC_LAYOUT_STANDARD_SOLAR, name: "Standard Solar / Ameresco / Madison" };
  }
  if (startsWithIgnoreCase(siteName, "carvana")) {
    return { id: SC_LAYOUT_CARVANA, name: "Carvana" };
  }
  return { id: SC_LAYOUT_DEFAULT, name: "Default" };
}

function putIfPresent(
  map: Record<string, unknown>,
  key: string,
  value: unknown,
) {
  if (value == null || value === "") return;
  map[key] = value;
}

function resolveContractId(payload: CreateServiceCompletionPayload): string {
  return (
    (typeof payload.contractId === "string" ? payload.contractId.trim() : "") ||
    (Array.isArray(payload.selectedRecordIds)
      ? String(payload.selectedRecordIds[0] ?? "").trim()
      : "")
  );
}

async function fetchContract(contractId: string) {
  const fields = [
    "Name",
    "Site",
    "Vendor",
    "Company_Name",
    "Operations_Associate",
    "Location_Name",
    "Site_Zip",
  ].join(",");
  const url =
    `${ZOHO_CRM_BASE}/Contracts/${encodeURIComponent(contractId)}` +
    `?fields=${encodeURIComponent(fields)}`;
  const { res, body } = await fetchZohoJson(url);
  if (!res.ok) {
    const detail = body?.message || body?.code || `HTTP ${res.status}`;
    throw new Error(String(detail));
  }
  const row = Array.isArray(body?.data) ? body.data[0] : null;
  if (!row) throw new Error("Contract not found");
  return row as Record<string, unknown>;
}

async function fetchAccount(siteId: string) {
  const fields = [
    "Name",
    "Number_of_Units_at_location",
    "Shipping_Street",
    "Shipping_State",
    "Shipping_City",
  ].join(",");
  const url =
    `${ZOHO_CRM_BASE}/Accounts/${encodeURIComponent(siteId)}` +
    `?fields=${encodeURIComponent(fields)}`;
  const { res, body } = await fetchZohoJson(url);
  if (!res.ok) {
    const detail = body?.message || body?.code || `HTTP ${res.status}`;
    throw new Error(String(detail));
  }
  const row = Array.isArray(body?.data) ? body.data[0] : null;
  if (!row) throw new Error("Site (Account) not found");
  return row as Record<string, unknown>;
}

async function buildDraft(contractId: string): Promise<ServiceCompletionDraft> {
  const contractsData = await fetchContract(contractId);
  const site = contractsData.Site as ZohoLookup;
  const siteId = lookupId(site);
  const siteName = lookupName(site);

  if (!siteId || !siteName) {
    throw new Error("Site Data Can't Be Null.");
  }

  const siteData = await fetchAccount(siteId);
  const layout = resolveLayout(siteName);

  const vendor = contractsData.Vendor as ZohoLookup;
  const company = contractsData.Company_Name as ZohoLookup;
  const operationAssociate = contractsData.Operations_Associate as ZohoLookup;

  const vendorId = lookupId(vendor);
  const companyId = lookupId(company);
  const operationAssociateId = lookupId(operationAssociate);

  const unitsRaw = siteData.Number_of_Units_at_location;
  const units =
    unitsRaw == null || unitsRaw === "" ? "" : String(unitsRaw);

  return {
    Name: `${siteName}-${formatServiceCompletionDate()}`,
    Status: "Pending",
    Layout: layout,
    Site_Number: { id: siteId, name: siteName },
    Contract: {
      id: contractId,
      name: String(contractsData.Name ?? contractId),
    },
    Vendor: vendorId ? { id: vendorId, name: lookupName(vendor) || vendorId } : null,
    Client_Company_Name: companyId
      ? { id: companyId, name: lookupName(company) || companyId }
      : null,
    Operation_Associate: operationAssociateId
      ? {
          id: operationAssociateId,
          name: lookupName(operationAssociate) || operationAssociateId,
        }
      : null,
    Location_Name:
      contractsData.Location_Name != null
        ? String(contractsData.Location_Name).trim()
        : "",
    Location_Code:
      contractsData.Site_Zip != null ? String(contractsData.Site_Zip).trim() : "",
    Location_Street:
      siteData.Shipping_Street != null
        ? String(siteData.Shipping_Street).trim()
        : "",
    Location_State:
      siteData.Shipping_State != null
        ? String(siteData.Shipping_State).trim()
        : "",
    Location_City:
      siteData.Shipping_City != null
        ? String(siteData.Shipping_City).trim()
        : "",
    Number_of_Units_at_location: units,
  };
}

function draftToZohoPayload(
  draft: ServiceCompletionDraft,
  overrides?: ServiceCompletionEditableFields,
): Record<string, unknown> {
  const name = (overrides?.Name ?? draft.Name).trim();
  const status = (overrides?.Status ?? draft.Status).trim() || "Pending";

  const dataMap: Record<string, unknown> = {
    Name: name,
    Layout: { id: draft.Layout.id },
    Site_Number: { id: draft.Site_Number.id },
    Contract: { id: draft.Contract.id },
    Status: status,
  };

  putIfPresent(
    dataMap,
    "Vendor",
    draft.Vendor?.id ? { id: draft.Vendor.id } : null,
  );
  putIfPresent(
    dataMap,
    "Client_Company_Name",
    draft.Client_Company_Name?.id ? { id: draft.Client_Company_Name.id } : null,
  );
  putIfPresent(
    dataMap,
    "Operation_Associate",
    draft.Operation_Associate?.id ? { id: draft.Operation_Associate.id } : null,
  );

  const locationName = overrides?.Location_Name ?? draft.Location_Name;
  const locationStreet = overrides?.Location_Street ?? draft.Location_Street;
  const locationCity = overrides?.Location_City ?? draft.Location_City;
  const locationState = overrides?.Location_State ?? draft.Location_State;
  const locationCode = overrides?.Location_Code ?? draft.Location_Code;
  const units =
    overrides?.Number_of_Units_at_location ?? draft.Number_of_Units_at_location;

  putIfPresent(dataMap, "Location_Name", locationName?.trim());
  putIfPresent(dataMap, "Location_Street", locationStreet?.trim());
  putIfPresent(dataMap, "Location_City", locationCity?.trim());
  putIfPresent(dataMap, "Location_State", locationState?.trim());
  putIfPresent(dataMap, "Location_Code", locationCode?.trim());

  if (units != null && String(units).trim() !== "") {
    const asNumber = Number(units);
    dataMap.Number_of_Units_at_location = Number.isFinite(asNumber)
      ? asNumber
      : String(units).trim();
  }

  return dataMap;
}

async function createServiceCompletionRecord(data: Record<string, unknown>) {
  const url = `${ZOHO_CRM_BASE}/${SERVICE_COMPLETIONS_MODULE}`;
  const { res, body } = await fetchZohoJson(url, {
    method: "POST",
    body: { data: [data], trigger: ["workflow"] },
  });

  const row = Array.isArray(body?.data) ? body.data[0] : null;
  const details = (row?.details ?? body?.details ?? {}) as Record<
    string,
    unknown
  >;
  const code = String(row?.code ?? body?.code ?? "").toUpperCase();
  const createdId =
    details?.id != null ? String(details.id)
    : row?.id != null ? String(row.id)
    : "";

  return {
    ok: Boolean(res.ok && code === "SUCCESS" && createdId),
    id: createdId || null,
    code,
    message: String(row?.message || body?.message || code || `HTTP ${res.status}`),
  };
}

/** Prefill form fields from Contract + Site (no create). */
export async function loadServiceCompletionDraft(
  contractId: string,
): Promise<CreateServiceCompletionDraftResult> {
  const id = contractId.trim();
  if (!id) {
    return { ok: false, message: "Contract id is required." };
  }

  try {
    const draft = await buildDraft(id);
    return { ok: true, draft };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to load Service Completion draft.",
    };
  }
}

/**
 * Creates a Service Completion from a Contract (Deluge-equivalent REST flow).
 * Pass `fields` to apply edits from the create form.
 */
export async function createServiceCompletionFromContract(
  payload: CreateServiceCompletionPayload,
): Promise<CreateServiceCompletionResult> {
  const contractId = resolveContractId(payload);

  if (!contractId) {
    return { ok: false, message: "Contract id is required." };
  }

  let draft: ServiceCompletionDraft;
  try {
    draft = await buildDraft(contractId);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Site Data Can't Be Null.",
    };
  }

  const dataMap = draftToZohoPayload(draft, payload.fields);
  const created = await createServiceCompletionRecord(dataMap);

  if (!created.ok || !created.id) {
    return {
      ok: false,
      message:
        created.message ||
        created.code ||
        "Failed to create Service Completion.",
    };
  }

  const openUrl = `${SERVICE_COMPLETION_ZOHO_RECORD_URL}/${created.id}`;

  return {
    ok: true,
    serviceCompletionId: created.id,
    openUrl,
    message: `Service Completion created: ${String(dataMap.Name ?? "")}`,
  };
}
