import type { CrmWidgetDefinition } from "@/widgets/types";

/** Button label in the contracts list selection toolbar. */
export const ACTIVATE_VENDORS_BUTTON_LABEL = "Activate Vendors" as const;

/** Widget modal title. */
export const ACTIVATE_VENDORS_WIDGET_NAME = "Activate Vendors" as const;

export const ACTIVATE_VENDORS_WIDGET = {
  id: "activate-vendors",
  name: ACTIVATE_VENDORS_WIDGET_NAME,
  buttonLabel: ACTIVATE_VENDORS_BUTTON_LABEL,
} as const satisfies CrmWidgetDefinition;

export type {
  ActivateVendorsPayload,
  ActivateVendorsResult,
} from "./types";

export { ACTIVATE_VENDORS_FUNCTION_NAME } from "./types";

export { ActivateVendorsWidget } from "./ui/ActivateVendorsWidget";
