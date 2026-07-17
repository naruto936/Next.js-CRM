import { createVendorInvoiceRecords } from "@/widgets/create-vendor-invoice-records/server/createVendorInvoiceRecords";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const selectedRecordIds = Array.isArray(body.selectedRecordIds)
      ? body.selectedRecordIds.map((id) => String(id))
      : [];
    const module = typeof body.module === "string" ? body.module : "Contracts";
    const monthOfService =
      typeof body.monthOfService === "string" ? body.monthOfService.trim() : "";
    const yearOfService = Number(body.yearOfService);

    const result = await createVendorInvoiceRecords({
      selectedRecordIds,
      module,
      monthOfService,
      yearOfService: Number.isFinite(yearOfService) ? yearOfService : 0,
    });

    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    console.error("[widgets/create-vendor-invoice-records]", error);
    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}
