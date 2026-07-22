import {
  cloneContractWithNewVendor,
  loadCloneContractContext,
  searchVendorsForClone,
} from "@/widgets/clone-contract/server/cloneContract";
import type { CloneContractPayload } from "@/widgets/clone-contract/types";

/**
 * GET ?contractId= — load current vendor / end-date context
 * GET ?q= — vendor search (starts_with Vendor_Name)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const contractId = searchParams.get("contractId")?.trim() || "";

    if (q) {
      const result = await searchVendorsForClone(q);
      return Response.json(result, { status: result.ok ? 200 : 400 });
    }

    if (contractId) {
      const result = await loadCloneContractContext(contractId);
      return Response.json(result, { status: result.ok ? 200 : 400 });
    }

    return Response.json(
      { ok: false, message: "Provide contractId or q." },
      { status: 400 },
    );
  } catch (error) {
    console.error("[widgets/clone-contract GET]", error);
    return Response.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Failed to load clone context",
      },
      { status: 502 },
    );
  }
}

/** POST — clone contract onto selected vendor + CreatePOfromContract. */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<
      CloneContractPayload
    >;

    const payload: CloneContractPayload = {
      contractId: typeof body.contractId === "string" ? body.contractId : "",
      vendorId: typeof body.vendorId === "string" ? body.vendorId : "",
      vendorName: typeof body.vendorName === "string" ? body.vendorName : "",
    };

    const result = await cloneContractWithNewVendor(payload);
    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    console.error("[widgets/clone-contract POST]", error);
    return Response.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Failed to clone contract",
      },
      { status: 500 },
    );
  }
}
