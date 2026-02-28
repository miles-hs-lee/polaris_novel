import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";

type PageProps = {
  searchParams?: {
    doc?: string | string[];
  };
};

export default function Page({ searchParams }: PageProps) {
  const rawDocId = searchParams?.doc;
  const docId = Array.isArray(rawDocId) ? rawDocId[0] : rawDocId;
  const normalizedDocId = docId?.trim() ? docId.trim() : "local-default";

  return (
    <div className="flex min-h-screen flex-col items-center py-4 sm:px-5">
      <TailwindAdvancedEditor docId={normalizedDocId} />
    </div>
  );
}
