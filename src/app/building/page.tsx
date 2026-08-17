"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ElementId, loadMyOrder, loadScores, getRanking, orderKey, WASH_ELEMENTS,
} from "@/lib/wash";
import { apiGetRankings } from "@/lib/api";
import { Kaechi, WASH_CHAR } from "@/components/Kaechi";
import { BottomNav } from "@/components/BottomNav";
import Image from "next/image";

export default function BuildingPage() {
  const router = useRouter();
  const [myOrder,      setMyOrder]      = useState<ElementId[] | null>(null);
  const [ranking,      setRanking]      = useState<{ order: ElementId[]; score: number }[]>([]);
  const [showReward,   setShowReward]   = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const myFloorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const my = loadMyOrder();
    if (!my) { router.replace("/setup"); return; }
    setMyOrder(my);

    apiGetRankings().then(serverRankings => {
      if (serverRankings.length > 0) {
        const ranked = serverRankings.map(r => ({ order: r.order as ElementId[], score: r.score }));
        setRanking(ranked);
        if (orderKey(ranked[0].order) === orderKey(my)) setShowReward(true);
      }
    }).catch(() => {
      const scores = loadScores();
      const ranked = getRanking(scores);
      setRanking(ranked);
      if (orderKey(ranked[0].order) === orderKey(my)) setShowReward(true);
    });
  }, [router]);

  useEffect(() => {
    if (myFloorRef.current) {
      myFloorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [ranking]);

  const myKey = myOrder ? orderKey(myOrder) : "";
  const total = ranking.length;

  return (
    <div className="flex flex-col min-h-dvh"
      style={{ background: "linear-gradient(180deg,#EAF7EE 0%,#D8F0E0 45%,#C7ECD9 100%)" }}>

      {/* 헤더 */}
      <div className="px-5 pt-14 pb-2 text-center flex-shrink-0">
        <h1 className="font-bold"
          style={{
            fontSize: 26, letterSpacing: "-0.2px", lineHeight: 1.2,
            background: "linear-gradient(180deg,#3FA96B 0%,#1F6E42 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
          24층 씻기 빌딩
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#5C6B60" }}>
          24층 씻기 빌딩 점당 보드
        </p>
      </div>

      {/* 스카이라운지 보상 배너 */}
      {showReward && (
        <div className="mx-4 mt-3 rounded-2xl p-4 flex items-center gap-3 bounce-in"
          style={{
            background: "#FBEFC9",
            border: "2px solid #F5C84B",
            boxShadow: "0 4px 12px rgba(245,200,75,0.3)",
          }}>
          <Kaechi mood="happy" size={48} animate={false} />
          <div>
            <p className="font-bold text-sm" style={{ color: "#7C6FE0" }}>🎊 스카이라운지 입장!</p>
            <p className="text-xs mt-0.5" style={{ color: "#5C6B60" }}>나의 씻기 순서가 1위예요!</p>
          </div>
        </div>
      )}

      {/* 빌딩 스택 */}
      <div className="flex-1 px-4 pt-5 pb-32 overflow-y-auto">

        {/* 스카이라운지 (최상단 골드 블록) */}
        <div className="flex justify-center mb-1">
          <div className="rounded-2xl px-5 py-3 text-center font-bold text-sm relative"
            style={{
              background: "linear-gradient(180deg,#FCE18A 0%,#F5C84B 60%,#D89B1F 100%)",
              color: "#7C6FE0",
              minWidth: 160,
              boxShadow: "0 6px 0 #A87800, 0 10px 20px rgba(245,200,75,0.35)",
            }}>
            <span className="text-base">🌟</span> 스카이라운지
            <div className="text-[11px] font-normal mt-0.5" style={{ color: "#7C6FE0", opacity: 0.8 }}>
              여기 도달하면 보상!
            </div>
          </div>
        </div>

        {/* 구름 */}
        <div className="text-center text-lg mb-3 opacity-60 tracking-widest">☁️  ☁️  ☁️</div>

        {/* 층 블록 */}
        <div className="flex flex-col" style={{ gap: 8 }}>
          {Array.from({ length: total }, (_, i) => {
            const floor    = total - i;
            const rankIdx  = total - floor;
            const item     = ranking[rankIdx];
            if (!item) return null;

            const isMine    = orderKey(item.order) === myKey;
            const isTop     = floor === total;
            const isBottom  = floor === 1;
            const isSelected = selectedFloor === floor;

            // 계단 형태 (위로 갈수록 넓어짐)
            const widthPct = 56 + (floor / total) * 44; // 56% ~ 100%
            const indent   = (100 - widthPct) / 2;

            // 블록 스타일
            let bg          = "#9FE0B8";  // mint300
            let shadow      = "0 5px 0 #3FA96B";
            let border      = "none";
            let textColor   = "#1F6E42";
            if (isTop)    { bg = "#FCE18A"; shadow = "0 5px 0 #D89B1F"; textColor = "#7C6FE0"; }
            if (isBottom) { bg = "#C7ECD9"; shadow = "0 5px 0 #7BC9A0"; textColor = "#3FA96B"; }
            if (isMine)   {
              bg      = "#9FE0B8";
              border  = "2.5px solid #3FA96B";
              shadow  = "0 5px 0 #1F6E42, 0 0 16px rgba(63,169,107,0.65)";
              textColor = "#1F6E42";
            }
            if (isSelected) { bg = "#D8F0E0"; }

            const blockHeight = 56;

            return (
              <div key={orderKey(item.order)}
                ref={isMine ? myFloorRef : null}
                style={{ marginLeft: `${indent}%`, width: `${widthPct}%` }}>
                <button
                  onClick={() => setSelectedFloor(isSelected ? null : floor)}
                  className={`w-full text-left transition-all active:scale-95 ${isMine ? "glow-active" : ""}`}
                  style={{ borderRadius: 18 }}>
                  <div className="flex items-center relative rounded-[18px] overflow-hidden"
                    style={{
                      height: blockHeight,
                      background: bg,
                      border,
                      boxShadow: shadow,
                    }}>

                    {/* 층수 레이블 (미선택) */}
                    {!isSelected && (
                      <div className="absolute inset-0 flex items-center justify-between px-4">
                        {/* 왼쪽: 층수 */}
                        <div className="flex items-center gap-1.5">
                          {isMine && <Kaechi mood="mini" size={22} animate={false} />}
                          <span className="font-bold" style={{ fontSize: 15, color: textColor }}>
                            {isTop ? "🌟" : isBottom ? "🔧" : `${floor}층`}
                            {isMine && (
                              <span className="text-xs font-bold ml-1" style={{ color: "#3FA96B" }}>
                                나의 층
                              </span>
                            )}
                          </span>
                        </div>
                        {/* 오른쪽: 점수 pill */}
                        <span className="rounded-full px-2 py-0.5 text-xs font-bold tabular-nums"
                          style={{
                            background: "rgba(255,255,255,0.7)",
                            color: item.score > 0 ? "#2E8C56" : item.score < 0 ? "#C04040" : "#5C6B60",
                          }}>
                          {item.score > 0 ? `👍 ${item.score}` : item.score < 0 ? `👎 ${Math.abs(item.score)}` : "0"}
                        </span>
                      </div>
                    )}

                    {/* 씻기 순서 (선택됨) */}
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center gap-1.5 px-3">
                        {item.order.map((id, j) => {
                          const el = WASH_ELEMENTS.find(e => e.id === id)!;
                          return (
                            <span key={id} className="flex items-center gap-1">
                              <Image src={WASH_CHAR[id]} alt={el.label}
                                width={28} height={28} style={{ objectFit: "contain" }} />
                              {j < item.order.length - 1 && (
                                <span className="text-xs" style={{ color: "#3FA96B" }}>→</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* 보일러실 */}
        <div className="flex justify-center mt-4 mb-2">
          <div className="rounded-2xl px-5 py-2 text-xs font-bold text-center"
            style={{ background: "#D8F0E0", color: "#5C6B60", border: "2px solid #9FE0B8" }}>
            🔧 보일러실 (꼴찌)
          </div>
        </div>

        <p className="text-center text-xs mt-4 px-4 leading-relaxed fade-up" style={{ color: "#5C6B60" }}>
          블록을 누르면 씻기 순서를 볼 수 있어요 🐥<br/>
          내 순서가 24층에 도달하면 스카이라운지 입장!
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
