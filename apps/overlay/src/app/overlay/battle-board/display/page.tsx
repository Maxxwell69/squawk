import { Suspense } from "react";
import { BattleBoardDisplayClient } from "@/components/BattleBoardDisplayClient";

export default function BattleBoardDisplayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh w-full items-center justify-center bg-black" />
      }
    >
      <BattleBoardDisplayClient />
    </Suspense>
  );
}
