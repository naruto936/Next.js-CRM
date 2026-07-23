import {
  createServiceCompletionFromContract,
  loadServiceCompletionDraft,
} from "@/widgets/create-service-completion/server/createServiceCompletion";
import type {
  CreateServiceCompletionPayload,
  ServiceCompletionEditableFields,
} from "@/widgets/create-service-completion/types";

/**
 * GET ?contractId= — prefill draft from Contract + Site (Deluge field map).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("contractId")?.trim() || "";

    if (!contractId) {
      return Response.json(
        { ok: false, message: "Provide contractId." },
        { status: 400 },
      );
    }

    const result = await loadServiceCompletionDraft(contractId);
    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    console.error("[widgets/create-service-completion GET]", error);
    return Response.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load Service Completion draft",
      },
      { status: 502 },
    );
  }
}

/**
 * POST — create Service Completion (optional form field overrides).
 * Returns `{ ok, openUrl }` for Zoho CRM record.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<
      CreateServiceCompletionPayload
    > & { fields?: ServiceCompletionEditableFields };

    const selectedRecordIds = Array.isArray(body.selectedRecordIds)
      ? body.selectedRecordIds.map((id) => String(id))
      : [];

    const fields =
      body.fields && typeof body.fields === "object" ? body.fields : undefined;

    const payload: CreateServiceCompletionPayload = {
      selectedRecordIds,
      contractId:
        typeof body.contractId === "string" ? body.contractId : undefined,
      module: typeof body.module === "string" ? body.module : "Contracts",
      fields,
    };

    const result = await createServiceCompletionFromContract(payload);
    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    console.error("[widgets/create-service-completion POST]", error);
    return Response.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create Service Completion",
      },
      { status: 500 },
    );
  }
}
