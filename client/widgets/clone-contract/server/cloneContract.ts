/**
 * Clone Contract — port of widget.html / index.js + CreatePOfromContract.dg.
 *
 * Flow:
 * 1) Validate vendor (COI + contract end + InActive Incumbent gate)
 * 2) Copy source contract with incremented Name and new Vendor
 * 3) Reset invoice / PO fields
 * 4) Execute CreatePOfromContract for the new record
 */

import {
  escapeZohoCriteriaValue,
  executeZohoCrmFunction,
  fetchZohoJson,
  fetchZohoRecordById,
  getZohoModuleSearchUrl,
  ZOHO_CRM_BASE,
} from "@/lib/zoho";
import {
  COI_COMPLIANCE_MESSAGE,
  CREATE_PO_FROM_CONTRACT_FUNCTION,
  type CloneContractContext,
  type CloneContractPayload,
  type CloneContractResult,
  type VendorSearchResult,
  type VendorSuggestion,
} from "@/widgets/clone-contract/types";

type ZohoLookup = { id?: string; name?: string } | string | null | undefined;

const READ_ONLY_TOP_LEVEL = new Set([
  "id",
  "Created_Time",
  "Modified_Time",
  "Created_By",
  "Modified_By",
  "Last_Activity_Time",
  "Unsubscribed_Mode",
  "Unsubscribed_Time",
  "Record_Status__s",
  "Locked__s",
  "Tag",
]);

/**
 * Contract lookups that often fail Zoho lookup filters on insert.
 * Vendor is intentionally excluded — clone requires the new Vendor.
 * Do NOT include mandatory fields (e.g. Sales_Associate) — stripping them causes MANDATORY_NOT_FOUND.
 */
const LOOKUP_FILTER_DROP_ORDER = [
  "Sales_Owner",
  "Ops_Owner",
  "Sales_Manager",
  "Contract_Owner",
  "Owner",
  "Site",
  "Company_Name",
  "SOW_Name",
  "SOW",
  "Client_Contract",
  "Our_Services_SubForm",
] as const;

function isLookupFilterError(code: string, message: string) {
  return (
    code === "FILTER_CRITERIA_NOT_SATISFIED" ||
    /lookup filter criteria/i.test(message)
  );
}

type ZohoErrorPath = {
  label: string;
  topLevel?: string;
  subform?: string;
  rowIndex?: number;
  nestedField?: string;
};

/**
 * Parse Zoho details.json_path, e.g.
 *   $.data[0].Our_Services_SubForm[2].OurServices.id
 *   $.data[0].Sales_Owner
 */
function parseZohoErrorPath(jsonPath: unknown): ZohoErrorPath | null {
  const raw = String(jsonPath ?? "").trim();
  if (!raw) return null;

  const rest = raw.replace(/^\$\.data\[\d+\]\./, "").replace(/\.id$/, "");
  const subformMatch = rest.match(
    /^([A-Za-z0-9_]+)\[(\d+)\](?:\.([A-Za-z0-9_]+))?$/,
  );
  if (subformMatch) {
    return {
      label: `${subformMatch[1]}[${subformMatch[2]}]${
        subformMatch[3] ? `.${subformMatch[3]}` : ""
      }`,
      subform: subformMatch[1],
      rowIndex: Number(subformMatch[2]),
      nestedField: subformMatch[3] || undefined,
    };
  }

  const top = rest.match(/^([A-Za-z0-9_]+)$/);
  if (top && top[1] !== "id") {
    return { label: top[1], topLevel: top[1] };
  }

  return null;
}

function deepClonePayload(
  value: Record<string, unknown>,
): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

/**
 * Strip the failing lookup using json_path / api_name.
 * For subform product lookups that fail filter criteria, remove that whole row
 * (clearing OurServices alone leaves an invalid / empty service line).
 */
