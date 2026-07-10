import { formatCellForDisplay } from "@/lib/contractColumns";
import { formatFieldValue } from "@/lib/zohoContractMap";

export type ContractScopeOfWorkRow = {
  id: string;
  serviceName: string;
  vendorPrice: string;
  clientPrice: string;
  startDate: string;
  endDate: string;
  numberOfServices: string;
};

function formatOurServicesLabel(value: unknown): string {
  if (value == null || value === "") return "";

  if (typeof value === "object" && !Array.isArray(value)) {
    const obj = value as { name?: string; id?: string };
    if (obj.name != null && String(obj.name).trim() !== "") return String(obj.name);
    return "";
  }

  const str = String(value).trim();
  if (/^\d{10,}$/.test(str)) return "";
  return str;
}

function formatSubformMoney(value: unknown): string {
  const formatted = formatFieldValue(value);
  if (!formatted) return "";
  const num = Number(String(formatted).replace(/,/g, ""));
  if (!Number.isNaN(num)) {
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return formatted;
}

function formatSubformDate(value: unknown): string {
  const raw = formatFieldValue(value);
  if (!raw) return "";
  return formatCellForDisplay(raw, "date");
}

export function mapContractScopeOfWork(raw: unknown): ContractScopeOfWorkRow[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((row, index) => {
    const r = row as Record<string, unknown>;
    const serviceName = formatOurServicesLabel(r.OurServices ?? r.Our_Services);

    return {
      id: r.id != null ? String(r.id) : `contract-sow-line-${index}`,
      serviceName: serviceName || "—",
      vendorPrice: formatSubformMoney(r.Vendor_Price ?? r.Vendor_Price1),
      clientPrice: formatSubformMoney(
        r.Client_Price ?? r.Invoice_Price ?? r.Client_Price1,
      ),
      startDate: formatSubformDate(r.Start_Date),
      endDate: formatSubformDate(r.End_Date),
      numberOfServices: formatFieldValue(
        r.Number_of_Services ?? r.No_of_Services ?? r.Number_of_Service,
      ),
    };
  });
}

export function isScopeOfWorkSubformSection(fieldApiNames: string[]): boolean {
  return fieldApiNames.some((api) => /scope_of_work/i.test(api));
}
