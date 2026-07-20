import { sendMissingInvoiceEmails } from "@/widgets/missing-invoice-email/server/sendMissingInvoiceEmails";
import type { MissingInvoiceEmailPayload } from "@/widgets/missing-invoice-email/types";

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<
      MissingInvoiceEmailPayload
    >;
    const payload: MissingInvoiceEmailPayload = {
      selectedRecordIds: stringArray(body.selectedRecordIds),
      module: typeof body.module === "string" ? body.module : "Contracts",
    };

    const result = await sendMissingInvoiceEmails(payload);
    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    console.error("[widgets/missing-invoice-email]", error);
    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}
