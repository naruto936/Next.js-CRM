import type { CrmWidgetDefinition } from "@/widgets/types";
import {
  CLONE_CONTRACT_BUTTON_LABEL,
  CLONE_CONTRACT_WIDGET_NAME,
} from "@/widgets/clone-contract/types";

export {
  CLONE_CONTRACT_BUTTON_LABEL,
  CLONE_CONTRACT_WIDGET_NAME,
  CREATE_PO_FROM_CONTRACT_FUNCTION,
  COI_COMPLIANCE_MESSAGE,
} from "./types";

export type {
  CloneContractContext,
  CloneContractPayload,
  CloneContractResult,
  VendorSearchResult,
  VendorSuggestion,
} from "./types";

export const CLONE_CONTRACT_WIDGET = {
  id: "clone-contract",
  name: CLONE_CONTRACT_WIDGET_NAME,
  buttonLabel: CLONE_CONTRACT_BUTTON_LABEL,
} as const satisfies CrmWidgetDefinition;

export { CloneContractWidget } from "./ui/CloneContractWidget";
