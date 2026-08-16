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
import Image from "next/image";

type Phase = "spin" | "result" | "voted";

function IconSpin({ active }: { active: boolean }) {
  const c = active ? "#5BAF7A" : "#8FAF97";
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="9" stroke={c} strokeWidth="2"/>
      <circle cx="11" cy="11" r="3" fill={c}/>
      <line x1="11" y1="2" x2="11" y2="5" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <line x1="11" y1="17" x2="11" y2="20" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <line x1="2" y1="11" x2="5" y2="11" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <line x1="17" y1="11" x2="20" y2="11" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function IconBuilding({ active }: { active: boolean }) {
  const c = active ? "#5BAF7A" : "#8FAF97";
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="4" y="3" width="14" height="17" rx="1.5" stroke={c} strokeWidth="2"/>
      <line x1="8" y1="8" x2="14" y2="8" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" y1="12" x2="14" y2="12" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="8.5" y="15" width="5" height="5" rx="0.5" fill={c}/>
    </svg>
  );
}
function IconMe({ active }: { active: boolean }) {
  const c = active ? "#5BAF7A" : "#8FAF97";
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="8" r="3.5" stroke={c} strokeWidth="2"/>
      <path d="M4 19c0-3.866 3.134-7 7-7h0c3.866 0 7 3.134 7 7" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export default function TodayPage() {
  const router = useRouter();
  const [myOrder, setMyOrder] = useState<ElementId[] | null>(null);
  const [resultOrder, setResultOrder] = useState<ElementId[] | null>(null);
  const [isJoker, setIsJoker] = useState(false);
  const [phase, setPhase] = useState<Phase>("spin");
  const [copy, setCopy] = useState("");
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
    apiVote(orderKey(resultOrder), true); // 서버 투표
    setPhase("voted");
  };

  const handleDislikeConfirm = () => {
    if (!resultOrder) return;
    vote(resultOrder, false);
    markVotedToday();
    apiVote(orderKey(resultOrder), false); // 서버 투표
    setShowDislike(false);
    setPhase("voted");
  };

  return (
    <div className="flex flex-col min-h-dvh" style={{ background: "#E8F5EE" }}>

      {/* 헤더 */}
      <div className="px-6 pt-20 pb-8 text-white text-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#5BAF7A 0%,#3D8A5C 100%)" }}>
        <p className="text-xs font-semibold mb-1 tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.7)" }}>
          오늘의 씻기 순서
        </p>
        <h1 className="text-2xl font-extrabold leading-snug">오늘은 어디부터 씻을까요?</h1>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24 gap-6">

        {/* SPIN */}
        {phase === "spin" && (
          <>
            <div style={{ marginTop: -60 }}>
              <Kaechi mood="normal" size={120} />
            </div>
            <RouletteWheel myOrder={myOrder} onResult={handleResult} />
          </>
        )}

        {/* RESULT */}
        {phase === "result" && resultOrder && (
          <>
            {isJoker ? (
              <div className="relative">
                <Kaechi mood="happy" size={136} />
                {showConfetti && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-none">
                    {["🎉","✨","🎊","⭐","🎉"].map((e, i) => (
                      <span key={i} className="confetti-particle text-xl"
                        style={{ animationDelay: `${i * 0.1}s` }}>{e}</span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Kaechi mood="normal" size={128} />
            )}

            <div className="w-full rounded-3xl p-6 text-center"
              style={{
                background: isJoker ? "#FFF8D6" : "#FFFFFF",
                border: `2px solid ${isJoker ? "#F5C842" : "#C2E4CF"}`,
              }}>
              {isJoker && (
                <p className="text-xs font-bold mb-3 tracking-widest" style={{ color: "#7B5EA7" }}>
                  ⭐ 나의 루틴 당첨!
                </p>
              )}
              <div className="flex items-center justify-center gap-1 mb-3">
                {resultOrder.map((id, i) => {
                  const el = WASH_ELEMENTS.find(e => e.id === id)!;
                  return (
                    <span key={id} className="flex items-center gap-1">
                      <span className="flex flex-col items-center gap-0.5">
                        <Image src={WASH_CHAR[id]} alt={el.label} width={52} height={52} style={{ objectFit: "contain" }} />
                        <span className="text-xs font-bold" style={{ color: "#4A6350" }}>{el.label}</span>
                      </span>
                      {i < resultOrder.length - 1 && <span className="text-sm mx-0.5" style={{ color: "#C2E4CF" }}>→</span>}
                    </span>
                  );
                })}
              </div>
              <p className="text-sm italic" style={{ color: "#8FAF97" }}>"{copy}"</p>
            </div>

            <div className="w-full flex gap-3">
              <button onClick={handleLike}
                className="flex-1 py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{ background: "#E0F5EA", color: "#3D8A5C", border: "2px solid #A8DBBE" }}>
                👍 좋아요
              </button>
              <button onClick={() => setShowDislike(true)}
                className="flex-1 py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{ background: "#FDEAEA", color: "#C04040", border: "2px solid #F0BABA" }}>
                👎 싫어요
              </button>
            </div>

            <button onClick={() => router.push("/building")}
              className="text-sm font-bold" style={{ color: "#5BAF7A" }}>
              빌딩 순위 보기 →
            </button>
          </>
        )}

        {/* VOTED */}
        {phase === "voted" && resultOrder && (
          <>
            <Kaechi mood="wave" size={128} />
            <div className="w-full rounded-3xl p-6 text-center"
              style={{ background: "#FFFFFF", border: "2px solid #C2E4CF" }}>
              <p className="text-xs font-bold mb-3 tracking-widest uppercase" style={{ color: "#8FAF97" }}>
                오늘의 씻기 순서
              </p>
              <div className="flex items-center justify-center gap-1 mb-3">
                {resultOrder.map((id, i) => {
                  const el = WASH_ELEMENTS.find(e => e.id === id)!;
                  return (
                    <span key={id} className="flex items-center gap-1">
                      <span className="flex flex-col items-center gap-0.5">
                        <Image src={WASH_CHAR[id]} alt={el.label} width={52} height={52} style={{ objectFit: "contain" }} />
                        <span className="text-xs font-bold" style={{ color: "#4A6350" }}>{el.label}</span>
                      </span>
                      {i < resultOrder.length - 1 && <span className="text-sm mx-0.5" style={{ color: "#C2E4CF" }}>→</span>}
                    </span>
                  );
                })}
              </div>
              <p className="text-sm" style={{ color: "#8FAF97" }}>오늘 평가를 완료했어요 ✅</p>
            </div>
            <p className="text-sm text-center leading-relaxed" style={{ color: "#8FAF97" }}>
              내일 아침에 다시 돌아와요!<br/>씻기 요정 캐치가 기다리고 있을게요 🐥
            </p>
            <button onClick={() => router.push("/building")}
              className="w-full py-4 rounded-2xl text-white font-extrabold text-base active:scale-95 transition-transform"
              style={{ background: "#5BAF7A" }}>
              빌딩 순위 확인하기
            </button>
          </>
        )}
      </div>

      {/* 하단 탭 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white flex z-40"
        style={{ borderTop: "1px solid #C2E4CF" }}>
        <button onClick={() => router.push("/today")} className="flex-1 py-3.5 flex flex-col items-center gap-1">
          <IconSpin active />
          <span className="text-[10px] font-bold" style={{ color: "#5BAF7A" }}>오늘의 순서</span>
        </button>
        <button onClick={() => router.push("/building")} className="flex-1 py-3.5 flex flex-col items-center gap-1">
          <IconBuilding active={false} />
          <span className="text-[10px] font-bold" style={{ color: "#8FAF97" }}>빌딩 순위</span>
        </button>
        <button onClick={() => router.push("/setup")} className="flex-1 py-3.5 flex flex-col items-center gap-1">
          <IconMe active={false} />
          <span className="text-[10px] font-bold" style={{ color: "#8FAF97" }}>내 순서</span>
        </button>
      </div>

      {/* 개발용 리셋 버튼 */}
      <button
        onClick={() => {
          localStorage.removeItem("wash_today");
          localStorage.removeItem("wash_voted_today");
          setResultOrder(null);
          setPhase("spin");
        }}
        className="fixed top-4 right-4 z-50 text-[10px] rounded px-2 py-1"
        style={{ background: "rgba(0,0,0,0.15)", color: "rgba(255,255,255,0.5)" }}
      >
        리셋
      </button>

      {/* 싫어요 바텀시트 */}
      {showDislike && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDislike(false)} />
          <div className="relative bg-white rounded-t-3xl p-6 z-10">
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "#C2E4CF" }} />
            <div className="flex items-center gap-3 mb-4">
              <Kaechi mood="question" size={44} animate={false} />
              <p className="font-extrabold text-base" style={{ color: "#2D3A2E" }}>어떤 점이 싫었나요?</p>
            </div>
            <div className="flex flex-col gap-2">
              {DISLIKE_REASONS.map((reason) => (
                <button key={reason} onClick={handleDislikeConfirm}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
                  style={{ background: "#F2FAF5", color: "#2D3A2E" }}>
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