function stripByZohoError(
  payload: Record<string, unknown>,
  details: Record<string, unknown> | null | undefined,
  apiName: string,
): string | null {
  const path = parseZohoErrorPath(details?.json_path);

  if (path?.subform && typeof path.rowIndex === "number") {
    const rows = payload[path.subform];
    if (!Array.isArray(rows) || path.rowIndex < 0 || path.rowIndex >= rows.length) {
      return null;
    }

    // Product / nested lookup failed filter → drop that subform row.
    rows.splice(path.rowIndex, 1);
    if (rows.length === 0) {
      delete payload[path.subform];
    }
    return path.label;
  }

  const key =
    path?.topLevel ||
    (apiName && apiName !== "id" ? apiName : "") ||
    "";

  if (!key || key === "Vendor" || key === "Name") return null;
  if (!(key in payload)) return null;

  delete payload[key];
  return key;
}

/**
 * Fallback strip when Zoho omits a usable json_path (never strips mandatory Sales_Associate).
 */
function stripFallbackLookup(payload: Record<string, unknown>): string | null {
  const fallback = LOOKUP_FILTER_DROP_ORDER.find((key) => key in payload);
  if (!fallback) return null;
  delete payload[fallback];
  return fallback;
}

function lookupId(value: ZohoLookup): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object" && value.id != null) {
    return String(value.id).trim();
  }
  return "";
}

function lookupName(value: ZohoLookup): string {
  if (value == null || typeof value !== "object") return "";
  return String(value.name ?? "").trim();
}

function asText(value: unknown) {
  if (value == null || value === "") return "";
  return String(value);
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function parseDay(raw: unknown): Date | null {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return null;
  }
  const d = new Date(String(raw));
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

/** True when vendor has a parseable COI date strictly before today. */
export function isVendorCoiExpired(vendor: Record<string, unknown>): boolean {
  const day = parseDay(vendor.COI_Expiration ?? vendor.COI_Expiration_Date);
  if (!day) return false;
  return day < startOfToday();
}

/** True when contract Contract_End_Date is strictly before today. */
export function isContractEndDateExpired(endRaw: unknown): boolean {
  const day = parseDay(endRaw);
  if (!day) return false;
  return day < startOfToday();
}

export function incrementContractName(name: string): string {
  const match = name.match(/(.*?)(-(\d+))?$/);
  const baseName = (match?.[1] ?? name).trim();
  const currentNumber = match?.[3] ? parseInt(match[3], 10) : 0;
  return `${baseName}-${currentNumber + 1}`;
}

/**
 * Next available Name by scanning contracts with the same base (index.js).
 */
export async function computeNextContractName(
  currentName: string,
): Promise<string> {
  const baseMatch = currentName.match(/(.*?)(-(\d+))?$/);
  const baseName = (baseMatch?.[1] ? baseMatch[1] : currentName).trim();
  if (!baseName) return incrementContractName(currentName);

  try {
    const criteria = `(Name:starts_with:${escapeZohoCriteriaValue(baseName)})`;
    const url = getZohoModuleSearchUrl("Contracts", {
      criteria,
      fields: "Name",
      perPage: 200,
    });
    const { res, body } = await fetchZohoJson(url);
    if (!res.ok) {
      return incrementContractName(currentName);
    }

    const names = (Array.isArray(body?.data) ? body.data : [])
      .map((r: { Name?: unknown }) => asText(r?.Name))
      .filter(Boolean);

    let maxSuffix = 0;
    const exactBase = baseName;
    const suffixRe = new RegExp(
      `^${baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d+)$`,
    );

    for (const n of names) {
      if (n === exactBase) {
        maxSuffix = Math.max(maxSuffix, 0);
        continue;
      }
      const m = n.match(suffixRe);
      if (m) {
        const num = parseInt(m[1], 10);
        if (!Number.isNaN(num)) maxSuffix = Math.max(maxSuffix, num);
      }
    }

    return `${baseName}-${maxSuffix + 1}`;
  } catch (error) {
    console.warn("computeNextContractName fallback:", error);
    return incrementContractName(currentName);
  }
}

function sanitizeForInsert(
  contract: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(contract)) {
    if (!key || key.startsWith("$")) continue;
    if (READ_ONLY_TOP_LEVEL.has(key)) continue;

    if (Array.isArray(value)) {
      out[key] = value.map((row) => {
        if (!row || typeof row !== "object" || Array.isArray(row)) return row;
        const cleaned: Record<string, unknown> = {};
        for (const [rk, rv] of Object.entries(row as Record<string, unknown>)) {
          if (rk === "id" || rk.startsWith("$")) continue;
          cleaned[rk] = rv;
        }
        return cleaned;
      });
      continue;
    }

    out[key] = value;
  }

  return out;
}

