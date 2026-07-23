import { CreateServiceCompletionForm } from "@/widgets/create-service-completion/ui/CreateServiceCompletionForm";

type PageProps = {
  searchParams: Promise<{ contractId?: string }>;
};

export default async function CreateServiceCompletionPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const contractId = params.contractId?.trim() || "";

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-crm-canvas p-2 sm:p-3">
      <CreateServiceCompletionForm contractId={contractId} />
    </div>
  );
}
