import {
  loadComplianceFields,
  saveComplianceFields,
} from "@/widgets/compliance-fields/server/complianceFields";
import type {
  ComplianceFieldsForm,
  ComplianceFieldsSavePayload,
} from "@/widgets/compliance-fields/types";

/** GET ?contractId= — load vendor compliance fields for a contract. */
export async function GET(request: Request) {
  try {
    const contractId =
      new URL(request.url).searchParams.get("contractId")?.trim() || "";
    const result = await loadComplianceFields(contractId);
    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    console.error("[widgets/compliance-fields GET]", error);
    return Response.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Failed to load compliance fields",
      },
      { status: 502 },
    );
  }
}

/** POST — save vendor compliance fields. */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<
      ComplianceFieldsSavePayload
    > & { fields?: Partial<ComplianceFieldsForm> };

    const fields: ComplianceFieldsForm = {
      w9Url: typeof body.fields?.w9Url === "string" ? body.fields.w9Url : "",
      coiExpiration:
        typeof body.fields?.coiExpiration === "string" ?
          body.fields.coiExpiration
        : "",
      workersComp:
        typeof body.fields?.workersComp === "string" ?
          body.fields.workersComp
        : "",
      legalName:
        typeof body.fields?.legalName === "string" ? body.fields.legalName : "",
      bankAch: typeof body.fields?.bankAch === "string" ? body.fields.bankAch : "",
    };

    const payload: ComplianceFieldsSavePayload = {
      vendorId: typeof body.vendorId === "string" ? body.vendorId : "",
      fields,
    };

    const result = await saveComplianceFields(payload);
    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    console.error("[widgets/compliance-fields POST]", error);
    return Response.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Failed to update vendor",
      },
      { status: 500 },
    );
  }
}
