export type MassUpdateFieldOption = {
  apiName: string;
  label: string;
  dataType: string;
  format?: string;
  lookupModule?: string;
  pickListValues?: Array<{
    actualValue: string;
    displayValue: string;
  }>;
};

export type MassUpdateLookupOption = {
  value: string;
  label: string;
};

export type MassUpdateSubformRow = {
  OurServices: string;
  serviceName?: string;
  Start_Date?: string;
  End_Date?: string;
  Invoice_Price?: string;
  Vendor_Price?: string;
};

export type OlioMassUpdateValue =
  | string
  | boolean
  | string[]
  | MassUpdateSubformRow[];

export type OlioMassUpdatePayload = {
  selectedRecordIds: string[];
  module?: string;
  fieldApiName: string;
  fieldType: string;
  newValue: OlioMassUpdateValue;
  notifyTeam: boolean;
  currentDate?: string;
};

export type OlioMassUpdateRecordError = {
  id: string;
  message: string;
};

export type OlioMassUpdateResult = {
  ok: boolean;
  message?: string;
  totalRecords?: number;
  successCount?: number;
  failureCount?: number;
  errors?: OlioMassUpdateRecordError[];
};
