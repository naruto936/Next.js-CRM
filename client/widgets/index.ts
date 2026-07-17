import type { CrmWidgetDefinition } from "@/widgets/types";
import { CREATE_VENDOR_INVOICE_RECORDS_WIDGET } from "@/widgets/create-vendor-invoice-records";

/**
 * Registry of list-action widgets.
 * Add new widgets here so buttons can resolve them by label or id.
 */
export const CRM_WIDGETS = [
  CREATE_VENDOR_INVOICE_RECORDS_WIDGET,
] as const satisfies readonly CrmWidgetDefinition[];

export type CrmWidgetId = (typeof CRM_WIDGETS)[number]["id"];

export function getWidgetByButtonLabel(
  buttonLabel: string,
): CrmWidgetDefinition | undefined {
  return CRM_WIDGETS.find((widget) => widget.buttonLabel === buttonLabel);
}

export function getWidgetById(id: string): CrmWidgetDefinition | undefined {
  return CRM_WIDGETS.find((widget) => widget.id === id);
}

export type { CrmWidgetDefinition, WidgetOpenContext } from "@/widgets/types";
export {
  CREATE_VENDOR_INVOICE_RECORDS_WIDGET,
  CreateVendorInvoiceRecordsWidget,
} from "@/widgets/create-vendor-invoice-records";
