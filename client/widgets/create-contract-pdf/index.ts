import type { CrmWidgetDefinition } from "@/widgets/types";

/** Button label on the contract record view Buttons menu. */
export const CREATE_CONTRACT_PDF_BUTTON_LABEL = "Create Contract PDF" as const;

/** Widget modal title. */
export const CREATE_CONTRACT_PDF_WIDGET_NAME = "Contract Generator" as const;

export const CREATE_CONTRACT_PDF_WIDGET = {
  id: "create-contract-pdf",
  name: CREATE_CONTRACT_PDF_WIDGET_NAME,
  buttonLabel: CREATE_CONTRACT_PDF_BUTTON_LABEL,
} as const satisfies CrmWidgetDefinition;

export { CreateContractPdfWidget } from "./ui/CreateContractPdfWidget";
