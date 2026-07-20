/**
 * Activate Vendors — Deluge-equivalent via Zoho CRM REST.
 *
 * Why we do not call `activating_vendors_from_contracts` over REST:
 * that function is a CRM *button* with Argument Mapping
 * `contract_ids = Contracts - Contract Id`. Zoho only fills that from the
 * CRM UI context. REST execute leaves `contract_ids` empty → toList error.
 *
 * This mirrors:
 *   string button.activating_vendors_from_contracts(String contract_ids)
 */

import { fetchZohoJson, ZOHO_CRM_BASE } from "@/lib/zoho";
import type {
  ActivateVendorsPayload,
  ActivateVendorsResult,
} from "@/widgets/activate-vendors/types";

type ZohoLookup = { id?: string; name?: string } | string | null | undefined;

type Ymd = { year: number; month: number; day: number };

function lookupId(value: ZohoLookup): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object" && value.id != null) {
    return String(value.id).trim();
  }
  return "";
}

/** Parse Zoho date (`YYYY-MM-DD` or datetime) → calendar parts (month 1–12). */
function parseYmd(value: unknown): Ymd | null {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (![year, month, day].every((n) => Number.isFinite(n))) return null;
  return { year, month, day };
}

function todayYmd(): Ymd {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

/**
 * Same date gates as the Deluge button function.
 * Returns whether the vendor/contract should be activated, plus a skip reason.
 */
function evaluateActivationWindow(
  start: Ymd,
  end: Ymd,
  today: Ymd,
): { update: boolean; skipMessage: string } {
  let checkEnd = false;
  let update = false;
  let skipMessage = "";

  if (today.year < start.year) {
    skipMessage = "Cannot be activated because the start date is later.";
  } else if (today.year >= start.year) {
    if (today.month > start.month) {
      checkEnd = true;
    } else if (today.month === start.month) {
      if (today.day >= start.day) {
        checkEnd = true;
      } else {
        skipMessage = "Cannot be activated because the start date is later.";
      }
    } else {
      skipMessage = "Cannot be activated because the start date is later.";
    }
  }

  if (checkEnd) {
    if (today.year < end.year) {
      update = true;
    } else if (today.year === end.year) {
      if (today.month < end.month) {
        update = true;
      } else if (today.month === end.month) {
        if (today.day <= end.day) {
          update = true;
        } else {
          skipMessage = "End Date Has Passed.";
        }
      } else {
        skipMessage = "End Date Has Passed.";
      }
    } else {
      skipMessage = "End Date Has Passed.";
    }
  }

  return { update, skipMessage };
}

async function fetchContract(contractId: string) {
  const fields = [
    "Name",
    "Vendor",
    "Contract_Start_Date",
    "Contract_End_Date",
    "Contract_Status",
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

async function updateModuleRecord(
  module: string,
  id: string,
  fields: Record<string, unknown>,
) {
  const { res, body } = await fetchZohoJson(
    `${ZOHO_CRM_BASE}/${encodeURIComponent(module)}`,
    {
      method: "PUT",
      body: { data: [{ id, ...fields }], trigger: ["workflow"] },
    },
  );
  const result = Array.isArray(body?.data) ? body.data[0] : null;
  const code = String(result?.code ?? body?.code ?? "").toUpperCase();
  const modifiedTime =
    result?.details?.Modified_Time ?? result?.Modified_Time ?? null;
  const ok = Boolean(res.ok && (code === "SUCCESS" || modifiedTime));
  if (!ok) {
    const detail =
      result?.message ||
      body?.message ||
      result?.code ||
      body?.code ||
      `HTTP ${res.status}`;
    throw new Error(String(detail));
  }
  return result;
}

/**
 * Activates vendors (and contracts) for selected contract IDs when today
 * falls within Contract_Start_Date … Contract_End_Date.
 */
export async function activateVendorsFromContracts(
  payload: ActivateVendorsPayload,
): Promise<ActivateVendorsResult> {
  const ids = [...new Set((payload.selectedRecordIds ?? []).map(String))]
    .map((id) => id.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return { ok: false, message: "Select at least one contract." };
  }

  const today = todayYmd();
  const lines: string[] = [];
  let updatedCount = 0;
  let skippedCount = 0;

  for (const id of ids) {
    try {
      const contract = await fetchContract(id);
      const start = parseYmd(contract.Contract_Start_Date);
      const end = parseYmd(contract.Contract_End_Date);

      if (!start || !end) {
        skippedCount += 1;
        lines.push(
          `${id} - Missing Contract_Start_Date or Contract_End_Date.`,
        );
        continue;
      }

      const { update, skipMessage } = evaluateActivationWindow(
        start,
        end,
        today,
      );

      if (!update) {
        skippedCount += 1;
        lines.push(
          `${id} - ${skipMessage || "Cannot be activated for the current date."}`,
        );
        continue;
      }

      const vendorId = lookupId(contract.Vendor as ZohoLookup);
      if (!vendorId) {
        skippedCount += 1;
        lines.push(`${id} - No Vendor linked on the contract.`);
        continue;
      }

      await updateModuleRecord("Vendors", vendorId, { Status: "Active" });
      await updateModuleRecord("Contracts", id, {
        Contract_Status: "Active",
      });

      updatedCount += 1;
      lines.push(`${id} - Record Updated`);
    } catch (error) {
      skippedCount += 1;
      lines.push(
        `${id} - ${error instanceof Error ? error.message : "Update failed."}`,
      );
    }
  }

  const message = lines.join("\n");
  const ok = updatedCount > 0;

  return {
    ok,
    message:
      message ||
      (ok
        ? "Vendors activation completed."
        : "No contracts were eligible for activation."),
    output: { updatedCount, skippedCount, total: ids.length },
  };
}
