/**
 * Calls Zoho CRM function `missinginvoicemail` (Deluge sendmail lives in Zoho).
 *
 * Important: Zoho applies function `arguments` from the **query string**,
 * not only the POST body (body-only calls leave contractIds empty → toList error).
 * That is handled inside `executeZohoCrmFunction`.
 */

import { executeZohoCrmFunction } from "@/lib/zoho";
import {
  MISSING_INVOICE_EMAIL_FUNCTION_NAME,
  type MissingInvoiceEmailPayload,
  type MissingInvoiceEmailResult,
} from "@/widgets/missing-invoice-email/types";

/** Deluge: `idList = contractIds.toList("|||")` */
const CONTRACT_IDS_DELIMITER = "|||";

function parseFunctionOutput(raw: unknown): unknown {
  if (raw == null) return raw;
  if (typeof raw !== "string") return raw;
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return trimmed;
  }
}

function asText(value: unknown) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function isEmptyToListError(text: string) {
  return /value is empty/i.test(text) && /tolist/i.test(text);
}

function functionMessage(body: Record<string, unknown>, output: unknown) {
  const outputText = asText(output).trim();
  if (outputText) return outputText;
  if (typeof body.message === "string" && body.message.trim()) {
    return body.message.trim();
  }
  return "Missing invoice emails processed.";
}

/**
 * Invokes `missinginvoicemail` with selected contract IDs as `contractIds`.
 */
export async function sendMissingInvoiceEmails(
  payload: MissingInvoiceEmailPayload,
): Promise<MissingInvoiceEmailResult> {
  const ids = [...new Set((payload.selectedRecordIds ?? []).map(String))]
    .map((id) => id.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return { ok: false, message: "Select at least one contract." };
  }

  const contractIds = ids.join(CONTRACT_IDS_DELIMITER);
  const args = { contractIds };

  let { res, body } = await executeZohoCrmFunction(
    MISSING_INVOICE_EMAIL_FUNCTION_NAME,
    args,
    { authType: "apikey" },
  );

  let code = String(body?.code ?? "").toUpperCase();
  if (
    !res.ok ||
    code === "NOT_ACTIVE" ||
    code === "AUTHENTICATION_FAILURE"
  ) {
    const fallback = await executeZohoCrmFunction(
      MISSING_INVOICE_EMAIL_FUNCTION_NAME,
      args,
      { authType: "oauth" },
    );
    res = fallback.res;
    body = fallback.body;
    code = String(body?.code ?? "").toUpperCase();
  }

  const output = parseFunctionOutput(body?.details?.output);
  const message = functionMessage(body as Record<string, unknown>, output);
  const combined = `${message}\n${asText(body)}`;

  if (isEmptyToListError(combined)) {
    return {
      ok: false,
      message:
        `Zoho did not receive contractIds. Sent ${ids.length} id(s): ${contractIds}.`,
      output,
    };
  }

  const status = String(body?.status ?? "").toLowerCase();
  const ok =
    res.ok &&
    !isEmptyToListError(message) &&
    (code === "SUCCESS" ||
      code === "" ||
      status === "success" ||
      Boolean(body?.details?.output));

  if (!ok) {
    return {
      ok: false,
      message:
        code === "NOT_ACTIVE"
          ? `Zoho function "${MISSING_INVOICE_EMAIL_FUNCTION_NAME}" REST API is inactive.`
          : message || `HTTP ${res.status}`,
      output,
    };
  }

  return { ok: true, message, output };
}
