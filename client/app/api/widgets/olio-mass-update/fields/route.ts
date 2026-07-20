import { loadOlioMassUpdateFields } from "@/widgets/olio-mass-update/server/olioMassUpdate";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const moduleName = searchParams.get("module")?.trim() || "Contracts";

  try {
    const fields = await loadOlioMassUpdateFields(moduleName);
    return Response.json({ fields, module: moduleName });
  } catch (error) {
    console.error("[widgets/olio-mass-update/fields]", error);
    return Response.json(
      {
        fields: [],
        message:
          error instanceof Error ? error.message : "Failed to load CRM fields.",
      },
      { status: 502 },
    );
  }
}
