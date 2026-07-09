import { allSowDetailApiNames } from "@/lib/sowConfig";
import { formatFieldValue, mapZohoRecord } from "@/lib/zohoContractMap";

/** Zoho-shaped SOW row (`SOW30073` sample). */
const STATIC_SOW_30073_RAW: Record<string, unknown> = {
  Owner: {
    name: "Olio Group",
    id: "2168928000035310001",
    email: "no-reply@oliogroupmn.com",
  },
  Address: null,
  Site_Acreage: 25.88,
  Site_Number: null,
  Currency: "USD",
  Stage: "Won - Active",
  id: "2168928000114292432",
  Ops_Owner: { name: "Jake Bednar", id: "2168928000000938001" },
  Status: null,
  Site_Visit_Assignment: "Operations",
  Created_Time: "2026-04-27T10:16:28-05:00",
  Created_By: {
    name: "Olio Group",
    id: "2168928000035310001",
    email: "no-reply@oliogroupmn.com",
  },
  Sales_Owner: { name: "Jim Bjorgaard", id: "2168928000000893001" },
  End_Date: "2026-06-12",
  Days: 43,
  Sales_Associate_New: { name: "Olio Group", id: "2168928000035310001" },
  Account_Name: { name: "Test H", id: "2168928000102691004" },
  Start_Date: "2026-06-04",
  SOWID: "SOW30073",
  Record_Status__s: "Available",
  Pipeline: "Sales - Ops Flow",
  Deal_Name: "SOW30073",
  Is_OTS_SOW: false,
  Company_Name: { name: "test my site", id: "2168928000108371533" },
  Scope_of_Work: [
    {
      Category: "OTS",
      OurServices: { name: "Test One Off", id: "2168928000030424094" },
      Vendor_Price: 12,
      End_Date: "2026-06-12",
      id: "2168928000119791152",
      Start_Date: "2026-06-04",
      Invoice_Price: 11,
      Vendor_Target_Price: 0,
    },
    {
      Category: "F",
      OurServices: { name: "Test My Service SOW", id: "2168928000086841179" },
      Vendor_Price: null,
      End_Date: "2026-06-09",
      id: "2168928000119791316",
      Start_Date: "2026-06-04",
      Invoice_Price: 11,
      Vendor_Target_Price: 0,
    },
  ],
  Category: ["OTS"],
  Modified_By: {
    name: "Dan Nelson",
    id: "2168928000000107007",
    email: "dan@oliogroupmn.com",
  },
  Modified_Time: "2026-06-10T16:58:55-05:00",
  SOW_Summary:
    "SOW Item Name | Client Price | Vendor Price\n---------------------------------------------------------\nTest One Off              | 11           | 12          \nTest My Service SOW       | 11           | 0",
  Vendor: { name: "Ghazanfar Ali Dev Test", id: "2168928000037970160" },
  Operations_Associate_New: { name: "Olio Group", id: "2168928000035310001" },
  Layout: {
    display_label: "SOW",
    name: "SOW",
    id: "2168928000000091023",
  },
};

const STATIC_RAW_BY_ID: Record<string, Record<string, unknown>> = {
  "static-sow-30073": STATIC_SOW_30073_RAW,
  "2168928000114292432": STATIC_SOW_30073_RAW,
};

export function isStaticSowId(recordId: string) {
  return recordId.startsWith("static-sow-") || recordId in STATIC_RAW_BY_ID;
}

export type SowScopeOfWorkRow = {
  id: string;
  serviceName: string;
  category: string;
  startDate: string;
  endDate: string;
  invoicePrice: string;
  vendorPrice: string;
  vendorTargetPrice: string;
};

function mapScopeOfWork(raw: unknown): SowScopeOfWorkRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row, index) => {
    const r = row as Record<string, unknown>;
    const service = r.OurServices as { name?: string } | undefined;
    return {
      id: r.id != null ? String(r.id) : `sow-line-${index}`,
      serviceName: service?.name != null ? String(service.name) : formatFieldValue(r.OurServices),
      category: formatFieldValue(r.Category),
      startDate: formatFieldValue(r.Start_Date),
      endDate: formatFieldValue(r.End_Date),
      invoicePrice: formatFieldValue(r.Invoice_Price),
      vendorPrice: formatFieldValue(r.Vendor_Price),
      vendorTargetPrice: formatFieldValue(r.Vendor_Target_Price),
    };
  });
}

export function getStaticSowDetail(recordId: string) {
  const row = STATIC_RAW_BY_ID[recordId];
  if (!row) return null;

  const apiNames = allSowDetailApiNames();
  const mapped = mapZohoRecord(row, apiNames);
  mapped.id = recordId;

  const scopeOfWork = mapScopeOfWork(row.Scope_of_Work);
  const layout = row.Layout;
  const layoutLabel =
    layout && typeof layout === "object" && "display_label" in layout && layout.display_label ?
      String(layout.display_label)
    : layout && typeof layout === "object" && "name" in layout && layout.name ?
      String(layout.name)
    : "";

  return {
    record: mapped,
    scopeOfWork,
    layoutLabel,
    zohoRecordId: row.id != null ? String(row.id) : "",
  };
}
