import NewAnalysisClient from "./new-analysis-client";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: {
    ig_media_id?: string | string[];
  };
};

export default function NewAnalysisPage({ searchParams }: PageProps) {
  const raw = searchParams?.ig_media_id;
  const igMediaId = Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";

  return <NewAnalysisClient igMediaId={igMediaId} />;
}
