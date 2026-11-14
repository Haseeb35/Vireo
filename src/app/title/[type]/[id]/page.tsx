import { Suspense } from "react";
import { DetailSkeleton, TitleDetail } from "@/components/detail/title-detail";

// Full page: shown when a /title link is opened directly or the page is refreshed.
export default function TitlePage({ params }: { params: Promise<{ type: string; id: string }> }) {
  return (
    <main className="mx-auto w-full max-w-[1000px] flex-1 pt-16 pb-16 md:px-6 md:pt-24">
      <Suspense fallback={<DetailSkeleton />}>
        {params.then(({ type, id }) => (
          <TitleDetail type={type} id={id} />
        ))}
      </Suspense>
    </main>
  );
}
