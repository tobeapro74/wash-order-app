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
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const myFloorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const my = loadMyOrder();
    if (!my) { router.replace("/setup"); return; }
    setMyOrder(my);
    apiGetRankings().then(serverRankings => {
      if (serverRankings.length > 0) {
        setRanking(serverRankings.map(r => ({ order: r.order as ElementId[], score: r.score })));
      }
    }).catch(() => {
      setRanking(getRanking(loadScores()));
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
      style={{ background: "linear-gradient(180deg,#EAF7EE 0%,#D8F0E0 60%,#C7ECD9 100%)" }}>

      {/* 헤더 */}
      <div className="text-center flex-shrink-0" style={{ paddingTop: 56, paddingBottom: 8 }}>
        <h1 style={{
          fontSize: 38, fontWeight: 900, color: "#1F6E42",
          letterSpacing: "-0.5px", lineHeight: 1.15,
        }}>
          24층 씻기 빌딩
        </h1>
        <p style={{ fontSize: 14, color: "#5C6B60", marginTop: 4 }}>
          24층 씻기 빌딩 점당 보드
        </p>
      </div>

      {/* 빌딩 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 100 }}>

        {/* 구름 + 스카이라운지 블록 */}
        <div style={{ textAlign: "center", marginBottom: 0, paddingTop: 8 }}>
          <div style={{ fontSize: 26, letterSpacing: 12, marginBottom: 4 }}>☁️⭐☁️</div>
        </div>

        {/* 스카이라운지 골드 블록 — 전체 너비 */}
        <div style={{ position: "relative", marginLeft: 0, marginRight: 0 }}>
          {/* 상면 */}
          <div style={{
            background: "linear-gradient(180deg,#FCE18A 0%,#F5C84B 100%)",
            height: 80,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 2,
          }}>
            <span style={{ fontSize: 28 }}>🏆</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#7C6FE0" }}>스카이라운지</span>
          </div>
          {/* 줄눈(골드 측면) */}
          <div style={{
            height: 14,
            background: "linear-gradient(180deg,#D89B1F 0%,#B87810 100%)",
            boxShadow: "0 6px 12px rgba(180,120,0,0.35)",
          }} />
        </div>

        {/* 각 층 블록 */}
        {Array.from({ length: total }, (_, i) => {
          const floor    = total - i;
          const rankIdx  = total - floor;
          const item     = ranking[rankIdx];
          if (!item) return null;

          const isMine     = orderKey(item.order) === myKey;
          const isTop      = floor === total;
          const isSelected = selectedFloor === floor;

          // 상면 색
          const topBg  = isTop
            ? "linear-gradient(180deg,#FCE18A 0%,#F5C84B 100%)"
            : isMine
            ? "linear-gradient(180deg,#B8F0D0 0%,#9FE0B8 100%)"
            : "linear-gradient(180deg,#C7ECD9 0%,#B0DCC5 100%)";

          // 측면(줄눈) 색
          const sideBg = isTop ? "#C89010"
            : isMine  ? "#2E8C56"
            : "#7BC4A0";

          // 내 층 glow
          const glowStyle = isMine ? {
            boxShadow: "0 0 0 2.5px #3FA96B, 0 0 24px 6px rgba(63,169,107,0.65)",
          } : {};

          // 내 층 높이 더 크게
          const blockH = isMine ? 80 : 58;

          return (
            <div key={orderKey(item.order)}
              ref={isMine ? myFloorRef : null}
              style={{ position: "relative", marginBottom: 0 }}>

              {/* 블록 상면 — 전체 너비 */}
              <button
                onClick={() => setSelectedFloor(isSelected ? null : floor)}
                className="w-full active:scale-[0.99] transition-transform"
                style={{ display: "block", position: "relative" }}>

                <div style={{
                  background: topBg,
                  height: blockH,
                  display: "flex", alignItems: "center",
                  paddingLeft: 20,
                  paddingRight: isMine ? 20 : 72, // 우측 pill 공간
                  ...glowStyle,
                  position: "relative",
                  overflow: "visible",
                }}>

                  {/* 미선택: 층수 텍스트 */}
                  {!isSelected && (
                    <>
                      {isMine ? (
                        /* 내 층: 큰 텍스트 좌측 + 캐릭터 중앙우측 */
                        <>
                          <div style={{ zIndex: 2 }}>
                            <p style={{ fontSize: 22, fontWeight: 900, color: "#1F6E42", lineHeight: 1.1 }}>
                              {floor}층
                            </p>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#3FA96B" }}>나의 층</p>
                          </div>
                          {/* 캐릭터 — 블록 중앙 우측 */}
                          <div style={{
                            position: "absolute", right: 32, bottom: 0,
                            width: 64, height: 72,
                          }}>
                            <Kaechi mood="mini" size={64} animate={false} />
                          </div>
                        </>
                      ) : (
                        <p style={{
                          fontSize: 15, fontWeight: 700,
                          color: isTop ? "#7C6FE0" : "#2D3A2E",
                        }}>
                          {isTop ? "🌟" : `${floor}층`}
                        </p>
                      )}
                    </>
                  )}

                  {/* 선택됨: 씻기 순서 표시 */}
                  {isSelected && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center" }}>
                      {item.order.map((id, j) => {
                        const el = WASH_ELEMENTS.find(e => e.id === id)!;
                        return (
                          <span key={id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Image src={WASH_CHAR[id]} alt={el.label}
                              width={32} height={32} style={{ objectFit: "contain" }} />
                            {j < item.order.length - 1 && (
                              <span style={{ color: "#3FA96B", fontSize: 12 }}>→</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 줄눈(측면) */}
                <div style={{
                  height: 12,
                  background: sideBg,
                  boxShadow: "0 5px 10px rgba(0,0,0,0.12)",
                }} />

                {/* 점수 pill — 블록 우측 바깥으로 튀어나옴 (내 층 제외) */}
                {!isMine && !isSelected && (
                  <div style={{
                    position: "absolute",
                    right: -8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10,
                    background: "rgba(255,255,255,0.92)",
                    borderRadius: 999,
                    padding: "4px 10px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.13)",
                    display: "flex", alignItems: "center", gap: 3,
                    minWidth: 60,
                    justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 13 }}>👍</span>
                    <span style={{
                      fontSize: 13, fontWeight: 800,
                      color: item.score > 0 ? "#2E8C56" : "#5C6B60",
                    }}>
                      {item.score}
                    </span>
                  </div>
                )}
              </button>
            </div>
          );
        })}

        {/* 보일러실 */}
        <div style={{ textAlign: "center", marginTop: 12, marginBottom: 8 }}>
          <span style={{
            display: "inline-block",
            background: "#D8F0E0", borderRadius: 20,
            padding: "6px 20px", fontSize: 12, fontWeight: 700, color: "#5C6B60",
            border: "2px solid #9FE0B8",
          }}>
            🔧 보일러실 (꼴찌)
          </span>
        </div>

        <p style={{
          textAlign: "center", fontSize: 12, color: "#5C6B60",
          lineHeight: 1.6, padding: "0 24px", marginTop: 8,
        }}>
          블록을 누르면 씻기 순서를 볼 수 있어요 🐥<br/>
          내 순서가 24층에 도달하면 스카이라운지 입장!
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
