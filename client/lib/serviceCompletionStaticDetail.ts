import { allServiceCompletionDetailApiNames } from "@/lib/serviceCompletionConfig";
import { formatFieldValue, mapZohoRecord } from "@/lib/zohoContractMap";

/** Zoho-shaped row for static demo record `static-sc-1001`. */
const STATIC_SC_1001_RAW: Record<string, unknown> = {
  Owner: {
    name: "Gabriel Brent",
    id: "2168928000027767001",
    email: "gabrielbrent@oliogroupmn.com",
  },
  Site_Number: {
    name: "Carvana-CAR2548",
    id: "2168928000027890332",
  },
  Name: "Carvana-CAR2548 - 2026-07-09",
  Currency: "USD",
  id: "2168928000122523938",
  Wash_Date: "2026-07-09",
  Status: "Washed",
  Location_Name: "Market Ops - Scranton",
  Created_Time: "2026-07-09T08:37:59-05:00",
  Created_By: {
    name: "Gabriel Brent",
    id: "2168928000027767001",
    email: "gabrielbrent@oliogroupmn.com",
  },
  Contract: {
    name: "CAR2548_VC_F_2026",
    id: "2168928000109754032",
  },
  Catalyst: false,
  Location_Code: "18507",
  Location_City: "Moosic",
  Location_State: "PA",
  Operation_Associate: {
    name: "John Stampka",
    id: "2168928000038226001",
  },
  Modified_By: {
    name: "Gabriel Brent",
    id: "2168928000027767001",
    email: "gabrielbrent@oliogroupmn.com",
  },
  Fleet_Units: [
    {
      Fleet_Units: { name: "S3198", id: "2168928000121827864" },
      id: "2168928000122514258",
    },
    {
      Fleet_Units: { name: "S2368", id: "2168928000077189147" },
      id: "2168928000122508312",
    },
    {
      Fleet_Units: { name: "S2366", id: "2168928000077189145" },
      id: "2168928000122506323",
    },
    {
      Fleet_Units: { name: "S2364", id: "2168928000077189143" },
      id: "2168928000122511187",
    },
    {
      Fleet_Units: { name: "S0843", id: "2168928000077189054" },
      id: "2168928000122511185",
    },
    {
      Fleet_Units: { name: "S0888", id: "2168928000042195360" },
      id: "2168928000122471276",
    },
    {
      Fleet_Units: { name: "S1149", id: "2168928000027830694" },
      id: "2168928000122542215",
    },
    {
      Fleet_Units: { name: "S1223", id: "2168928000027830626" },
      id: "2168928000122492326",
    },
    {
      Fleet_Units: { name: "S1312", id: "2168928000027830287" },
      id: "2168928000122460291",
    },
    {
      Fleet_Units: { name: "S1344", id: "2168928000027830256" },
      id: "2168928000122495325",
    },
  ],
  Modified_Time: "2026-07-09T08:37:59-05:00",
  Vendor: {
    name: "A+ Plus Power Wash Inc - PA-6826",
    id: "2168928000069623931",
  },
  Location_Street: "3522 Birney Ave",
  Record_Status__s: "Available",
  Layout: {
    display_label: "Fleet Wash Service",
    name: "Fleet Wash Service",
    id: "2168928000027962135",
  },
};

const STATIC_RAW_BY_ID: Record<string, Record<string, unknown>> = {
  "static-sc-1001": STATIC_SC_1001_RAW,
};

export function isStaticServiceCompletionId(recordId: string) {
  return recordId.startsWith("static-sc-");
}

function mapFleetUnits(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((row, index) => {
    const unit = (row as { Fleet_Units?: { name?: string; id?: string } })?.Fleet_Units;
    const name =
      unit && typeof unit === "object" && unit.name != null ?
        String(unit.name)
      : formatFieldValue(row);
    return {
      id:
        (row as { id?: string })?.id != null ?
          String((row as { id: string }).id)
        : `row-${index}`,
      unitName: name || "—",
      unitId: unit?.id != null ? String(unit.id) : "",
    };
  });
}

export function getStaticServiceCompletionDetail(recordId: string) {
  const row = STATIC_RAW_BY_ID[recordId];
  if (!row) return null;

  const apiNames = allServiceCompletionDetailApiNames();
  const mapped = mapZohoRecord(row, apiNames);
  mapped.id = recordId;

  const fleetUnits = mapFleetUnits(row.Fleet_Units);
  const layout = row.Layout;
  const layoutLabel =
    layout && typeof layout === "object" && "display_label" in layout && layout.display_label ?
      String(layout.display_label)
    : layout && typeof layout === "object" && "name" in layout && layout.name ?
      String(layout.name)
    : "";

  return {
    record: mapped,
    fleetUnits,
    layoutLabel,
    zohoRecordId: row.id != null ? String(row.id) : "",
  };
}
