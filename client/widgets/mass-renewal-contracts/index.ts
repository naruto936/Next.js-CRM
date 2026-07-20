import type { CrmWidgetDefinition } from "@/widgets/types";
import {
  MASS_RENEWAL_CONTRACTS_BUTTON_LABEL,
  MASS_RENEWAL_CONTRACTS_WIDGET_NAME,
} from "@/widgets/mass-renewal-contracts/types";

export const MASS_RENEWAL_CONTRACTS_WIDGET = {
  id: "mass-renewal-contracts",
  name: MASS_RENEWAL_CONTRACTS_WIDGET_NAME,
  buttonLabel: MASS_RENEWAL_CONTRACTS_BUTTON_LABEL,
} as const satisfies CrmWidgetDefinition;

export type {
  MassRenewalContractsFormValues,
  MassRenewalContractsPayload,
  MassRenewalContractsResult,
  MassRenewalResultItem,
} from "./types";

export {
  MASS_RENEWAL_CONTRACTS_BUTTON_LABEL,
  MASS_RENEWAL_CONTRACTS_WIDGET_NAME,
} from "./types";

export { MassRenewalContractsWidget } from "./ui/MassRenewalContractsWidget";
