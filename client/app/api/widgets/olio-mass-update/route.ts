import { updateOlioMassRecords } from "@/widgets/olio-mass-update/server/olioMassUpdate";
import type {
  OlioMassUpdatePayload,
  OlioMassUpdateValue,
} from "@/widgets/olio-mass-update/types";

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function parseValue(value: FormDataEntryValue | null): OlioMassUpdateValue {
  if (typeof value !== "string") return "";
  try {
    return JSON.parse(value) as OlioMassUpdateValue;
  } catch {
    return value;
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let payload: OlioMassUpdatePayload;
    let file:
      | { name: string; type: string; bytes: Uint8Array }
      | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const fileEntry = formData.get("file");
      const idsEntry = formData.get("selectedRecordIds");
      payload = {
        selectedRecordIds:
          typeof idsEntry === "string"
            ? stringArray(JSON.parse(idsEntry))
            : [],
        module:
          typeof formData.get("module") === "string"
            ? String(formData.get("module"))
            : "Contracts",
        fieldApiName: String(formData.get("fieldApiName") ?? ""),
        fieldType: String(formData.get("fieldType") ?? ""),
        newValue: parseValue(formData.get("newValue")),
        notifyTeam: String(formData.get("notifyTeam")) === "true",
        currentDate: String(formData.get("currentDate") ?? ""),
      };
      if (fileEntry instanceof File) {
        file = {
          name: fileEntry.name,
          type: fileEntry.type,
          bytes: new Uint8Array(await fileEntry.arrayBuffer()),
        };
      }
    } else {
      const body = (await request.json().catch(() => ({}))) as Partial<
        OlioMassUpdatePayload
      >;
      payload = {
        selectedRecordIds: stringArray(body.selectedRecordIds),
        module: typeof body.module === "string" ? body.module : "Contracts",
        fieldApiName:
          typeof body.fieldApiName === "string" ? body.fieldApiName : "",
        fieldType: typeof body.fieldType === "string" ? body.fieldType : "",
        newValue:
          typeof body.newValue === "boolean" ||
          typeof body.newValue === "string" ||
          Array.isArray(body.newValue)
            ? body.newValue
            : "",
        notifyTeam: Boolean(body.notifyTeam),
        currentDate:
          typeof body.currentDate === "string" ? body.currentDate : "",
      };
    }

    const result = await updateOlioMassRecords({ ...payload, file });
    return Response.json(result, {
      status: result.ok ? 200 : result.successCount ? 207 : 400,
    });
  } catch (error) {
    console.error("[widgets/olio-mass-update]", error);
    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}
