"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadMyOrder } from "@/lib/wash";
import { Kaechi } from "@/components/Kaechi";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const my = loadMyOrder();
    if (my) {
      router.replace("/today");
    } else {
      router.replace("/setup");
    }
  }, [router]);

  // 리다이렉트 전 스플래시
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[#0064FF] gap-6">
      <Kaechi mood="normal" size={96} />
      <p className="text-white font-extrabold text-xl">오늘은 어디부터 씻지?</p>
      <p className="text-white/60 text-sm">잠깐만요, 캐치가 준비 중이에요...</p>
    </div>
  );
}
