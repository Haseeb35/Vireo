import { Suspense } from "react";
import { Modal } from "@/components/detail/modal";
import { DetailSkeleton, TitleDetail } from "@/components/detail/title-detail";

// Pop-up: shown when a /title link is clicked from inside the app.
export default function TitleModal({ params }: { params: Promise<{ type: string; id: string }> }) {
  return (
    <Modal>
      <Suspense fallback={<DetailSkeleton />}>
        {params.then(({ type, id }) => (
          <TitleDetail type={type} id={id} />
        ))}
      </Suspense>
    </Modal>
  );
}
