"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ElementId, loadMyOrder, getTodayOrder, vote, markVotedToday,
  hasVotedToday, WASH_ELEMENTS, DISLIKE_REASONS, randomCopy, orderKey,
} from "@/lib/wash";
import { apiVote, apiGetTodayOrder } from "@/lib/api";
import { RouletteWheel } from "@/components/RouletteWheel";
import { Kaechi, WASH_CHAR } from "@/components/Kaechi";
import { BottomNav } from "@/components/BottomNav";
import Image from "next/image";

type Phase = "spin" | "result" | "voted";

// 점선 원형 화살표 SVG (오늘의 순서 카드 배경)
function DottedArrow() {
  return (
    <svg
      viewBox="0 0 220 220" width={220} height={220}
      className="absolute left-1/2 top-1/2"
      style={{ transform: "translate(-50%,-50%)", pointerEvents: "none" }}
    >
      {/* 좌→상 화살표 (반시계) */}
      <path d="M 44 110 A 66 66 0 0 1 110 44" fill="none"
        stroke="#3FA96B" strokeWidth="2.5" strokeDasharray="5 6"
        strokeLinecap="round" markerEnd="url(#arr)" />
      {/* 상→우 */}
      <path d="M 110 44 A 66 66 0 0 1 176 110" fill="none"
        stroke="#3FA96B" strokeWidth="2.5" strokeDasharray="5 6"
        strokeLinecap="round" markerEnd="url(#arr)" />
      {/* 우→하 */}
      <path d="M 176 110 A 66 66 0 0 1 110 176" fill="none"
        stroke="#3FA96B" strokeWidth="2.5" strokeDasharray="5 6"
        strokeLinecap="round" markerEnd="url(#arr)" />
      {/* 하→좌 */}
      <path d="M 110 176 A 66 66 0 0 1 44 110" fill="none"
        stroke="#3FA96B" strokeWidth="2.5" strokeDasharray="5 6"
        strokeLinecap="round" markerEnd="url(#arr)" />
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 Z" fill="#3FA96B" />
        </marker>
      </defs>
    </svg>
  );
}

