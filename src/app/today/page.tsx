"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ElementId, loadMyOrder, getTodayOrder, vote, markVotedToday,
  hasVotedToday, WASH_ELEMENTS, DISLIKE_REASONS, randomCopy, orderKey,
} from "@/lib/wash";
import { apiVote } from "@/lib/api";
import LotteryMachine from "./LotteryMachine";
import { Kaechi, WASH_CHAR } from "@/components/Kaechi";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

type Phase = "spin" | "result" | "voted";

// 점선 원형 화살표 — 시계방향: 좌상→우상→우하→좌하→좌상
// SVG arc: sweep-flag=1 이 시계방향
function DottedArrow() {
  return (
    <svg viewBox="0 0 260 260" width="100%" height="100%"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <marker id="arr" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L0,8 L8,4 Z" fill="#3FA96B"/>
        </marker>
      </defs>
      {/* 시계방향 4호: top→right→bottom→left */}
      <path d="M 100 45  A 85 85 0 0 1 215 100" fill="none"
        stroke="#3FA96B" strokeWidth="2.5" strokeDasharray="4 5"
        strokeLinecap="round" markerEnd="url(#arr)" />
      <path d="M 215 160 A 85 85 0 0 1 160 215" fill="none"
        stroke="#3FA96B" strokeWidth="2.5" strokeDasharray="4 5"
        strokeLinecap="round" markerEnd="url(#arr)" />
      <path d="M 100 215 A 85 85 0 0 1 45 160" fill="none"
        stroke="#3FA96B" strokeWidth="2.5" strokeDasharray="4 5"
        strokeLinecap="round" markerEnd="url(#arr)" />
      <path d="M 45 100  A 85 85 0 0 1 100 45" fill="none"
        stroke="#3FA96B" strokeWidth="2.5" strokeDasharray="4 5"
        strokeLinecap="round" markerEnd="url(#arr)" />
    </svg>
  );
}

// 2×2 그리드 위치 — 시계방향: 좌상→우상→우하→좌하
const GRID_POS = [
  { top: "18%",  left: "18%"  },   // 1번 START (좌상)
  { top: "18%",  right: "18%" },   // 2번 (우상)
  { top: "68%",  right: "18%" },   // 3번 (우하)
  { top: "68%",  left: "18%"  },   // 4번 (좌하)
];

// 씻기 순서 2×2 그리드 (result/voted 공용)
function OrderGrid({ order, showConfetti, isJoker, mood }: {
  order: ElementId[];
  showConfetti?: boolean;
  isJoker?: boolean;
  mood: "wave" | "happy";
}) {
  return (
    <div style={{ position: "relative", width: "100%", paddingBottom: "80%", marginBottom: 8 }}>
      <DottedArrow />
      {order.map((id, i) => {
        const el = WASH_ELEMENTS.find(e => e.id === id)!;
        const pos = GRID_POS[i];
        const isRight = "right" in pos;
        return (
          <div key={i}
            className="absolute flex flex-col items-center"
            style={{ ...pos, transform: isRight ? "translateX(50%)" : "translateX(-50%)", gap: 4 }}>
            {/* 1번 시작점 뱃지 */}
            {i === 0 && (
              <div style={{
                position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                background: "linear-gradient(180deg,#3FA96B 0%,#2E8C56 100%)",
                borderRadius: 999, padding: "2px 10px",
                fontSize: 11, fontWeight: 800, color: "#fff",
                letterSpacing: "0.05em", whiteSpace: "nowrap",
                boxShadow: "0 2px 6px rgba(46,140,86,0.4)",
                zIndex: 5,
              }}>
                START
              </div>
            )}
            <Image src={WASH_CHAR[id]} alt={el.label}
              width={88} height={88} style={{ objectFit: "contain" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1E2A22" }}>
              {el.label}
            </span>
          </div>
        );
      })}
      {/* 중앙 마스코트 */}
      <div className="absolute" style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 2 }}>
        {showConfetti && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none" style={{ zIndex: 3 }}>
            {["🎉","✨","🎊","⭐","🎉"].map((e, idx) => (
              <span key={idx} className="confetti-particle text-base"
                style={{ animationDelay: `${idx * 0.1}s` }}>{e}</span>
            ))}
          </div>
        )}
        <Kaechi mood={mood} size={120} animate={false} />
      </div>
    </div>
  );
}

