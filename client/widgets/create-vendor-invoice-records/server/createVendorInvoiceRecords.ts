/**
 * Server-side logic for "Create Vendor Invoice records".
 *
 * Why the standalone Zoho function often returns 0/0/0 over REST:
 * - Signature is `String ids` but body does `for each id in ids` (List iteration).
 * - Zoho Embedded SDK passes EntityId as a List, so the CRM widget works.
 * - REST + API key does not coerce a JSON array into that String param the same way,
 *   so `ids` arrives empty → the loop never runs → all counts stay 0.
 *
 * This module mirrors that Deluge logic via Zoho CRM REST instead.
 */

import { fetchZohoJson, ZOHO_CRM_BASE } from "@/lib/zoho";
import type {
  CreateVendorInvoiceRecordsPayload,
  CreateVendorInvoiceRecordsResult,
} from "@/widgets/create-vendor-invoice-records/types";

export const CREATE_VENDOR_INVOICE_FUNCTION_NAME =
  "create_vendor_invoice_through_widget";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

type ZohoLookup = { id?: string; name?: string } | string | null | undefined;

function lookupId(value: ZohoLookup): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object" && value.id != null) return String(value.id).trim();
  return "";
}

function lookupName(value: ZohoLookup): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object" && value.name != null) return String(value.name).trim();
  return "";
}

function monthToMm(monthName: string): string | null {
  const index = MONTHS.findIndex(
    (m) => m.toLowerCase() === monthName.trim().toLowerCase(),
  );
  if (index < 0) return null;
  return String(index + 1).padStart(2, "0");
}

function buildInvoiceName(contractId: string, year: string, monthMm: string) {
  const last5 = contractId.length > 5 ? contractId.slice(-5) : contractId;
  const currentDay = new Date().getDate();
  return `${last5}-${year}-${monthMm}-${currentDay}`;
}

async function fetchContract(contractId: string) {
  const fields = ["Name", "Vendor", "Site"].join(",");
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

async function createVendorInvoice(data: Record<string, unknown>) {
  const url = `${ZOHO_CRM_BASE}/Vendor_Invoices`;
  const { res, body } = await fetchZohoJson(url, {
    method: "POST",
    body: { data: [data] },
  });

  const row = Array.isArray(body?.data) ? body.data[0] : null;
  const details = row?.details ?? body?.details ?? {};
  const code = String(row?.code ?? body?.code ?? "").toUpperCase();
  const createdId =
    row?.details?.id != null ? String(row.details.id)
    : row?.id != null ? String(row.id)
    : details?.id != null ? String(details.id)
    : "";

  return {
    ok: Boolean(res.ok && createdId),
    id: createdId || null,
    code,
    raw: row ?? body,
  };
}

/**
 * Creates vendor invoice records for selected contracts (Deluge-equivalent REST flow).
 */
export async function createVendorInvoiceRecords(
  payload: CreateVendorInvoiceRecordsPayload,
): Promise<CreateVendorInvoiceRecordsResult> {
  const ids = (payload.selectedRecordIds ?? [])
    .map((id) => String(id).trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return {
      ok: false,
      message: "Select at least one contract record.",
    };
  }

  const month = payload.monthOfService?.trim() ?? "";
  const year = String(payload.yearOfService ?? "").trim();

  if (!month || !year) {
    return {
      ok: false,
      message: "Please select both month and year.",
    };
  }

  const monthMm = monthToMm(month);
  if (!monthMm) {
    return {
      ok: false,
      message: "Invalid month of service.",
    };
  }

  let recordCreated = 0;
  let recordNotCreated = 0;
  let duplicateCount = 0;
  const errors: string[] = [];

  for (const id of ids) {
    try {
      const contractsData = await fetchContract(id);
      const contractName = String(contractsData.Name ?? id);
      const vendor = contractsData.Vendor as ZohoLookup;
      const vendorId = lookupId(vendor);
      const vendorName = lookupName(vendor);

      if (!vendorId || !vendorName) {
        recordNotCreated += 1;
        errors.push(`Vendor not found for Contract : ${contractName}`);
        continue;
      }

      const dataMap: Record<string, unknown> = {
        Vendor: { id: vendorId },
        Name: buildInvoiceName(id, year, monthMm),
        Vendor_Contract: { id },
        Month_of_Service: month,
        Year_of_Service: year,
        No_Invoice_needed: true,
        Status: "Open",
        Created_from_Widget: true,
      };

      const siteId = lookupId(contractsData.Site as ZohoLookup);
      if (siteId) {
        dataMap.Site = { id: siteId };
      }

      const created = await createVendorInvoice(dataMap);

      if (created.id) {
        recordCreated += 1;
      } else if (created.code === "DUPLICATE_DATA") {
        duplicateCount += 1;
        errors.push(`Duplicate invoice found for Contract : ${contractName}`);
      } else {
        recordNotCreated += 1;
        errors.push(
          `Failed to create invoice for Contract : ${contractName} — Response: ${JSON.stringify(created.raw)}`,
        );
      }
    } catch (err) {
      recordNotCreated += 1;
      errors.push(
        `Error for Contract ID: ${id} — ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return {
    ok: true,
    hasCounts: true,
    message: "Execution Result",
    recordCreated,
    recordNotCreated,
    duplicateCount,
    errors,
  };
}
