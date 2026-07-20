import { activateVendorsFromContracts } from "@/widgets/activate-vendors/server/activateVendors";
import type { ActivateVendorsPayload } from "@/widgets/activate-vendors/types";

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<
      ActivateVendorsPayload
    >;
    const payload: ActivateVendorsPayload = {
      selectedRecordIds: stringArray(body.selectedRecordIds),
      module: typeof body.module === "string" ? body.module : "Contracts",
    };

    const result = await activateVendorsFromContracts(payload);
    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    console.error("[widgets/activate-vendors]", error);
    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}
