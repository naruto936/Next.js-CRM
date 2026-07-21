import type { CrmWidgetDefinition } from "@/widgets/types";

/** Button label on the contract record view (matches Zoho spelling). */
export const COMPLIANCE_FIELDS_BUTTON_LABEL = "Complince Fields" as const;

/** Widget modal title (matches complince.html heading). */
export const COMPLIANCE_FIELDS_WIDGET_NAME =
  "Awarded Pending Vendor Compliance" as const;

export const COMPLIANCE_FIELDS_WIDGET = {
  id: "compliance-fields",
  name: COMPLIANCE_FIELDS_WIDGET_NAME,
  buttonLabel: COMPLIANCE_FIELDS_BUTTON_LABEL,
} as const satisfies CrmWidgetDefinition;

export type {
  ComplianceFieldsForm,
  ComplianceFieldsLoadResult,
  ComplianceFieldsSavePayload,
  ComplianceFieldsSaveResult,
} from "./types";

export { ComplianceFieldsWidget } from "./ui/ComplianceFieldsWidget";
