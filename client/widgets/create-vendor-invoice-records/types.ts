import type { WidgetOpenContext } from "@/widgets/types";

export type CreateVendorInvoiceRecordsPayload = WidgetOpenContext & {
  monthOfService: string;
  yearOfService: number;
};

/** Parsed output from create_vendor_invoice_through_widget Deluge function. */
export type CreateVendorInvoiceFunctionOutput = {
  record_created?: number;
  record_not_created?: number;
  duplicate_count?: number;
  errors?: string[];
  error?: string;
};

export type CreateVendorInvoiceRecordsResult = {
  ok: boolean;
  message?: string;
  /** True when function returned the counts table payload. */
  hasCounts?: boolean;
  recordCreated?: number;
  recordNotCreated?: number;
  duplicateCount?: number;
  errors?: string[];
};
