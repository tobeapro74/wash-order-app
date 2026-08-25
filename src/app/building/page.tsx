"use client";

// ❌ 절대 금지: 풀와이드 rounded-rect 리스트 / 모든 층 동일 폭 / 스카이라운지 풀와이드 바
// ✅ 필수: 층마다 폭이 다른 사다리꼴 타워 / 중심축 정렬 / 스카이라운지 독립 골드 큐브

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ElementId, loadMyOrder, loadScores, getRanking, orderKey, WASH_ELEMENTS,
} from "@/lib/wash";
import { apiGetRankings } from "@/lib/api";
import { Kaechi, WASH_CHAR } from "@/components/Kaechi";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

// 층별 블록 폭: 상층(23층)이 230px, 내려갈수록 6px씩 넓어짐
// 최상층=화면폭의 55%, 최하층=화면폭의 90% 사이를 균등 분배
// 화면폭은 320~430px 사이로 클램프 (모바일 기준)
function widthForFloor(floor: number, topFloor: number): number {
  // 앱 컨테이너는 최대 480px — 그 이상은 480으로 클램프
  const containerW = typeof window !== "undefined"
    ? Math.min(window.innerWidth, 480)
    : 375;
  const vw = Math.min(Math.max(containerW, 320), 480);
  const minW = Math.round(vw * 0.55);
  const maxW = Math.round(vw * 0.90);
  if (topFloor <= 1) return minW;
  return Math.round(minW + ((topFloor - floor) / (topFloor - 1)) * (maxW - minW));
}

