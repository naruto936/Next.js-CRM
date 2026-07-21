import { sendVendorMessage } from "@/widgets/send-message/server/sendMessage";
import type { SendMessagePayload } from "@/widgets/send-message/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<
      SendMessagePayload
    >;
    const payload: SendMessagePayload = {
      recordId: typeof body.recordId === "string" ? body.recordId : "",
      messageContent:
        typeof body.messageContent === "string" ? body.messageContent : "",
      module: typeof body.module === "string" ? body.module : "Contracts",
    };

    const result = await sendVendorMessage(payload);
    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    console.error("[widgets/send-message]", error);
    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}
