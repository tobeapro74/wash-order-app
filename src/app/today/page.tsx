"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ElementId, loadMyOrder, getTodayOrder, vote, markVotedToday,
  hasVotedToday, WASH_ELEMENTS, DISLIKE_REASONS, randomCopy, orderKey,
} from "@/lib/wash";
import { apiVote } from "@/lib/api";
import { RouletteWheel } from "@/components/RouletteWheel";
import { Kaechi, WASH_CHAR } from "@/components/Kaechi";
import { BottomNav } from "@/components/BottomNav";
import Image from "next/image";

type Phase = "spin" | "result" | "voted";

// 점선 원형 화살표
function DottedArrow() {
  return (
    <svg viewBox="0 0 220 220" width={220} height={220}
      className="absolute left-1/2 top-1/2"
      style={{ transform: "translate(-50%,-50%)", pointerEvents: "none" }}>
      {["M 44 110 A 66 66 0 0 1 110 44",
        "M 110 44 A 66 66 0 0 1 176 110",
        "M 176 110 A 66 66 0 0 1 110 176",
        "M 110 176 A 66 66 0 0 1 44 110"].map((d, i) => (
        <path key={i} d={d} fill="none"
          stroke="#3FA96B" strokeWidth="2.5"
          strokeDasharray="5 6" strokeLinecap="round"
          markerEnd="url(#arr)"/>
      ))}
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 Z" fill="#3FA96B"/>
        </marker>
      </defs>
    </svg>
  );
}

const GRID_POS = [
  { top: "12%", left: "15%" },
  { top: "12%", right: "15%" },
  { top: "52%", left: "15%" },
  { top: "52%", right: "15%" },
];

export default function TodayPage() {
  const router = useRouter();
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
        <div className="flex-1 flex flex-col items-center px-5 pb-28"
          style={{ paddingTop: 56 }}>

          {/* 마스코트 — 이미지 목표: 보라 로브+지팡이, 현재 에셋 기준 크게 */}
          <div style={{ marginBottom: 8 }}>
            <Kaechi mood="normal" size={120} />
          </div>

          {/* 타이틀 — 이미지처럼 초대형 Extra Bold */}
          <h1 className="text-center"
            style={{
              fontSize: 39,
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

          {/* 룰렛 카드 */}
          <RouletteWheel myOrder={myOrder} onResult={handleResult} />
        </div>
      )}

      {/* ══════════════ RESULT 화면 ══════════════ */}
      {phase === "result" && resultOrder && (
        <div className="flex-1 flex flex-col items-center px-5 pb-28 gap-5"
          style={{ paddingTop: 64 }}>
          <div className="relative">
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

      {/* ══════════════ VOTED 화면 ══════════════ */}
      {phase === "voted" && resultOrder && (
        <div className="flex-1 flex flex-col items-center px-5 pb-28"
          style={{ paddingTop: 64 }}>
          <h1 className="font-bold text-center mb-6"
            style={{ fontSize: 28, color: "#1E2A22", lineHeight: 1.2, letterSpacing: "-0.3px" }}>
            오늘은<br/>어디부터 씻을까요?
          </h1>

          {/* 순서 카드 */}
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

            <div style={{ position: "relative", height: 220 }}>
              <DottedArrow />
              {resultOrder.map((id, i) => {
                const el  = WASH_ELEMENTS.find(e => e.id === id)!;
                const pos = GRID_POS[i];
                return (
                  <div key={id} className="absolute flex flex-col items-center gap-1"
                    style={{ ...pos, transform: "translate(-50%,-50%)" }}>
                    <Image src={WASH_CHAR[id]} alt={el.label}
                      width={72} height={72} style={{ objectFit: "contain" }} />
                    <span className="font-semibold text-sm" style={{ color: "#1E2A22" }}>
                      {el.label}
                    </span>
                  </div>
                );
              })}
              <div className="absolute" style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
                <Kaechi mood="normal" size={96} animate={false} />
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="font-bold text-sm" style={{ color: "#1F6E42" }}>
                오늘 평가를 완료했어요 ✅
              </p>
              <p className="text-sm mt-1.5" style={{ color: "#5C6B60", lineHeight: 1.5 }}>
                내일 아침에 다시 돌아와요!<br/>씻기 요정 캐치가 기다리고 있을게요 🐥
              </p>
            </div>
          </div>

          <button onClick={() => router.push("/building")}
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
        style={{ background: "rgba(0,0,0,0.08)", color: "rgba(0,0,0,0.3)" }}>
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
              <p className="font-bold text-base" style={{ color: "#1E2A22" }}>어떤 점이 싫었나요?</p>
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
