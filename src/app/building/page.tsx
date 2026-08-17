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
  const [myOrder, setMyOrder] = useState<ElementId[] | null>(null);
  const [ranking, setRanking] = useState<{ order: ElementId[]; score: number }[]>([]);
  const [showReward, setShowReward] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const myFloorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const my = loadMyOrder();
    if (!my) { router.replace("/setup"); return; }
    setMyOrder(my);

    apiGetRankings().then(serverRankings => {
      if (serverRankings.length > 0) {
        const ranked = serverRankings.map(r => ({
          order: r.order as ElementId[],
          score: r.score,
        }));
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
    <div className="flex flex-col min-h-dvh" style={{ background: "#E8F5EE" }}>

      {/* 헤더: 텍스트만 */}
      <div className="px-6 pt-14 pb-2 text-center flex-shrink-0">
        <p className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: "#8FAF97" }}>
          씻기 빌딩
        </p>
        <h1 className="text-xl font-extrabold mt-0.5" style={{ color: "#2D3A2E" }}>
          🏢 24층 씻기 빌딩
        </h1>
        <p className="text-xs mt-1" style={{ color: "#8FAF97" }}>블록을 눌러서 씻기 순서를 확인해요</p>
      </div>

      {/* 스카이라운지 보상 배너 */}
      {showReward && (
        <div className="mx-4 mt-3 rounded-2xl p-4 flex items-center gap-3"
          style={{
            background: "#FFF8D6",
            border: "2px solid #F5C842",
            boxShadow: "0 4px 0 #E0A800, 0 8px 16px rgba(245,200,66,0.2)",
          }}>
          <Kaechi mood="happy" size={48} animate={false} />
          <div>
            <p className="font-extrabold text-sm" style={{ color: "#7B5EA7" }}>🎊 스카이라운지 입장!</p>
            <p className="text-xs mt-0.5" style={{ color: "#9B7EC7" }}>나의 씻기 순서가 1위예요!</p>
          </div>
        </div>
      )}

      {/* 계단 빌딩 */}
      <div className="flex-1 px-4 pt-4 pb-32 overflow-y-auto">

        {/* 스카이라운지 */}
        <div className="flex justify-center mb-2">
          <div className="rounded-2xl px-6 py-3 text-center font-extrabold text-sm"
            style={{
              background: "linear-gradient(135deg,#F5C842,#E0A800)",
              color: "#7B5EA7",
              border: "2px solid #FFE566",
              minWidth: 180,
              boxShadow: "0 4px 0 #C08800, 0 8px 16px rgba(245,200,66,0.3)",
            }}>
            🌟 스카이라운지
            <div className="text-xs font-normal mt-0.5" style={{ opacity: 0.75 }}>여기 도달하면 보상!</div>
          </div>
        </div>
        <div className="text-center text-xl mb-2 opacity-50">☁️ ☁️ ☁️</div>

        {/* 계단 블록 */}
        <div className="flex flex-col" style={{ gap: 2 }}>
          {Array.from({ length: total }, (_, i) => {
            const floor = total - i;
            const rankIdx = total - floor;
            const item = ranking[rankIdx];
            if (!item) return null;

            const isMine = orderKey(item.order) === myKey;
            const isTop = floor === total;
            const isBottom = floor === 1;
            const isSelected = selectedFloor === floor;

            const widthPct = 100 - (floor / total) * 50;
            const indent = (100 - widthPct) / 2;

            let bg = "#FFFFFF";
            let borderColor = "#C2E4CF";
            let shadow = "0 2px 0 #C2E4CF";
            if (isMine)    { bg = "#EDF7F1"; borderColor = "#5BAF7A"; shadow = "0 2px 0 #3D8A5C"; }
            if (isTop)     { bg = "#FFF8D6"; borderColor = "#F5C842"; shadow = "0 2px 0 #E0A800"; }
            if (isBottom)  { bg = "#F2FAF5"; borderColor = "#C2E4CF"; shadow = "0 2px 0 #A8D8BC"; }
            if (isSelected){ bg = "#EDF7F1"; borderColor = "#3D8A5C"; }

            return (
              <div key={orderKey(item.order)} ref={isMine ? myFloorRef : null} style={{ marginLeft: `${indent}%`, width: `${widthPct}%` }}>
                <button
                  onClick={() => setSelectedFloor(isSelected ? null : floor)}
                  className="w-full text-left transition-all active:scale-95">
                  <div className="rounded-2xl flex items-center relative"
                    style={{
                      paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
                      background: bg,
                      border: `2px solid ${borderColor}`,
                      boxShadow: shadow,
                    }}>
                    {/* 층수 (선택 안됐을 때) */}
                    {!isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center font-extrabold"
                        style={{ fontSize: 15, color: isMine ? "#3D8A5C" : isBottom ? "#8FAF97" : "#2D3A2E" }}>
                        {isMine && <Kaechi mood="mini" size={20} animate={false} />}
                        {isTop ? "🌟" : isBottom ? "🔧" : `${floor}층`}
                        {isMine && <span className="text-xs font-bold ml-1" style={{ color: "#5BAF7A" }}>나의 층</span>}
                      </span>
                    )}

                    {/* 씻기 순서 (선택됐을 때) */}
                    {isSelected && (
                      <div className="flex-1 flex items-center justify-center gap-0.5">
                        {item.order.map((id, j) => {
                          const el = WASH_ELEMENTS.find(e => e.id === id)!;
                          return (
                            <span key={id} className="flex items-center gap-0.5">
                              <Image src={WASH_CHAR[id]} alt={el.label} width={28} height={28} style={{ objectFit: "contain" }} />
                              {j < item.order.length - 1 && (
                                <span className="text-xs" style={{ color: "#C2E4CF" }}>→</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* 점수 */}
                    <span className="text-xs tabular-nums flex-shrink-0 font-bold"
                      style={{ color: item.score > 0 ? "#4CAF7A" : item.score < 0 ? "#E05A5A" : "#8FAF97", marginRight: 8, minWidth: 28, textAlign: "right" }}>
                      {item.score > 0 ? `👍${item.score}` : item.score < 0 ? `👎${Math.abs(item.score)}` : "0"}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* 보일러실 */}
        <div className="flex justify-center mt-3 mb-2">
          <div className="rounded-xl px-5 py-2 text-xs font-bold text-center"
            style={{ background: "#D4EDE0", color: "#8FAF97", border: "2px solid #C2E4CF" }}>
            🔧 보일러실 (꼴찌)
          </div>
        </div>

        <p className="text-center text-xs mt-4 px-4 leading-relaxed" style={{ color: "#8FAF97" }}>
          블록을 누르면 씻기 순서를 볼 수 있어요 🐥<br/>
          내 순서가 24층에 도달하면 스카이라운지 입장!
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
