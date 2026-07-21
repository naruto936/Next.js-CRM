/** Zoho CRM custom function API name (REST) — matches send-message.html. */
export const SEND_MESSAGE_FUNCTION_NAME = "send_email_to_vendors" as const;

export type SendMessagePayload = {
  /** Current record ID (Contracts / Vendor_Invoices / ServiceCompletions). */
  recordId: string;
  messageContent: string;
  module?: string;
};

export type SendMessageResult = {
  ok: boolean;
  message?: string;
  /** Raw Zoho function output when available. */
  output?: unknown;
};
