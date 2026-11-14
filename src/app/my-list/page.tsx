import type { Metadata } from "next";
import { MyListView } from "@/components/my-list/my-list-view";

export const metadata: Metadata = { title: "My List" };

export default function MyListPage() {
  return (
    <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 pt-28 pb-20 md:px-10">
      <h1 className="mb-8 text-4xl font-extrabold tracking-[-0.03em]">My List</h1>
      <MyListView />
    </main>
  );
}