async function fetchFullContract(
  contractId: string,
): Promise<Record<string, unknown>> {
  // Omit fields → Zoho returns all permitted fields (same as SDK getRecord).
  const url = `${ZOHO_CRM_BASE}/Contracts/${encodeURIComponent(contractId)}`;
  const { res, body } = await fetchZohoJson(url);
  if (!res.ok) {
    const detail = body?.message || body?.code || `HTTP ${res.status}`;
    throw new Error(String(detail));
  }
  const row = Array.isArray(body?.data) ? body.data[0] : null;
  if (!row || typeof row !== "object") {
    throw new Error("Contract not found");
  }
  return row as Record<string, unknown>;
}

export async function loadCloneContractContext(
  contractId: string,
): Promise<CloneContractContext> {
  const id = String(contractId ?? "").trim();
  if (!id) {
    return { ok: false, message: "Contract id is required." };
  }

  const contract = await fetchZohoRecordById("Contracts", id, [
    "Name",
    "Vendor",
    "Vendor_Name",
    "Contract_End_Date",
  ]);

  const vendorLookup = (contract.Vendor ?? contract.Vendor_Name) as ZohoLookup;

  return {
    ok: true,
    contractId: id,
    contractName: asText(contract.Name) || id,
    currentVendorId: lookupId(vendorLookup),
    currentVendorName:
      lookupName(vendorLookup) || asText(contract.Vendor_Name) || "",
    contractEndDate:
      contract.Contract_End_Date == null ?
        null
      : asText(contract.Contract_End_Date) || null,
  };
}

export async function searchVendorsForClone(
  query: string,
): Promise<VendorSearchResult> {
  const q = String(query ?? "").trim();
  if (q.length < 2) {
    return { ok: true, vendors: [] };
  }

  const criteria = `(Vendor_Name:starts_with:${escapeZohoCriteriaValue(q)})`;
  const url = getZohoModuleSearchUrl("Vendors", {
    criteria,
    fields: "Vendor_Name",
    perPage: 25,
  });

  const { res, body } = await fetchZohoJson(url);
  if (!res.ok) {
    // Empty search often returns 204 / no data — treat as no matches.
    if (res.status === 204 || body?.code === "NO_DATA") {
      return { ok: true, vendors: [] };
    }
    const detail = body?.message || body?.code || `HTTP ${res.status}`;
    return { ok: false, message: String(detail), vendors: [] };
  }

  const rows = Array.isArray(body?.data) ? body.data : [];
  const vendors: VendorSuggestion[] = [];
  for (const row of rows) {
    const id = asText(row?.id);
    const name = asText(row?.Vendor_Name);
    if (id && name) vendors.push({ id, name });
  }

  return { ok: true, vendors };
}

async function validateVendorForClone(
  vendorId: string,
  contractEndDate: unknown,
): Promise<{ ok: boolean; message?: string; persistent?: boolean }> {
  const vendor = await fetchZohoRecordById("Vendors", vendorId, [
    "Vendor_Name",
    "Status",
    "Vendor_Status",
    "COI_Expiration",
    "COI_Expiration_Date",
    "W9_Expiration",
    "Workers_Compensation_Expiration",
  ]);

  const vendorStatus = asText(vendor.Status || vendor.Vendor_Status);
  const isIncumbent = vendorStatus === "InActive Incumbent";
  const coiExpired = isVendorCoiExpired(vendor);
  const contractEndExpired = isContractEndDateExpired(contractEndDate);

  if (coiExpired && contractEndExpired && isIncumbent) {
    return { ok: false, message: COI_COMPLIANCE_MESSAGE, persistent: true };
  }

  return { ok: true };
}

