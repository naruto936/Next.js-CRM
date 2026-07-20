import type { CrmWidgetDefinition } from "@/widgets/types";
import { ACTIVATE_VENDORS_WIDGET } from "@/widgets/activate-vendors";
import { ADD_MASS_SUBFORM_WIDGET } from "@/widgets/add-mass-subform";
import { CREATE_VENDOR_INVOICE_RECORDS_WIDGET } from "@/widgets/create-vendor-invoice-records";
import { MASS_RENEWAL_CONTRACTS_WIDGET } from "@/widgets/mass-renewal-contracts";
import { MISSING_INVOICE_EMAIL_WIDGET } from "@/widgets/missing-invoice-email";
import { OLIO_MASS_UPDATE_WIDGET } from "@/widgets/olio-mass-update";

/**
 * Registry of list-action widgets.
 * Add new widgets here so buttons can resolve them by label or id.
 */
export const CRM_WIDGETS = [
  CREATE_VENDOR_INVOICE_RECORDS_WIDGET,
  OLIO_MASS_UPDATE_WIDGET,
  ADD_MASS_SUBFORM_WIDGET,
  ACTIVATE_VENDORS_WIDGET,
  MISSING_INVOICE_EMAIL_WIDGET,
  MASS_RENEWAL_CONTRACTS_WIDGET,
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
  ACTIVATE_VENDORS_WIDGET,
  ActivateVendorsWidget,
} from "@/widgets/activate-vendors";
export {
  ADD_MASS_SUBFORM_WIDGET,
  AddMassSubformWidget,
} from "@/widgets/add-mass-subform";
export {
  CREATE_VENDOR_INVOICE_RECORDS_WIDGET,
  CreateVendorInvoiceRecordsWidget,
} from "@/widgets/create-vendor-invoice-records";
export {
  MASS_RENEWAL_CONTRACTS_WIDGET,
  MassRenewalContractsWidget,
} from "@/widgets/mass-renewal-contracts";
export {
  MISSING_INVOICE_EMAIL_WIDGET,
  MissingInvoiceEmailWidget,
} from "@/widgets/missing-invoice-email";
export {
  OLIO_MASS_UPDATE_WIDGET,
  OlioMassUpdateWidget,
} from "@/widgets/olio-mass-update";
