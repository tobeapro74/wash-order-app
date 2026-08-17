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
  const [myOrder,       setMyOrder]       = useState<ElementId[] | null>(null);
  const [ranking,       setRanking]       = useState<{ order: ElementId[]; score: number }[]>([]);
  const [showReward,    setShowReward]    = useState(false);
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

  const myKey   = myOrder ? orderKey(myOrder) : "";
  const total   = ranking.length;

  // 사다리꼴 원근감: 높은 층일수록 넓음 (floor/total 비례)
  // floor=total(최상층)→100%, floor=1(최하층)→62%
  const blockWidth = (floor: number) => 62 + ((floor - 1) / Math.max(total - 1, 1)) * 38;

  return (
    <div className="flex flex-col min-h-dvh"
      style={{ background: "linear-gradient(180deg,#EAF7EE 0%,#D8F0E0 45%,#C7ECD9 100%)" }}>

      {/* 헤더 */}
      <div className="px-5 pt-14 pb-1 text-center flex-shrink-0">
        <h1 className="font-black text-center"
          style={{
            fontSize: 38,
            letterSpacing: "-0.5px",
            lineHeight: 1.15,
            color: "#1F6E42",
            WebkitTextStroke: "0.5px #1F6E42",
          }}>
          24층 씻기 빌딩
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#5C6B60" }}>
          24층 씻기 빌딩 점당 보드
        </p>
      </div>

      {/* 스카이라운지 1위 보상 배너 */}
      {showReward && (
        <div className="mx-4 mt-3 rounded-2xl p-4 flex items-center gap-3 bounce-in"
          style={{ background: "#FBEFC9", border: "2px solid #F5C84B", boxShadow: "0 4px 12px rgba(245,200,75,0.3)" }}>
          <Kaechi mood="happy" size={48} animate={false} />
          <div>
            <p className="font-bold text-sm" style={{ color: "#7C6FE0" }}>🎊 스카이라운지 입장!</p>
            <p className="text-xs mt-0.5" style={{ color: "#5C6B60" }}>나의 씻기 순서가 1위예요!</p>
          </div>
        </div>
      )}

      {/* 빌딩 스택 */}
      <div className="flex-1 overflow-y-auto pb-32" style={{ paddingTop: 16 }}>

        {/* ── 스카이라운지 블록 (최상단 골드) ── */}
        <div className="flex flex-col items-center" style={{ marginBottom: 4 }}>
          {/* 구름 장식 */}
          <div className="flex items-center gap-4 mb-1" style={{ opacity: 0.85 }}>
            <span style={{ fontSize: 28 }}>☁️</span>
            <span style={{ fontSize: 22 }}>⭐</span>
            <span style={{ fontSize: 28 }}>☁️</span>
          </div>

          {/* 골드 블록 */}
          <div style={{ width: `${blockWidth(total)}%`, maxWidth: 400, position: "relative" }}>
            {/* 블록 상면 */}
            <div className="rounded-t-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(180deg,#FCE18A 0%,#F5C84B 100%)",
                height: 72,
                boxShadow: "0 -2px 0 rgba(255,255,255,0.5) inset",
              }}>
              <div className="text-center">
                <div style={{ fontSize: 28 }}>🏆</div>
                <p className="font-black text-sm" style={{ color: "#7C6FE0" }}>스카이라운지</p>
              </div>
            </div>
            {/* 블록 측면 (3D 효과) */}
            <div className="rounded-b-lg"
              style={{
                background: "linear-gradient(180deg,#D89B1F 0%,#B87B0A 100%)",
                height: 12,
                boxShadow: "0 4px 8px rgba(180,130,0,0.4)",
              }} />
          </div>
        </div>

        {/* ── 층 블록들 ── */}
        <div className="flex flex-col items-center" style={{ gap: 6, paddingLeft: 16, paddingRight: 16 }}>
          {Array.from({ length: total }, (_, i) => {
            const floor    = total - i;
            const rankIdx  = total - floor;
            const item     = ranking[rankIdx];
            if (!item) return null;

            const isMine     = orderKey(item.order) === myKey;
            const isTop      = floor === total;
            const isBottom   = floor === 1;
            const isSelected = selectedFloor === floor;
            const wPct       = blockWidth(floor);

            // 블록 상면 색
            let topBg   = "#9FE0B8";  // mint300
            let sideBg  = "#5BAF7A";
            let border  = "none";
            let shadow  = "0 4px 0 rgba(91,175,122,0.6)";
            if (isTop)   { topBg = "#FCE18A"; sideBg = "#D89B1F"; shadow = "0 4px 0 rgba(216,155,31,0.6)"; }
            if (isBottom){ topBg = "#C7ECD9"; sideBg = "#9FE0B8"; }
            if (isMine)  {
              topBg  = "#B8F0D0";
              sideBg = "#3FA96B";
              border = "2.5px solid #3FA96B";
              shadow = "0 0 0 2.5px #3FA96B, 0 0 20px 4px rgba(63,169,107,0.7), 0 4px 0 #1F6E42";
            }

            return (
              <div key={orderKey(item.order)}
                ref={isMine ? myFloorRef : null}
                style={{ width: `${wPct}%`, maxWidth: 400, position: "relative" }}>

                {/* 내 층 캐릭터 — 블록 우측에 absolute */}
                {isMine && (
                  <div style={{
                    position: "absolute",
                    right: -44,
                    bottom: 8,
                    zIndex: 10,
                    width: 48,
                    height: 48,
                  }}>
                    <Kaechi mood="mini" size={48} animate={false} />
                  </div>
                )}

                <button
                  onClick={() => setSelectedFloor(isSelected ? null : floor)}
                  className="w-full active:scale-95 transition-transform"
                  style={{ borderRadius: 16 }}>

                  {/* 블록 상면 */}
                  <div style={{
                    background: topBg,
                    border,
                    borderRadius: "16px 16px 0 0",
                    height: 56,
                    position: "relative",
                    boxShadow: isMine ? shadow : "none",
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 16,
                    paddingRight: 16,
                  }}>
                    {/* 층수 라벨 (좌측) */}
                    {!isSelected && (
                      <>
                        <div className="flex items-center gap-1.5">
                          {isMine && (
                            <span style={{ fontSize: 16 }}>🐥</span>
                          )}
                          <div>
                            <p className="font-black leading-tight"
                              style={{
                                fontSize: isMine ? 16 : 14,
                                color: isMine ? "#1F6E42" : isTop ? "#7C6FE0" : "#1E2A22",
                                lineHeight: 1.1,
                              }}>
                              {isTop ? "🌟" : isBottom ? "🔧" : `${floor}층`}
                            </p>
                            {isMine && (
                              <p className="font-bold" style={{ fontSize: 11, color: "#3FA96B" }}>
                                나의 층
                              </p>
                            )}
                          </div>
                        </div>

                        {/* 점수 pill (우측) */}
                        <div style={{ marginLeft: "auto" }}>
                          <span className="font-bold tabular-nums"
                            style={{
                              background: "rgba(255,255,255,0.85)",
                              borderRadius: 999,
                              padding: "3px 10px",
                              fontSize: 12,
                              color: item.score > 0 ? "#2E8C56" : item.score < 0 ? "#C04040" : "#5C6B60",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                            }}>
                            {item.score > 0 ? `👍 ${item.score}` : item.score < 0 ? `👎 ${Math.abs(item.score)}` : "👍 0"}
                          </span>
                        </div>
                      </>
                    )}

                    {/* 씻기 순서 (선택됨) */}
                    {isSelected && (
                      <div className="flex-1 flex items-center justify-center gap-1.5">
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

                  {/* 블록 측면 (3D 아랫면) */}
                  <div style={{
                    background: sideBg,
                    borderRadius: "0 0 10px 10px",
                    height: 10,
                    boxShadow: `0 4px 8px rgba(0,0,0,0.15)`,
                    border: isMine ? `2.5px solid #3FA96B` : "none",
                    borderTop: "none",
                  }} />
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

        <p className="text-center text-xs mt-3 px-6 leading-relaxed fade-up" style={{ color: "#5C6B60" }}>
          블록을 누르면 씻기 순서를 볼 수 있어요 🐥<br/>
          내 순서가 24층에 도달하면 스카이라운지 입장!
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
