import type { CrmWidgetDefinition } from "@/widgets/types";

/** Button label in the contracts list selection toolbar. */
export const MISSING_INVOICE_EMAIL_BUTTON_LABEL =
  "Missing Invoice Email" as const;

/** Widget modal title. */
export const MISSING_INVOICE_EMAIL_WIDGET_NAME =
  "Missing Invoice Email" as const;

export const MISSING_INVOICE_EMAIL_WIDGET = {
  id: "missing-invoice-email",
  name: MISSING_INVOICE_EMAIL_WIDGET_NAME,
  buttonLabel: MISSING_INVOICE_EMAIL_BUTTON_LABEL,
} as const satisfies CrmWidgetDefinition;

export type {
  MissingInvoiceEmailPayload,
  MissingInvoiceEmailResult,
} from "./types";

export { MISSING_INVOICE_EMAIL_FUNCTION_NAME } from "./types";

export { MissingInvoiceEmailWidget } from "./ui/MissingInvoiceEmailWidget";