async function createPurchaseOrderForContract(newContractId: string) {
  const args = { ContractID: newContractId };

  let { res, body } = await executeZohoCrmFunction(
    CREATE_PO_FROM_CONTRACT_FUNCTION,
    args,
    { authType: "apikey" },
  );

  let code = String(body?.code ?? "").toUpperCase();
  if (!res.ok || code === "NOT_ACTIVE" || code === "AUTHENTICATION_FAILURE") {
    const fallback = await executeZohoCrmFunction(
      CREATE_PO_FROM_CONTRACT_FUNCTION,
      args,
      { authType: "oauth" },
    );
    res = fallback.res;
    body = fallback.body;
    code = String(body?.code ?? "").toUpperCase();
  }

  // PO creation is best-effort for clone success (same as widget: await then navigate).
  // Surface hard auth failures only.
  if (!res.ok && (code === "AUTHENTICATION_FAILURE" || code === "INVALID_TOKEN")) {
    const detail = body?.message || body?.code || `HTTP ${res.status}`;
    throw new Error(`CreatePOfromContract failed: ${detail}`);
  }

  return body;
}

/**
 * Clone the contract onto a new vendor and trigger PO creation.
 */
export async function cloneContractWithNewVendor(
  payload: CloneContractPayload,
): Promise<CloneContractResult> {
  const contractId = String(payload.contractId ?? "").trim();
  const vendorId = String(payload.vendorId ?? "").trim();
  const vendorName = String(payload.vendorName ?? "").trim();

  if (!contractId) {
    return { ok: false, message: "Contract id is required." };
  }
  if (!vendorId) {
    return { ok: false, message: "Please select a vendor first" };
  }

  const source = await fetchFullContract(contractId);
  const currentVendorId = lookupId(source.Vendor as ZohoLookup);

  if (vendorId === currentVendorId) {
    return {
      ok: false,
      message: "This vendor is already assigned to this contract",
    };
  }

  const validation = await validateVendorForClone(
    vendorId,
    source.Contract_End_Date,
  );
  if (!validation.ok) {
    return {
      ok: false,
      message: validation.message ?? COI_COMPLIANCE_MESSAGE,
      persistent: validation.persistent === true,
    };
  }

  const currentName = asText(source.Name) || "Contract";
  const updatedName = await computeNextContractName(currentName);
  const sanitized = sanitizeForInsert(source);

  const createData: Record<string, unknown> = {
    ...sanitized,
    Name: updatedName,
    Vendor: { id: vendorId },
    Purchase_Order_URL: null,
    Late_Invoice_Count: 0,
    Total_Invoices: 0,
    Last_Late_Invoice_Month: null,
  };

  const insert = await insertContractStrippingLookupFilters(createData);
  if (!insert.ok || !insert.id) {
    return {
      ok: false,
      message: insert.message || "Failed to update contract",
      failedField: insert.failedField,
      strippedFields: insert.strippedFields,
    };
  }

  const newContractId = insert.id;
  const strippedNote =
    insert.strippedFields.length > 0 ?
      ` (cleared lookup filter fields: ${insert.strippedFields.join(", ")})`
    : "";

  try {
    await createPurchaseOrderForContract(newContractId);
  } catch (error) {
    console.error("CreatePOfromContract failed:", error);
    // Contract already created — still succeed with a note.
    return {
      ok: true,
      newContractId,
      newContractName: updatedName,
      strippedFields: insert.strippedFields,
      message: `New contract created with vendor ${vendorName}, but PO creation failed.${strippedNote}`,
    };
  }

  return {
    ok: true,
    newContractId,
    newContractName: updatedName,
    strippedFields: insert.strippedFields,
    message: `New contract created with vendor ${vendorName}${strippedNote}`,
  };
}

