export type ComplianceFieldsForm = {
  w9Url: string;
  coiExpiration: string;
  workersComp: string;
  legalName: string;
  bankAch: string;
};

export type ComplianceFieldsLoadResult = {
  ok: boolean;
  message?: string;
  vendorId?: string;
  vendorName?: string;
  fields?: ComplianceFieldsForm;
};

export type ComplianceFieldsSavePayload = {
  vendorId: string;
  fields: ComplianceFieldsForm;
};

export type ComplianceFieldsSaveResult = {
  ok: boolean;
  message?: string;
};
