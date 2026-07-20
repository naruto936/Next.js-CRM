/** Zoho CRM custom function API name (REST). */
export const MISSING_INVOICE_EMAIL_FUNCTION_NAME =
  "missinginvoicemail" as const;

export type MissingInvoiceEmailPayload = {
  selectedRecordIds: string[];
  module?: string;
};

export type MissingInvoiceEmailResult = {
  ok: boolean;
  message?: string;
  /** Raw Zoho function output when available. */
  output?: unknown;
};