export default function TodayPage() {
  const router = useRouter();
  const [myOrder, setMyOrder]     = useState<ElementId[] | null>(null);
  const [resultOrder, setResultOrder] = useState<ElementId[] | null>(null);
  const [isJoker, setIsJoker]     = useState(false);
  const [phase, setPhase]         = useState<Phase>("spin");
  const [copy, setCopy]           = useState("");
  const [showDislike, setShowDislike] = useState(false);
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

  // voted 화면: 4개 캐릭터 위치 (좌상/우상/좌하/우하)
  const GRID_POS = [
    { top: "10%",  left: "12%"  },
    { top: "10%",  right: "12%" },
    { top: "50%",  left: "12%"  },
    { top: "50%",  right: "12%" },
  ];

  return (
    <div className="flex flex-col min-h-dvh"
      style={{ background: "linear-gradient(180deg,#EAF7EE 0%,#D8F0E0 45%,#C7ECD9 100%)" }}>

      {/* ── SPIN 화면 ── */}
      {phase === "spin" && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 pb-28 gap-4">
          {/* 마스코트 */}
          <div style={{ marginTop: 48 }}>
            <Kaechi mood="normal" size={88} />
          </div>
          {/* 타이틀 */}
          <div className="text-center" style={{ marginBottom: 4 }}>
            <h1 className="font-bold leading-tight"
              style={{ fontSize: 22, color: "#1E2A22", letterSpacing: "-0.2px" }}>
              오늘의 씻기 순서
            </h1>
            <p className="mt-1" style={{ fontSize: 14, color: "#5C6B60" }}>
              오늘은 어디부터 씻을까요?
            </p>
          </div>
          <RouletteWheel myOrder={myOrder} onResult={handleResult} />
        </div>
      )}

      {/* ── RESULT 화면 ── */}
      {phase === "result" && resultOrder && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 pb-28 gap-5">
          {/* 캐릭터 */}
          <div className="relative" style={{ marginTop: 48 }}>
            <Kaechi mood={isJoker ? "happy" : "normal"} size={110} />
            {showConfetti && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-none">
                {["🎉","✨","🎊","⭐","🎉"].map((e, i) => (
                  <span key={i} className="confetti-particle text-xl"
                    style={{ animationDelay: `${i * 0.1}s` }}>{e}</span>
                ))}
              </div>
            )}
          </div>

          {/* 결과 카드 */}
          <div className="w-full rounded-3xl p-6 text-center bounce-in"
            style={{
              background: isJoker ? "#FBEFC9" : "#D8F0E0",
              boxShadow: "0 6px 16px rgba(31,110,66,0.12)",
            }}>
            {isJoker && (
              <p className="text-xs font-bold mb-3 tracking-widest" style={{ color: "#7C6FE0" }}>
                ⭐ 나의 루틴 당첨!
              </p>
            )}
            <div className="flex items-center justify-center gap-2 mb-4">
              {resultOrder.map((id, i) => {
                const el = WASH_ELEMENTS.find(e => e.id === id)!;
                return (
                  <span key={id} className="flex items-center gap-2">
                    <span className="flex flex-col items-center gap-1">
                      <Image src={WASH_CHAR[id]} alt={el.label}
                        width={64} height={64} style={{ objectFit: "contain" }} />
                      <span className="text-xs font-semibold" style={{ color: "#1E2A22" }}>
                        {el.label}
                      </span>
                    </span>
                    {i < resultOrder.length - 1 && (
                      <span style={{ fontSize: 18, color: "#3FA96B" }}>→</span>
                    )}
                  </span>
                );
              })}
            </div>
            <p className="text-sm italic" style={{ color: "#5C6B60" }}>"{copy}"</p>
          </div>

          {/* 좋아요/싫어요 */}
          <div className="w-full flex gap-3">
            <button onClick={handleLike}
              className="flex-1 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{
                background: "linear-gradient(180deg,#4CBE7C 0%,#2E8C56 100%)",
                color: "#fff",
                boxShadow: "0 6px 18px rgba(46,140,86,0.3)",
              }}>
              👍 좋아요
            </button>
            <button onClick={() => setShowDislike(true)}
              className="flex-1 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{
                background: "#fff",
                color: "#1E2A22",
                border: "2px solid #D8F0E0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              }}>
              👎 싫어요
            </button>
          </div>

          <button onClick={() => router.push("/building")}
            className="text-sm font-bold" style={{ color: "#3FA96B" }}>
            빌딩 순위 보기 →
          </button>
        </div>
      )}

      {/* ── VOTED 화면 ── */}
      {phase === "voted" && resultOrder && (
        <div className="flex-1 flex flex-col items-center px-5 pb-28" style={{ paddingTop: 64 }}>
          {/* 타이틀 */}
          <h1 className="font-bold text-center mb-6"
            style={{ fontSize: 28, color: "#1E2A22", lineHeight: 1.2, letterSpacing: "-0.3px" }}>
            오늘은<br/>어디부터 씻을까요?
          </h1>

          {/* 순서 카드 — 2×2 그리드 + 중앙 마스코트 */}
          <div className="w-full rounded-3xl p-6 bounce-in"
            style={{
              background: "#D8F0E0",
              boxShadow: "0 6px 16px rgba(31,110,66,0.12)",
              position: "relative",
            }}>
            <p className="text-center font-semibold mb-5"
              style={{ fontSize: 14, color: "#1E2A22" }}>
              오늘의 씻기 순서
            </p>

            {/* 2×2 그리드 */}
            <div style={{ position: "relative", height: 230 }}>
              {/* 점선 화살표 */}
              <DottedArrow />

              {/* 4개 캐릭터 절대배치 */}
              {resultOrder.map((id, i) => {
                const el = WASH_ELEMENTS.find(e => e.id === id)!;
                const pos = GRID_POS[i];
                return (
                  <div key={id}
                    className="absolute flex flex-col items-center gap-1"
                    style={{ ...pos, transform: "translate(-50%,-50%)" }}>
                    <Image src={WASH_CHAR[id]} alt={el.label}
                      width={72} height={72} style={{ objectFit: "contain" }} />
                    <span className="font-semibold text-sm" style={{ color: "#1E2A22" }}>
                      {el.label}
                    </span>
                  </div>
                );
              })}

              {/* 중앙 메인 마스코트 */}
              <div className="absolute" style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
                <Kaechi mood="normal" size={100} animate={false} />
              </div>
            </div>

            <div className="mt-5 text-center">
              <p className="font-bold text-sm" style={{ color: "#1F6E42" }}>
                오늘 평가를 완료했어요 ✅
              </p>
              <p className="text-sm mt-1.5" style={{ color: "#5C6B60", lineHeight: 1.5 }}>
                내일 아침에 다시 돌아와요!<br/>
                씻기 요정 캐치가 기다리고 있을게요 🐥
              </p>
            </div>
          </div>

          {/* CTA 버튼 */}
          <button
            onClick={() => router.push("/building")}
            className="w-full mt-5 btn-primary py-4 font-bold text-white"
            style={{ fontSize: 17, letterSpacing: "0.02em" }}>
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
        style={{ background: "rgba(0,0,0,0.1)", color: "rgba(0,0,0,0.3)" }}>
        리셋
      </button>

      {/* 싫어요 바텀시트 */}
      {showDislike && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDislike(false)} />
          <div className="relative bg-white rounded-t-3xl p-6 z-10">
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "#D8F0E0" }} />
            <div className="flex items-center gap-3 mb-4">
              <Kaechi mood="question" size={44} animate={false} />
              <p className="font-bold text-base" style={{ color: "#1E2A22" }}>
                어떤 점이 싫었나요?
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {DISLIKE_REASONS.map((reason) => (
                <button key={reason} onClick={handleDislikeConfirm}
                  className="w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold"
                  style={{ background: "#EAF7EE", color: "#1E2A22" }}>
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
