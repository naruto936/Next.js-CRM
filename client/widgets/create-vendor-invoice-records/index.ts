import type { CrmWidgetDefinition } from "@/widgets/types";

/** Button label in the contracts list selection toolbar. */
export const CREATE_NO_INVOICE_NEEDED_BUTTON_LABEL =
  "Create No Invoice Needed" as const;

/** Zoho / CRM widget display name. */
export const CREATE_VENDOR_INVOICE_RECORDS_WIDGET_NAME =
  "Create Vendor Invoice records" as const;

export const CREATE_VENDOR_INVOICE_RECORDS_WIDGET = {
  id: "create-vendor-invoice-records",
  name: CREATE_VENDOR_INVOICE_RECORDS_WIDGET_NAME,
  buttonLabel: CREATE_NO_INVOICE_NEEDED_BUTTON_LABEL,
} as const satisfies CrmWidgetDefinition;

export type {
  CreateVendorInvoiceFunctionOutput,
  CreateVendorInvoiceRecordsPayload,
  CreateVendorInvoiceRecordsResult,
} from "./types";

export { CreateVendorInvoiceRecordsWidget } from "./ui/CreateVendorInvoiceRecordsWidget";
