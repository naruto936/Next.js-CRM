import { createMassRenewalSows } from "@/widgets/mass-renewal-contracts/server/createMassRenewalSows";
import type { MassRenewalContractsPayload } from "@/widgets/mass-renewal-contracts/types";

function stringValue(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<
      MassRenewalContractsPayload
    >;
    const payload: MassRenewalContractsPayload = {
      selectedRecordIds: stringArray(body.selectedRecordIds),
      module: typeof body.module === "string" ? body.module : "Contracts",
      clientBidDue: stringValue(body.clientBidDue).trim(),
      vendorBidDue: stringValue(body.vendorBidDue).trim(),
      yearsOfExtension: stringValue(body.yearsOfExtension).trim() || "1",
      clientAddendum: stringValue(body.clientAddendum),
      vendorAddendum: stringValue(body.vendorAddendum),
      internalNotes: stringValue(body.internalNotes),
    };

    const result = await createMassRenewalSows(payload);
    return Response.json(result, {
      status: result.ok ? 200 : result.results?.length ? 207 : 400,
    });
  } catch (error) {
    console.error("[widgets/mass-renewal-contracts]", error);
    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}
