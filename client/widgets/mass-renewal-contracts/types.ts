/** Button label in the contracts list selection toolbar. */
export const MASS_RENEWAL_CONTRACTS_BUTTON_LABEL =
  "Mass Renewal Contracts" as const;

/** Widget modal title (matches the Renewal Contracts form). */
export const MASS_RENEWAL_CONTRACTS_WIDGET_NAME =
  "Renewal Contracts" as const;

export type MassRenewalContractsFormValues = {
  clientBidDue: string;
  vendorBidDue: string;
  yearsOfExtension: string;
  clientAddendum: string;
  vendorAddendum: string;
  internalNotes: string;
};

export type MassRenewalContractsPayload = MassRenewalContractsFormValues & {
  selectedRecordIds: string[];
  module?: string;
};

export type MassRenewalResultItem = {
  status: "success" | "error";
  msg: string;
};

export type MassRenewalContractsResult = {
  ok: boolean;
  message?: string;
  results?: MassRenewalResultItem[];
  successCount?: number;
  errorCount?: number;
};
