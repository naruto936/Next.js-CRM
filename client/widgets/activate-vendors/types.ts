/** Legacy Zoho button function name (CRM UI only — not used over REST). */
export const ACTIVATE_VENDORS_FUNCTION_NAME =
  "activating_vendors_from_contracts" as const;

export type ActivateVendorsPayload = {
  selectedRecordIds: string[];
  module?: string;
};

export type ActivateVendorsResult = {
  ok: boolean;
  message?: string;
  /** Summary counts / details from the activation run. */
  output?: unknown;
};
