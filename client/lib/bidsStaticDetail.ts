import { BIDS_STATIC_RECORDS } from "@/lib/bidsStaticData";
import { allBidsDetailApiNames } from "@/lib/bidsConfig";
import { formatFieldValue, mapZohoRecord } from "@/lib/zohoContractMap";

const STATIC_BID_1001_RAW: Record<string, unknown> = {
  id: "2168928000123000001",
  Name: "SOW30073 — Ghazanfar Ali Dev Test",
  Bid_Number: "BID-2026-0142",
  Status: "Awarded",
  Stage: "Closed - Won",
  Round: "Round 1",
  Is_Awarded: true,
  Amount: 23,
  Currency: "USD",
  Due_Date: "2026-06-01",
  Submitted_Date: "2026-05-28",
  Record_Status__s: "Available",
  Created_Time: "2026-05-28T09:12:00-05:00",
  Modified_Time: "2026-06-10T11:20:00-05:00",
  Vendor: { name: "Ghazanfar Ali Dev Test", id: "2168928000037970160" },
  SOW: { name: "SOW30073", id: "2168928000114292432" },
  Site_Number: { name: "Carvana-CAR2548", id: "2168928000027890332" },
  Location_Name: "Market Ops - Scranton",
  Owner: { name: "Olio Group", id: "2168928000035310001" },
  Ops_Owner: { name: "Jake Bednar", id: "2168928000000938001" },
  Sales_Owner: { name: "Jim Bjorgaard", id: "2168928000000893001" },
  Bid_Notes: "Vendor matched SOW line pricing for OTS and fleet wash scope.",
  Internal_Notes: "Awarded after ops review; align with SOW30073 vendor selection.",
  Vendor_Notes: null,
  Rejection_Reason: null,
  Created_By: {
    name: "Olio Group",
    id: "2168928000035310001",
    email: "no-reply@oliogroupmn.com",
  },
  Modified_By: {
    name: "Dan Nelson",
    id: "2168928000000107007",
    email: "dan@oliogroupmn.com",
  },
  Layout: {
    display_label: "Standard",
    name: "Standard",
    id: "2168928000033751002",
  },
  Bid_Line_Items: [
    {
      id: "2168928000123000101",
      Service: { name: "Test One Off", id: "2168928000030424094" },
      Category: "OTS",
      Quantity: 1,
      Unit_Price: 12,
      Client_Price: 11,
      Line_Total: 12,
    },
    {
      id: "2168928000123000102",
      Service: { name: "Test My Service SOW", id: "2168928000086841179" },
      Category: "F",
      Quantity: 1,
      Unit_Price: 11,
      Client_Price: 11,
      Line_Total: 11,
    },
  ],
};

const STATIC_RAW_BY_ID: Record<string, Record<string, unknown>> = {
  "static-bid-1001": STATIC_BID_1001_RAW,
  "2168928000123000001": STATIC_BID_1001_RAW,
};

for (const listRow of BIDS_STATIC_RECORDS) {
  if (listRow.id in STATIC_RAW_BY_ID) continue;
  STATIC_RAW_BY_ID[listRow.id] = {
    id: listRow.id,
    ...listRow.fields,
    Bid_Line_Items: [],
    Layout: { display_label: "Standard", name: "Standard" },
  };
}

export type BidLineItemRow = {
  id: string;
  serviceName: string;
  category: string;
  quantity: string;
  unitPrice: string;
  clientPrice: string;
  lineTotal: string;
};

export function isStaticBidId(recordId: string) {
  return recordId.startsWith("static-bid-") || recordId in STATIC_RAW_BY_ID;
}

function mapBidLineItems(raw: unknown): BidLineItemRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row, index) => {
    const r = row as Record<string, unknown>;
    const service = r.Service as { name?: string } | undefined;
    return {
      id: r.id != null ? String(r.id) : `bid-line-${index}`,
      serviceName:
        service?.name != null ? String(service.name) : formatFieldValue(r.Service),
      category: formatFieldValue(r.Category),
      quantity: formatFieldValue(r.Quantity),
      unitPrice: formatFieldValue(r.Unit_Price),
      clientPrice: formatFieldValue(r.Client_Price),
      lineTotal: formatFieldValue(r.Line_Total),
    };
  });
}

export function getStaticBidDetail(recordId: string) {
  const row = STATIC_RAW_BY_ID[recordId];
  if (!row) return null;

  const apiNames = allBidsDetailApiNames();
  const mapped = mapZohoRecord(row, apiNames);
  mapped.id = recordId;

  const lineItems = mapBidLineItems(row.Bid_Line_Items);
  const layout = row.Layout;
  const layoutLabel =
    layout && typeof layout === "object" && "display_label" in layout && layout.display_label ?
      String(layout.display_label)
    : layout && typeof layout === "object" && "name" in layout && layout.name ?
      String(layout.name)
    : "";

  return {
    record: mapped,
    lineItems,
    layoutLabel,
    zohoRecordId: row.id != null ? String(row.id) : "",
  };
}
