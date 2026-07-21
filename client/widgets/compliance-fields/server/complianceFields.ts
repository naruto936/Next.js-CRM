/**
 * Compliance Fields — load/update vendor compliance data linked to a Contract.
 * Mirrors complince.js (Zoho widget).
 */

import { fetchZohoJson, fetchZohoRecordById, ZOHO_CRM_BASE } from "@/lib/zoho";
import type {
  ComplianceFieldsForm,
  ComplianceFieldsLoadResult,
  ComplianceFieldsSavePayload,
  ComplianceFieldsSaveResult,
} from "@/widgets/compliance-fields/types";

type ZohoLookup = { id?: string; name?: string } | string | null | undefined;

const VENDOR_FIELDS = [
  "Vendor_Name",
  "W9_URL",
  "COI_Expiration",
  "Workers_Compensation",
  "CF_Legal_Name_Must_Be_Same_As_W9",
  "Bank_ACH",
] as const;

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

/** Convert Zoho date to yyyy-mm-dd for <input type="date">. */
export function toInputDate(dateValue: unknown): string {
  if (dateValue == null || dateValue === "") return "";
  const raw = String(dateValue).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Normalize form date to Zoho API yyyy-mm-dd. */
export function toZohoDate(input: string): string {
  const trimmed = String(input ?? "").trim();
  if (!trimmed) return "";
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (iso) return trimmed;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Load vendor compliance fields for the Vendor linked to a Contract.
 */
export async function loadComplianceFields(
  contractId: string,
): Promise<ComplianceFieldsLoadResult> {
  const id = String(contractId ?? "").trim();
  if (!id) {
    return { ok: false, message: "Contract id is required." };
  }

  const contract = await fetchZohoRecordById("Contracts", id, [
    "Name",
    "Vendor",
    "Vendor_Name",
  ]);

  const vendorLookup = (contract.Vendor ?? contract.Vendor_Name) as ZohoLookup;
  const vendorId = lookupId(vendorLookup);
  if (!vendorId) {
    return { ok: false, message: "No vendor linked to this contract." };
  }

  const vendor = await fetchZohoRecordById("Vendors", vendorId, [
    ...VENDOR_FIELDS,
  ]);

  return {
    ok: true,
    vendorId,
    vendorName:
      asText(vendor.Vendor_Name) || lookupName(vendorLookup) || vendorId,
    fields: {
      w9Url: asText(vendor.W9_URL),
      coiExpiration: toInputDate(vendor.COI_Expiration),
      workersComp: asText(vendor.Workers_Compensation),
      legalName: asText(vendor.CF_Legal_Name_Must_Be_Same_As_W9),
      bankAch: asText(vendor.Bank_ACH),
    },
  };
}

/**
 * Update vendor compliance fields (same API names as complince.js).
 */
export async function saveComplianceFields(
  payload: ComplianceFieldsSavePayload,
): Promise<ComplianceFieldsSaveResult> {
  const vendorId = String(payload.vendorId ?? "").trim();
  if (!vendorId) {
    return { ok: false, message: "Vendor id is required." };
  }

  const fields = payload.fields ?? {
    w9Url: "",
    coiExpiration: "",
    workersComp: "",
    legalName: "",
    bankAch: "",
  };

  const { res, body } = await fetchZohoJson(`${ZOHO_CRM_BASE}/Vendors`, {
    method: "PUT",
    body: {
      data: [
        {
          id: vendorId,
          W9_URL: fields.w9Url || "",
          COI_Expiration: toZohoDate(fields.coiExpiration),
          Workers_Compensation: fields.workersComp || "",
          CF_Legal_Name_Must_Be_Same_As_W9: fields.legalName || "",
          Bank_ACH: fields.bankAch || "",
        },
      ],
      trigger: ["workflow"],
    },
  });

  const result = Array.isArray(body?.data) ? body.data[0] : null;
  const code = String(result?.code ?? body?.code ?? "").toUpperCase();
  const ok =
    Boolean(res.ok) &&
    (code === "SUCCESS" || Boolean(result?.details?.id) || code === "");

  if (!ok) {
    const detail =
      result?.message ||
      body?.message ||
      result?.code ||
      body?.code ||
      `HTTP ${res.status}`;
    return { ok: false, message: String(detail) };
  }

  return { ok: true, message: "Vendor compliance updated successfully." };
}
