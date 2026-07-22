/** Button label on the contract record view (matches Zoho). */
export const CLONE_CONTRACT_BUTTON_LABEL = "Clone Contract" as const;

/** Widget modal title (matches widget.html heading). */
export const CLONE_CONTRACT_WIDGET_NAME = "Change Vendor on Contract" as const;

/** Zoho CRM function that creates the Books PO for the new contract. */
export const CREATE_PO_FROM_CONTRACT_FUNCTION = "CreatePOfromContract" as const;

export const COI_COMPLIANCE_MESSAGE =
  "Please check and make sure the W9, ACH, WC on the vendor record" as const;

export type CloneContractContext = {
  ok: boolean;
  message?: string;
  contractId?: string;
  contractName?: string;
  currentVendorId?: string;
  currentVendorName?: string;
  contractEndDate?: string | null;
};

export type VendorSuggestion = {
  id: string;
  name: string;
};

export type VendorSearchResult = {
  ok: boolean;
  message?: string;
  vendors?: VendorSuggestion[];
};

export type CloneContractPayload = {
  contractId: string;
  vendorId: string;
  vendorName: string;
};

export type CloneContractResult = {
  ok: boolean;
  message?: string;
  /** When true, keep the error visible until dismissed (COI compliance). */
  persistent?: boolean;
  newContractId?: string;
  newContractName?: string;
  /** Zoho `details.api_name` when a lookup filter blocked insert. */
  failedField?: string;
  /** Lookup fields removed so the clone could succeed. */
  strippedFields?: string[];
};