// 순서 전체 확대 모달
function OrderZoomModal({ order, onClose }: { order: ElementId[]; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 24px",
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 360,
          background: "linear-gradient(180deg,#EAF7EE 0%,#D8F0E0 100%)",
          borderRadius: 28,
          padding: "32px 24px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
          boxShadow: "0 16px 48px rgba(0,0,0,0.22)",
        }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: "#1F6E42", margin: 0 }}>씻기 순서</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          {order.map((id, i) => {
            const el = WASH_ELEMENTS.find(e => e.id === id)!;
            return (
              <span key={id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <Image src={WASH_CHAR[id]} alt={el.label}
                    width={72} height={72} style={{ objectFit: "contain" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1E2A22" }}>{el.label}</span>
                </span>
                {i < order.length - 1 &&
                  <span style={{ color: "#3FA96B", fontSize: 18, fontWeight: 700 }}>→</span>}
              </span>
            );
          })}
        </div>
        <button onClick={onClose} style={{
          fontSize: 13, color: "#5C6B60",
          background: "none", border: "none", cursor: "pointer",
        }}>닫기</button>
      </div>
    </div>
  );
}

export default function BuildingPage() {
  const router = useRouter();
  useAuth();  // 비로그인 시 /login 리다이렉트
  const [myOrder,       setMyOrder]       = useState<ElementId[] | null>(null);
  const [ranking,       setRanking]       = useState<{ order: ElementId[]; score: number; likes: number; dislikes: number }[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [zoomOrder,     setZoomOrder]     = useState<ElementId[] | null>(null);
  const myFloorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const my = loadMyOrder();
    if (!my) { router.replace("/setup"); return; }
    setMyOrder(my);
    apiGetRankings()
      .then(serverRankings => {
        if (serverRankings.length > 0)
          setRanking(serverRankings.map(r => ({ order: r.order as ElementId[], score: r.score, likes: r.likes ?? 0, dislikes: r.dislikes ?? 0 })));
      })
      .catch(() => setRanking(getRanking(loadScores()).map(r => ({ ...r, likes: 0, dislikes: 0 }))));
  }, [router]);

  useEffect(() => {
    if (myFloorRef.current) {
      myFloorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [ranking]);

  const myKey = myOrder ? orderKey(myOrder) : "";
  const total = ranking.length;

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(180deg, #EAF7EE 0%, #D8F0E0 50%, #F7ECC9 100%)",
    }}>

      {/* 타이틀 영역 */}
      <div style={{ textAlign: "center", paddingTop: 56, paddingBottom: 16, flexShrink: 0 }}>
        <h1 style={{
          fontSize: 36, fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1.15,
          background: "linear-gradient(180deg, #3FA96B 0%, #1F6E42 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          24층 씻기 빌딩
        </h1>
        <p style={{ fontSize: 14, color: "#5C6B60", marginTop: 4 }}>
          24층 씻기 빌딩 점당 보드
        </p>
      </div>

      {/* 타워 스크롤 영역 */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>

        {/* 타워 전체를 중앙 정렬 컨테이너로 감쌈 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "8px 0 16px" }}>

          {/* ── 스카이라운지: 독립 골드 큐브 ── */}
          <div style={{ position: "relative", width: 220 }}>
            {/* 구름 좌우 */}
            <div style={{ position: "absolute", top: -24, left: -60, fontSize: 32, opacity: 0.9 }}>☁️</div>
            <div style={{ position: "absolute", top: -18, right: -60, fontSize: 28, opacity: 0.9 }}>☁️</div>

            {/* 트로피 (블록 위로 튀어나옴) */}
            <div style={{ textAlign: "center", marginBottom: -12, position: "relative", zIndex: 2 }}>
              <span style={{ fontSize: 40, filter: "drop-shadow(0 2px 8px rgba(216,155,31,0.6))" }}>🏆</span>
            </div>

            {/* 골드 큐브 상면 */}
            <div style={{
              width: 220, height: 90,
              background: "linear-gradient(180deg, #FCE18A 0%, #F5C84B 60%, #D89B1F 100%)",
              borderRadius: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.4) inset, 0 6px 20px rgba(216,155,31,0.4)",
              position: "relative", zIndex: 1,
            }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: "white",
                textShadow: "0 1px 4px rgba(0,0,0,0.25)" }}>
                스카이라운지
              </span>
            </div>

            {/* 큐브 측면(줄눈) */}
            <div style={{
              width: 220, height: 10,
              background: "linear-gradient(180deg, #C89010 0%, #A07000 100%)",
              borderRadius: "0 0 10px 10px",
              boxShadow: "0 6px 12px rgba(180,110,0,0.35)",
            }} />
          </div>

          {/* ── 일반 층 블록들 ── */}
          {Array.from({ length: total }, (_, i) => {
            const floor    = total - i;
            const rankIdx  = total - floor;
            const item     = ranking[rankIdx];
            if (!item) return null;

            const isMine     = orderKey(item.order) === myKey;
            const isTop      = floor === total;
            const isSelected = selectedFloor === floor;
            const w          = widthForFloor(floor, total);  // px 단위 고정폭
            const blockH     = isMine ? 76 : 60;

            return (
              <div key={orderKey(item.order)}
                ref={isMine ? myFloorRef : null}
                style={{ position: "relative", width: w }}>

                {/* 내 층 캐릭터: 블록 우측 바깥에 absolute */}
                {isMine && (
                  <div style={{
                    position: "absolute",
                    right: -64,
                    bottom: 10,
                    zIndex: 10,
                    width: 56, height: 56,
                  }}>
                    <Kaechi mood="mini" size={56} animate={false} />
                  </div>
                )}

                <button
                  onClick={() => setSelectedFloor(isSelected ? null : floor)}
                  style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer" }}>

                  {/* 블록 상면 */}
                  <div style={{
                    width: w,
                    height: blockH,
                    background: isMine
                      ? "linear-gradient(180deg, #B8F5D0 0%, #9FE0B8 100%)"
                      : isTop
                      ? "linear-gradient(180deg, #FCE18A 0%, #F5C84B 100%)"
                      : "linear-gradient(180deg, #C7ECD9 0%, #A8D8C0 100%)",
                    borderRadius: 14,
                    position: "relative",
                    overflow: "visible",
                    // 하이라이트: 상단 안쪽 밝은 줄
                    boxShadow: isMine
                      ? "0 0 0 2.5px #3FA96B, 0 0 0 5px rgba(63,169,107,0.25), 0 0 24px 6px rgba(63,169,107,0.55), 0 1px 0 rgba(255,255,255,0.6) inset"
                      : "0 1px 0 rgba(255,255,255,0.55) inset, 0 2px 6px rgba(0,0,0,0.06)",
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 16,
                    paddingRight: 16,
                  }}>

                    {!isSelected && (
                      <>
                        {/* 층수 라벨 (좌측) */}
                        <div style={{ flex: 1 }}>
                          {isMine ? (
                            <>
                              <p style={{ fontSize: 20, fontWeight: 900, color: "#1F6E42", lineHeight: 1.1, margin: 0 }}>
                                {floor}층
                              </p>
                              <p style={{ fontSize: 12, fontWeight: 700, color: "#3FA96B", margin: 0 }}>
                                나의 층
                              </p>
                            </>
                          ) : (
                            <p style={{ fontSize: 15, fontWeight: 700, color: "#1E2A22", margin: 0 }}>
                              {isTop ? "🌟" : `${floor}층`}
                            </p>
                          )}
                        </div>

                        {/* 좋아요/싫어요 pill (우측, 모든 층) */}
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <div style={{
                            background: "rgba(255,255,255,0.88)",
                            borderRadius: 999, padding: "4px 9px",
                            display: "flex", alignItems: "center", gap: 3,
                            boxShadow: "0 1px 6px rgba(0,0,0,0.10)",
                          }}>
                            <span style={{ fontSize: 12 }}>👍</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: "#1F6E42" }}>
                              {item.likes}
                            </span>
                          </div>
                          <div style={{
                            background: "rgba(255,255,255,0.88)",
                            borderRadius: 999, padding: "4px 9px",
                            display: "flex", alignItems: "center", gap: 3,
                            boxShadow: "0 1px 6px rgba(0,0,0,0.10)",
                          }}>
                            <span style={{ fontSize: 12 }}>👎</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: "#D9564A" }}>
                              {item.dislikes}
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* 선택됨: 씻기 순서 */}
                    {isSelected && (
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        {item.order.map((id, j) => {
                          const el = WASH_ELEMENTS.find(e => e.id === id)!;
                          return (
                            <span key={id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <button
                                onClick={e => { e.stopPropagation(); setZoomOrder(item.order); }}
                                style={{ background: "none", border: "none", padding: 0, cursor: "zoom-in" }}>
                                <Image src={WASH_CHAR[id]} alt={el.label}
                                  width={30} height={30} style={{ objectFit: "contain", display: "block" }} />
                              </button>
                              {j < item.order.length - 1 &&
                                <span style={{ color: "#3FA96B", fontSize: 11 }}>→</span>}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 블록 측면(줄눈) — 3D 입체감 */}
                  <div style={{
                    width: w,
                    height: 10,
                    background: isMine
                      ? "linear-gradient(180deg, #2E8C56 0%, #1F6E42 100%)"
                      : isTop
                      ? "linear-gradient(180deg, #D89B1F 0%, #B07800 100%)"
                      : "linear-gradient(180deg, #7BC4A0 0%, #5BAF7A 100%)",
                    borderRadius: "0 0 8px 8px",
                    boxShadow: "0 5px 10px rgba(0,0,0,0.13)",
                  }} />
                </button>
              </div>
            );
          })}

          {/* 보일러실 */}
          <div style={{ marginTop: 4 }}>
            <span style={{
              display: "inline-block",
              background: "#D8F0E0", borderRadius: 20,
              padding: "6px 20px", fontSize: 12, fontWeight: 700, color: "#5C6B60",
              border: "2px solid #9FE0B8",
            }}>
              🔧 보일러실 (꼴찌)
            </span>
          </div>

          <p style={{ fontSize: 12, color: "#5C6B60", lineHeight: 1.6, textAlign: "center", padding: "0 24px" }}>
            블록을 누르면 씻기 순서를 볼 수 있어요 🐥<br/>
            내 순서가 24층에 도달하면 스카이라운지 입장!
          </p>
        </div>
      </div>

      <BottomNav />

      {/* 캐릭터 확대 모달 */}
      {zoomOrder && <OrderZoomModal order={zoomOrder} onClose={() => setZoomOrder(null)} />}
    </div>
  );
}