export default function TodayPage() {
  const router = useRouter();
  useAuth();  // 비로그인 시 /login 리다이렉트
  const [myOrder,      setMyOrder]      = useState<ElementId[] | null>(null);
  const [resultOrder,  setResultOrder]  = useState<ElementId[] | null>(null);
  const [isJoker,      setIsJoker]      = useState(false);
  const [phase,        setPhase]        = useState<Phase>("spin");
  const [copy,         setCopy]         = useState("");
  const [showDislike,  setShowDislike]  = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const my = loadMyOrder();
    if (!my) { router.replace("/setup"); return; }
    setMyOrder(my);
    const today = getTodayOrder();
    if (hasVotedToday()) { setResultOrder(today); setPhase("voted"); }
    setCopy(randomCopy());
  }, [router]);

  const handleResult = (order: ElementId[], joker: boolean) => {
    setResultOrder(order);
    setIsJoker(joker);
    setPhase("result");
    if (joker) setShowConfetti(true);
  };

  const handleLike = () => {
    if (!resultOrder) return;
    vote(resultOrder, true);
    markVotedToday();
    apiVote(orderKey(resultOrder), true);
    setPhase("voted");
  };

  const handleDislikeConfirm = () => {
    if (!resultOrder) return;
    vote(resultOrder, false);
    markVotedToday();
    apiVote(orderKey(resultOrder), false);
    setShowDislike(false);
    setPhase("voted");
  };

  return (
    <div className="flex flex-col min-h-dvh"
      style={{ background: "linear-gradient(180deg,#EAF7EE 0%,#D8F0E0 45%,#C7ECD9 100%)" }}>

      {/* ══════════════ SPIN 화면 ══════════════ */}
      {phase === "spin" && (
        <div className="flex-1 flex flex-col items-center px-5"
          style={{ paddingTop: 56, paddingBottom: "calc(env(safe-area-inset-bottom) + 100px)" }}>

          {/* 마스코트 — 이미지 목표: 보라 로브+지팡이, 현재 에셋 기준 크게 */}
          <div style={{ marginBottom: 8 }}>
            <Kaechi mood="normal" size={120} />
          </div>

          {/* 타이틀 — 이미지처럼 초대형 Extra Bold */}
          <h1 className="text-center"
            style={{
              fontSize: 38,
              fontWeight: 900,
              color: "#1E2A22",
              letterSpacing: "-1px",
              lineHeight: 1.1,
            }}>
            오늘의 씻기 순서
          </h1>
          <p className="text-center mt-2" style={{ fontSize: 16, color: "#5C6B60", fontWeight: 400 }}>
            오늘은 어디부터 씻을까요?
          </p>

          {/* 여백 */}
          <div style={{ height: 20 }} />

          {/* 로또볼 머신 */}
          <LotteryMachine onResult={handleResult} />
        </div>
      )}

      {/* ══════════════ RESULT 화면 ══════════════ */}
      {phase === "result" && resultOrder && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", padding: "0 20px 120px",
        }}>

          {/* 마스코트 + 글로우 */}
          <div style={{
            marginTop: 40, position: "relative",
            width: 140, height: 140,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {/* 글로우 원 */}
            <div style={{
              position: "absolute", inset: -20, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(245,200,75,0.35) 0%, rgba(245,200,75,0) 70%)",
              filter: "blur(4px)",
            }} />
            {/* sparkle */}
            {["✦","✦","✦"].map((s, i) => (
              <span key={i} style={{
                position: "absolute",
                top: ["-8px","10px","-4px"][i],
                left: ["-12px","140px","120px"][i],
                fontSize: [14, 10, 12][i],
                color: "#F5C84B",
                opacity: 0.9,
              }}>{s}</span>
            ))}
            <Kaechi mood={isJoker ? "happy" : "normal"} size={140} animate />
            {showConfetti && (
              <div style={{
                position: "absolute", top: -16, left: "50%",
                transform: "translateX(-50%)",
                display: "flex", gap: 4, pointerEvents: "none", zIndex: 3,
              }}>
                {["🎉","✨","🎊","⭐","🎉"].map((e, i) => (
                  <span key={i} className="confetti-particle"
                    style={{ fontSize: 16, animationDelay: `${i * 0.1}s` }}>{e}</span>
                ))}
              </div>
            )}
          </div>

          {/* 말풍선 태그 */}
          <div style={{
            alignSelf: "flex-end", marginTop: -12, marginBottom: 4,
            background: "rgba(255,255,255,0.92)",
            borderRadius: 999, padding: "8px 16px",
            fontSize: 14, fontWeight: 500, color: "#1F6E42",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            position: "relative",
          }}>
            🐣 씻기 요정이 정했어요.
            {/* 말풍선 꼬리 */}
            <span style={{
              position: "absolute", top: "50%", left: -8,
              transform: "translateY(-50%)",
              width: 0, height: 0,
              borderTop: "6px solid transparent",
              borderBottom: "6px solid transparent",
              borderRight: "8px solid rgba(255,255,255,0.92)",
            }} />
          </div>

          {/* 결과 카드 */}
          <div className="bounce-in" style={{
            width: "100%",
            borderRadius: 28,
            padding: "24px 16px",
            background: isJoker
              ? "linear-gradient(180deg,#FBEFC9 0%,#F7E8B8 100%)"
              : "linear-gradient(180deg,#FFFFFF 0%,#D8F0E0 100%)",
            boxShadow: "0 10px 24px rgba(31,110,66,0.12)",
            marginBottom: 20,
          }}>
            {/* 카드 타이틀 */}
            <p style={{
              textAlign: "center", fontSize: 18, fontWeight: 800,
              color: "#1E2A22", marginBottom: 16,
              letterSpacing: "-0.3px",
            }}>
              {isJoker ? "⭐ 나의 루틴 당첨!" : "4단 세탁 순서"}
            </p>

            {/* 가로 4단 아이콘 로우 — 아이콘 54px + 화살표 22px × 3 = 270px (여유 있음) */}
            <div style={{
              display: "flex", alignItems: "flex-start",
              justifyContent: "center", gap: 0,
            }}>
              {resultOrder.map((id, i) => {
                const el = WASH_ELEMENTS.find(e => e.id === id)!;
                return (
                  <div key={id} style={{ display: "contents" }}>
                    {/* 아이콘 + 라벨 */}
                    <div style={{
                      display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 6, flexShrink: 0, width: 60,
                    }}>
                      <div style={{
                        width: 54, height: 54, borderRadius: "50%",
                        background: "#D8F0E0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.04)",
                      }}>
                        <Image src={WASH_CHAR[id]} alt={el.label}
                          width={44} height={44} style={{ objectFit: "contain" }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1E2A22" }}>
                        {el.label}
                      </span>
                    </div>
                    {/* 곡선 점선 화살표 */}
                    {i < resultOrder.length - 1 && (
                      <svg width="22" height="24" viewBox="0 0 22 24"
                        style={{ flexShrink: 0, marginTop: 15 }}>
                        <path d="M2 19 Q11 -2 20 19"
                          stroke="#9B8FD4" strokeWidth="2"
                          strokeDasharray="3 3" strokeLinecap="round" fill="none" />
                        <path d="M17 16 L20 19 L17 22"
                          stroke="#9B8FD4" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 투표 버튼 */}
          <div style={{ width: "100%", display: "flex", gap: 12, marginBottom: 16 }}>
            <button onClick={handleLike} style={{
              flex: 1, height: 60, borderRadius: 999, border: "none",
              background: "linear-gradient(180deg,#4CBE7C 0%,#2E8C56 100%)",
              color: "#fff", fontSize: 17, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 8px 20px rgba(46,140,86,0.35)",
              cursor: "pointer",
            }}>
              👍 좋아요 ✨
            </button>
            <button onClick={() => setShowDislike(true)} style={{
              flex: 1, height: 60, borderRadius: 999,
              background: "#FFFFFF", color: "#D9564A",
              fontSize: 17, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              border: "2px solid #F0857A",
              boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
              cursor: "pointer",
            }}>
              👎 싫어요
            </button>
          </div>

          {/* 빌딩 순위 보기 — 세컨더리 pill */}
          <button onClick={() => router.push("/building")} style={{
            height: 44, padding: "0 24px", borderRadius: 999, border: "none",
            background: "#D8F0E0", color: "#1F6E42",
            fontSize: 15, fontWeight: 600, cursor: "pointer",
            boxShadow: "0 2px 8px rgba(31,110,66,0.10)",
          }}>
            빌딩 순위 보기 →
          </button>
        </div>
      )}

      {/* ══════════════ VOTED 화면 ══════════════ */}
      {phase === "voted" && resultOrder && (
        <div className="flex-1 flex flex-col items-center px-5 pb-28"
          style={{ paddingTop: 24 }}>

          {/* 타이틀 — 대형, 중앙정렬 */}
          <h1 className="text-center bounce-in"
            style={{
              fontSize: 38, fontWeight: 900,
              color: "#1E2A22", lineHeight: 1.2,
              letterSpacing: "-1px", marginBottom: 24,
            }}>
            오늘은<br/>어디부터 씻을까요?
          </h1>

          {/* 순서 카드 */}
          <div className="w-full bounce-in"
            style={{
              background: "#D8F0E0",
              borderRadius: 24,
              padding: 24,
              boxShadow: "0 6px 20px rgba(31,110,66,0.13)",
              position: "relative",
            }}>

            {/* 카드 내부 타이틀 */}
            <p className="text-center"
              style={{ fontSize: 15, fontWeight: 600, color: "#1E2A22", marginBottom: 16 }}>
              오늘의 씻기 순서
            </p>

            {/* 2×2 그리드 + 마스코트 + 점선 화살표 */}
            <OrderGrid order={resultOrder} mood="wave" />

            {/* 완료 메시지 */}
            <div className="text-center" style={{ marginTop: 8 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#1F6E42" }}>
                오늘 평가를 완료했어요 ✅
              </p>
              <p style={{ fontSize: 13, color: "#5C6B60", lineHeight: 1.6, marginTop: 6 }}>
                내일 아침에 다시 돌아와요!<br/>씻기 요정 캐치가 기다리고 있을게요 🐥
              </p>
            </div>
          </div>

          {/* CTA 버튼 */}
          <button onClick={() => router.push("/building")}
            style={{
              width: "100%", marginTop: 20,
              height: 56, borderRadius: 999,
              background: "linear-gradient(180deg,#4CBE7C 0%,#2E8C56 100%)",
              boxShadow: "0 8px 20px rgba(46,140,86,0.35)",
              fontSize: 17, fontWeight: 700, color: "#FFFFFF",
              letterSpacing: "0.02em", border: "none", cursor: "pointer",
            }}>
            빌딩 순위 확인하기
          </button>
        </div>
      )}

      <BottomNav />

      {/* 개발용 리셋 */}
      <button
        onClick={() => {
          localStorage.removeItem("wash_today");
          localStorage.removeItem("wash_voted_today");
          setResultOrder(null);
          setPhase("spin");
        }}
        className="fixed top-4 right-4 z-50 text-[10px] rounded px-2 py-1"
        style={{ background: "rgba(0,0,0,0.08)", color: "rgba(0,0,0,0.3)" }}>
        리셋
      </button>

      {/* 싫어요 바텀시트 */}
      {showDislike && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDislike(false)} />
          <div className="relative bg-white rounded-t-3xl z-10"
            style={{ padding: "24px 28px 40px" }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "#D8F0E0" }} />
            <div className="flex items-center gap-3 mb-4">
              <Kaechi mood="question" size={44} animate={false} />
              <p className="font-bold text-base" style={{ color: "#1E2A22" }}>어떤 점이 싫었나요?</p>
            </div>
            <div className="flex flex-col gap-2">
              {DISLIKE_REASONS.map((reason) => (
                <button key={reason} onClick={handleDislikeConfirm}
                  className="w-full text-left rounded-2xl text-sm font-semibold"
                  style={{ background: "#EAF7EE", color: "#1E2A22", padding: "12px 20px" }}>
                  {reason}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
