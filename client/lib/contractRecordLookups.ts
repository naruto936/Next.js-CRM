import { normalizeContractFieldApiName } from "@/lib/contractColumns";

const LOOKUP_BASE_PATH: Record<string, string> = {
  Vendor: "/vendors",
  SOW_Name: "/sow",
  SOW: "/sow",
};

/** Vendor and SOW Name in the contracts list / record. */
export function isContractLookupField(apiName: string, label?: string): boolean {
  const canonical = normalizeContractFieldApiName(apiName);
  if (canonical === "Vendor" || canonical === "SOW_Name" || canonical === "SOW") {
    return true;
  }
  return label?.trim().toLowerCase() === "sow name";
}

export function getContractLookupHref(apiName: string, lookupId: string): string | null {
  const id = lookupId.trim();
  if (!id) return null;

  const canonical = normalizeContractFieldApiName(apiName);
  const base = LOOKUP_BASE_PATH[canonical] ?? LOOKUP_BASE_PATH[apiName];
  if (!base) return null;

  return `${base}/${encodeURIComponent(id)}`;
}

export function getContractFieldLookupId(
  lookups: Record<string, string> | undefined,
  apiName: string,
): string | undefined {
  if (!lookups) return undefined;

  const direct = lookups[apiName]?.trim();
  if (direct) return direct;

  const canonical = normalizeContractFieldApiName(apiName);
  if (canonical !== apiName) {
    const fromCanonical = lookups[canonical]?.trim();
    if (fromCanonical) return fromCanonical;
  }

  return undefined;
}
