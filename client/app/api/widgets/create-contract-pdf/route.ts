/**
 * Single API entry for Create Contract PDF widget.
 * Dispatches on `?action=` — replaces separate contract/related/me/upload/send-sign/status routes.
 *
 * GET  ?action=contract&id=
 * GET  ?action=related&module=&id=
 * GET  ?action=me
 * POST ?action=upload          (multipart: file, contractId)
 * POST ?action=send-sign       (JSON)
 * PATCH ?action=status         (JSON)
 */

import {
  loadContractForPdf,
  loadCurrentCrmUser,
  loadRelatedRecord,
  sendZohoSignContract,
  updateContractSignStatus,
  uploadPdfFileToZoho,
  type SendZohoSignPayload,
} from "@/widgets/create-contract-pdf/server/createContractPdf";

const ALLOWED_MODULES = new Set([
  "Contracts",
  "Accounts",
  "Vendors",
  "Products",
  "users",
]);

function actionOf(request: Request) {
  return new URL(request.url).searchParams.get("action")?.trim() || "";
}

export async function GET(request: Request) {
  const action = actionOf(request);
  const { searchParams } = new URL(request.url);

  try {
    if (action === "me") {
      return Response.json(await loadCurrentCrmUser());
    }

    if (action === "contract") {
      const id = searchParams.get("id")?.trim() || "";
      if (!id) {
        return Response.json({ error: "Missing id" }, { status: 400 });
      }
      const record = await loadContractForPdf(id);
      return Response.json({ data: [record] });
    }

    if (action === "related") {
      const moduleName = searchParams.get("module")?.trim() || "";
      const id = searchParams.get("id")?.trim() || "";
      if (!moduleName || !id) {
        return Response.json(
          { error: "module and id are required" },
          { status: 400 },
        );
      }
      if (!ALLOWED_MODULES.has(moduleName)) {
        return Response.json(
          { error: `Module not allowed: ${moduleName}` },
          { status: 400 },
        );
      }
      return Response.json(await loadRelatedRecord(moduleName, id));
    }

    return Response.json(
      { error: `Unknown GET action: ${action || "(none)"}` },
      { status: 400 },
    );
  } catch (error) {
    console.error(`[widgets/create-contract-pdf GET ${action}]`, error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Request failed",
      },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const action = actionOf(request);

  try {
    if (action === "upload") {
      const form = await request.formData();
      const file = form.get("file");
      const contractId = String(form.get("contractId") ?? "").trim();
      if (!(file instanceof File)) {
        return Response.json({ error: "Missing file" }, { status: 400 });
      }
      const buffer = new Uint8Array(await file.arrayBuffer());
      const fileId = await uploadPdfFileToZoho(
        {
          name: file.name || "contract.pdf",
          type: file.type || "application/pdf",
          bytes: buffer,
        },
        { contractId },
      );
      return Response.json({
        data: [{ details: { id: fileId }, code: "SUCCESS" }],
      });
    }

    if (action === "send-sign") {
      const body = (await request.json().catch(() => ({}))) as Partial<
        SendZohoSignPayload
      > & { arguments?: string | Record<string, unknown> };

      let args: Partial<SendZohoSignPayload> = body;
      if (body.arguments != null) {
        args =
          typeof body.arguments === "string" ?
            (JSON.parse(body.arguments) as Partial<SendZohoSignPayload>)
          : (body.arguments as Partial<SendZohoSignPayload>);
      }

      const payload: SendZohoSignPayload = {
        id: typeof args.id === "string" ? args.id : String(args.id ?? ""),
        file_id:
          typeof args.file_id === "string" ?
            args.file_id
          : String(args.file_id ?? ""),
        signature_fields: args.signature_fields ?? [],
        recipient_name:
          typeof args.recipient_name === "string" ? args.recipient_name : "",
        recipient_email:
          typeof args.recipient_email === "string" ? args.recipient_email : "",
        owner_email:
          typeof args.owner_email === "string" ? args.owner_email : "",
      };

      const result = await sendZohoSignContract(payload);
      if (!result.ok) {
        return Response.json(
          {
            code: "failure",
            status: "error",
            message: result.message,
            details: {
              output:
                typeof result.output === "string" ?
                  result.output
                : JSON.stringify(
                    result.output ?? {
                      status: "failed",
                      error: result.message,
                    },
                  ),
              message: result.message,
            },
          },
          { status: 400 },
        );
      }

      return Response.json({
        code: "success",
        status: "success",
        details: {
          output:
            typeof result.output === "string" ?
              result.output
            : JSON.stringify(result.output ?? {}),
        },
      });
    }

    return Response.json(
      { error: `Unknown POST action: ${action || "(none)"}` },
      { status: 400 },
    );
  } catch (error) {
    console.error(`[widgets/create-contract-pdf POST ${action}]`, error);
    return Response.json(
      {
        code: "failure",
        status: "error",
        error: error instanceof Error ? error.message : "Request failed",
        message: error instanceof Error ? error.message : "Request failed",
        data: [],
        details: {
          message: error instanceof Error ? error.message : "Request failed",
        },
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const action = actionOf(request);
  if (action && action !== "status") {
    return Response.json(
      { error: `Unknown PATCH action: ${action}` },
      { status: 400 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      id?: string;
      contractType?: string;
      requestId?: string;
      Entity?: string;
      APIData?: Record<string, unknown>;
    };

    if (body.APIData?.id) {
      const api = body.APIData;
      const id = String(api.id);
      const isVendor =
        "Vendor_Signed_Status" in api || "Vendor_Sign_Req_Id" in api;
      const requestId = String(
        api.Vendor_Sign_Req_Id ??
          api.Client_Sign_Req_Id ??
          body.requestId ??
          "",
      );
      const result = await updateContractSignStatus({
        id,
        contractType: isVendor ? "Vendor" : "Client",
        requestId,
      });
      return Response.json({ data: [{ code: "SUCCESS", details: result }] });
    }

    const id = String(body.id ?? "").trim();
    const requestId = String(body.requestId ?? "").trim();
    const contractType = body.contractType === "Vendor" ? "Vendor" : "Client";

    if (!id || !requestId) {
      return Response.json(
        { error: "id and requestId are required" },
        { status: 400 },
      );
    }

    const result = await updateContractSignStatus({
      id,
      contractType,
      requestId,
    });
    return Response.json({ data: [{ code: "SUCCESS", details: result }] });
  } catch (error) {
    console.error("[widgets/create-contract-pdf PATCH status]", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Update failed",
      },
      { status: 502 },
    );
  }
}
