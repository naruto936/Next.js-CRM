/** Button label on the contract record view (matches Zoho). */
export const CREATE_SERVICE_COMPLETION_BUTTON_LABEL =
  "Create Service Completion" as const;

/** Widget display name. */
export const CREATE_SERVICE_COMPLETION_WIDGET_NAME =
  "Create Service Completion" as const;

/** Zoho Service Completions module API name. */
export const SERVICE_COMPLETIONS_MODULE = "ServiceCompletions" as const;

/**
 * Zoho CRM record URL pattern from Deluge `openUrl`
 * (`CustomModule14` = Service Completions in oliogroup org).
 */
export const SERVICE_COMPLETION_ZOHO_RECORD_URL =
  "https://crm.zoho.com/crm/oliogroup/tab/CustomModule14" as const;

/** In-app create form route (opened in a new tab from the contract). */
export const CREATE_SERVICE_COMPLETION_PAGE_PATH =
  "/service-completions/new" as const;

/** Layouts by site-name prefix (from Deluge). */
export const SC_LAYOUT_STANDARD_SOLAR = "2168928000075425037" as const;
export const SC_LAYOUT_CARVANA = "2168928000027962135" as const;
export const SC_LAYOUT_DEFAULT = "2168928000027846001" as const;

export type ServiceCompletionDraftLookup = {
  id: string;
  name: string;
};

/** Prefill payload for the create form (Deluge field map). */
export type ServiceCompletionDraft = {
  Name: string;
  Status: string;
  Layout: ServiceCompletionDraftLookup;
  Site_Number: ServiceCompletionDraftLookup;
  Contract: ServiceCompletionDraftLookup;
  Vendor: ServiceCompletionDraftLookup | null;
  Client_Company_Name: ServiceCompletionDraftLookup | null;
  Operation_Associate: ServiceCompletionDraftLookup | null;
  Location_Name: string;
  Location_Street: string;
  Location_City: string;
  Location_State: string;
  Location_Code: string;
  Number_of_Units_at_location: string;
};

/** Editable fields the user can change before Save. */
export type ServiceCompletionEditableFields = {
  Name?: string;
  Status?: string;
  Location_Name?: string;
  Location_Street?: string;
  Location_City?: string;
  Location_State?: string;
  Location_Code?: string;
  Number_of_Units_at_location?: string;
};

export type CreateServiceCompletionPayload = {
  selectedRecordIds?: string[];
  /** Single-contract shortcut (optional). */
  contractId?: string;
  module?: string;
  /** Optional overrides from the create form. */
  fields?: ServiceCompletionEditableFields;
};

export type CreateServiceCompletionDraftResult = {
  ok: boolean;
  message?: string;
  draft?: ServiceCompletionDraft;
};

export type CreateServiceCompletionResult = {
  ok: boolean;
  message?: string;
  serviceCompletionId?: string;
  /** Open this URL after create (Zoho CRM record). */
  openUrl?: string;
};
