import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";
import type { CollabMode } from "@/lib/collab/types";

type PageProps = {
  searchParams?: Promise<{
    doc?: string | string[];
    mode?: string | string[];
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;
  const rawDocId = params?.doc;
  const rawMode = params?.mode;
  const docId = Array.isArray(rawDocId) ? rawDocId[0] : rawDocId;
  const mode = Array.isArray(rawMode) ? rawMode[0] : rawMode;
  const normalizedDocId = docId?.trim() ? docId.trim() : "local-default";
  const normalizedMode: CollabMode = mode === "local" ? "local" : "liveblocks";

  return (
    <div className="flex min-h-screen flex-col items-center py-4 sm:px-5">
      <TailwindAdvancedEditor docId={normalizedDocId} mode={normalizedMode} />
    </div>
  );
}
