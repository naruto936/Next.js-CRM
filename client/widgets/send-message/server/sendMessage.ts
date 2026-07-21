/**
 * Calls Zoho CRM function `send_email_to_vendors` (Deluge sendmail in Zoho).
 *
 * Mirrors send-message.html:
 *   ZOHO.CRM.FUNCTIONS.execute("send_email_to_vendors", {
 *     arguments: { id: EntityId, message_content }
 *   })
 *
 * EntityId from Zoho PageLoad is an array; Deluge does `id.get(0)`, so we
 * pass `id` as a one-element array.
 */

import { executeZohoCrmFunction } from "@/lib/zoho";
import {
  SEND_MESSAGE_FUNCTION_NAME,
  type SendMessagePayload,
  type SendMessageResult,
} from "@/widgets/send-message/types";

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

function functionMessage(body: Record<string, unknown>, output: unknown) {
  const outputText = asText(output).trim();
  if (outputText) return outputText;
  if (typeof body.message === "string" && body.message.trim()) {
    return body.message.trim();
  }
  const details = body.details as Record<string, unknown> | undefined;
  if (typeof details?.message === "string" && details.message.trim()) {
    return details.message.trim();
  }
  return "Message Sent Successfully";
}

/**
 * Invokes `send_email_to_vendors` with record id + message body.
 */
export async function sendVendorMessage(
  payload: SendMessagePayload,
): Promise<SendMessageResult> {
  const recordId = String(payload.recordId ?? "").trim();
  const messageContent = String(payload.messageContent ?? "").trim();

  if (!recordId) {
    return { ok: false, message: "Record ID is required." };
  }
  if (!messageContent) {
    return { ok: false, message: "Please enter a message!" };
  }

  // Match Zoho embedded widget: EntityId is an array; Deluge uses id.get(0).
  const args = {
    id: [recordId],
    message_content: messageContent,
  };

  let { res, body } = await executeZohoCrmFunction(
    SEND_MESSAGE_FUNCTION_NAME,
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
      SEND_MESSAGE_FUNCTION_NAME,
      args,
      { authType: "oauth" },
    );
    res = fallback.res;
    body = fallback.body;
    code = String(body?.code ?? "").toUpperCase();
  }

  const output = parseFunctionOutput(body?.details?.output);
  const status = String(body?.status ?? "").toLowerCase();
  const codeLower = String(body?.code ?? "").toLowerCase();

  // HTML checks data.code === "success" | "failure"
  if (codeLower === "failure" || status === "failure" || code === "FAILURE") {
    return {
      ok: false,
      message: functionMessage(body as Record<string, unknown>, output),
      output,
    };
  }

  const ok =
    res.ok &&
    (code === "SUCCESS" ||
      code === "" ||
      codeLower === "success" ||
      status === "success" ||
      body?.details?.output != null);

  if (!ok) {
    return {
      ok: false,
      message:
        code === "NOT_ACTIVE"
          ? `Zoho function "${SEND_MESSAGE_FUNCTION_NAME}" REST API is inactive.`
          : functionMessage(body as Record<string, unknown>, output) ||
            `HTTP ${res.status}`,
      output,
    };
  }

  return {
    ok: true,
    message: "Message Sent Successfully",
    output,
  };
}
