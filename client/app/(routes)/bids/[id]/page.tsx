import BidsRecordView from "@/components/BidsRecordView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BidDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-crm-canvas p-2 sm:p-3">
      <BidsRecordView id={id} />
    </div>
  );
}