/**
 * POST Contracts; on FILTER_CRITERIA_NOT_SATISFIED drop the failing lookup and retry.
 * Uses details.json_path (e.g. Our_Services_SubForm[2].OurServices) — api_name is often just "id".
 * Never strips Vendor. Never strips mandatory Sales_Associate via fallback.
 */
async function insertContractStrippingLookupFilters(
  initial: Record<string, unknown>,
): Promise<{
  ok: boolean;
  id: string;
  message: string;
  failedField?: string;
  strippedFields: string[];
}> {
  const payload = deepClonePayload(initial);
  const strippedFields: string[] = [];
  let lastMessage = "Failed to create contract";
  let lastFailedField = "";

  // Subform rows can fail one-by-one; allow enough retries.
  const maxAttempts = 25;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const { res, body } = await fetchZohoJson(`${ZOHO_CRM_BASE}/Contracts`, {
      method: "POST",
      body: { data: [payload], trigger: ["workflow"] },
    });

    const row = Array.isArray(body?.data) ? body.data[0] : null;
    const code = String(row?.code ?? body?.code ?? "").toUpperCase();
    const message = String(
      row?.message || body?.message || code || `HTTP ${res.status}`,
    );
    lastMessage = message;

    const createdId =
      row?.details?.id != null ? String(row.details.id)
      : row?.id != null ? String(row.id)
      : "";

    if (res.ok && code === "SUCCESS" && createdId) {
      if (strippedFields.length > 0) {
        console.warn(
          "[clone-contract] created after stripping lookup filters:",
          strippedFields,
        );
      }
      return {
        ok: true,
        id: createdId,
        message,
        strippedFields,
      };
    }

    const details = (row?.details ?? body?.details ?? null) as
      | Record<string, unknown>
      | null;
    const apiName = String(details?.api_name ?? "").trim();
    const pathInfo = parseZohoErrorPath(details?.json_path);
    const fieldLabel = pathInfo?.label || apiName || undefined;

    if (!isLookupFilterError(code, message)) {
      console.error("[clone-contract] insert failed:", {
        code,
        message,
        api_name: apiName || undefined,
        json_path: details?.json_path,
        details,
      });
      return {
        ok: false,
        id: "",
        message: fieldLabel ? `${message} (field: ${fieldLabel})` : message,
        failedField: fieldLabel,
        strippedFields,
      };
    }

    lastFailedField = fieldLabel || apiName;

    console.warn("[clone-contract] lookup filter rejected field:", {
      attempt: attempt + 1,
      api_name: apiName || "(missing)",
      json_path: details?.json_path,
      field: fieldLabel,
      code,
      message,
    });

    // Vendor must stay — user chose it; tell them to pick a compliant vendor.
    if (
      apiName === "Vendor" ||
      pathInfo?.topLevel === "Vendor" ||
      pathInfo?.label === "Vendor"
    ) {
      return {
        ok: false,
        id: "",
        message:
          "Selected vendor does not match the Vendor lookup filter criteria in Zoho. Choose a vendor that satisfies that filter (e.g. Active status).",
        failedField: "Vendor",
        strippedFields,
      };
    }

    const dropKey =
      stripByZohoError(payload, details, apiName) ||
      // Only use coarse fallback when json_path was missing / unusable
      (!pathInfo ? stripFallbackLookup(payload) : null);

    if (!dropKey) {
      console.error(
        "[clone-contract] lookup filter error but no field left to strip",
        {
          api_name: apiName,
          json_path: details?.json_path,
          code,
          message,
        },
      );
      return {
        ok: false,
        id: "",
        message: fieldLabel ? `${message} (field: ${fieldLabel})` : message,
        failedField: fieldLabel || lastFailedField || undefined,
        strippedFields,
      };
    }

    strippedFields.push(dropKey);
  }

  return {
    ok: false,
    id: "",
    message: lastFailedField ?
      `${lastMessage} (field: ${lastFailedField})`
    : lastMessage,
    failedField: lastFailedField || undefined,
    strippedFields,
  };
}
