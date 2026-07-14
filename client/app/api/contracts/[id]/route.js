import { loadContractsFieldCatalog } from "@/lib/contractModuleFields";
import { loadContractsRecordSections } from "@/lib/loadContractRecordLayout";
import {
  collectRecordDetailApiNames,
  collectSubformFieldApiNames,
} from "@/lib/contractRecordLayout";
import { expandApiNamesForZohoFetch, mergeLegacyFieldValues } from "@/lib/contractColumns";
import { mapContractScopeOfWork } from "@/lib/contractScopeOfWork";
import { fetchZohoContractRecordById } from "@/lib/fetchZohoContractRecord";
import { getStaticContractDetail, isStaticContractId } from "@/lib/contractStaticDetail";
import { mapZohoRecord, parseVisibleFields } from "@/lib/zohoContractMap";

export async function GET(request, context) {
  const { id } = await context.params;
  if (!id || !String(id).trim()) {
    return Response.json({ error: "Missing contract id" }, { status: 400 });
  }

  const recordId = String(id).trim();
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");

  if (isStaticContractId(recordId)) {
    const staticDetail = getStaticContractDetail(recordId);
    if (!staticDetail) {
      return Response.json({ error: "Contract not found" }, { status: 404 });
    }
    return Response.json({
      contract: {
        ...staticDetail.record,
        fields: mergeLegacyFieldValues(staticDetail.record.fields),
        lookups: staticDetail.record.lookups,
      },
      offlineDemo: true,
    });
  }

  let visibleApiNames;
  let layoutSections = null;
  let droppedSectionFieldApiNames = [];

  if (scope === "detail") {
    try {
      const { fields } = await loadContractsFieldCatalog();
      const layout = await loadContractsRecordSections(fields);
      layoutSections = layout.sections;
      droppedSectionFieldApiNames = layout.droppedSectionFieldApiNames ?? [];
      visibleApiNames = collectRecordDetailApiNames(fields, layoutSections, {
        droppedSectionFieldApiNames,
      });
    } catch (err) {
      console.error("Failed to load field catalog for record:", err);
      visibleApiNames = parseVisibleFields(searchParams);
    }
  } else {
    visibleApiNames = parseVisibleFields(searchParams);
  }

  const subformApiNames = collectSubformFieldApiNames(layoutSections);
  const scopeOfWorkFieldCandidates = [
    ...subformApiNames,
    ...(subformApiNames.length === 0 ? ["Scope_of_Work"] : []),
  ];

  const fieldSet = new Set(expandApiNamesForZohoFetch(["Name", ...visibleApiNames]));
  for (const api of scopeOfWorkFieldCandidates) {
    fieldSet.add(api);
  }

  const scalarApiNames = [...fieldSet].filter((name) => !scopeOfWorkFieldCandidates.includes(name));

  let row;
  try {
    row = await fetchZohoContractRecordById(recordId, [...fieldSet]);
    // console.log("row.ok", JSON.stringify(row, null, 2));
  } catch (err) {
    const status = err.status ?? 502;
    if (isStaticContractId(recordId)) {
      const staticDetail = getStaticContractDetail(recordId);
      if (staticDetail) {
        return Response.json({
          contract: staticDetail.record,
          offlineDemo: true,
        });
      }
    }
    if (status === 404) {
      return Response.json({ error: "Contract not found" }, { status: 404 });
    }
    console.error("Zoho CRM record request failed:", err);
    let message = err instanceof Error ? err.message : "Failed to reach Zoho CRM";
    if (message.includes("Zoho token refresh failed")) {
      message =
        "Could not authenticate with Zoho CRM. The list may still work briefly with a cached token; regenerate your refresh token and confirm client ID/secret and accounts region (zoho.com vs zoho.eu).";
    }
    return Response.json(
      {
        error: message,
        status: err.status,
        details: err.details,
      },
      { status: status >= 400 && status < 600 ? status : 502 },
    );
  }

  const contract = mapZohoRecord(row, scalarApiNames.length > 0 ? scalarApiNames : [...fieldSet]);
  contract.fields = mergeLegacyFieldValues(contract.fields);
  // console.log("contract.fields", JSON.stringify(contract.fields, null, 2));
  /** @type {Record<string, import("@/lib/contractScopeOfWork").ContractScopeOfWorkRow[]>} */
  const scopeOfWorkByField = {};
  for (const apiName of scopeOfWorkFieldCandidates) {
    const raw = row[apiName];
    if (raw == null) continue;
    const lines = mapContractScopeOfWork(raw);
    if (lines.length > 0) {
      scopeOfWorkByField[apiName] = lines;
    }
  }

  return Response.json({
    contract: {
      id: contract.id,
      fields: contract.fields,
      lookups: contract.lookups,
    },
    scopeOfWorkByField,
    visibleFields: [...fieldSet],
  });
}
