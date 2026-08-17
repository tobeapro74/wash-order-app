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
    <div className="flex flex-col min-h-dvh" style={{ background: "#E8F5EE" }}>

      {/* 헤더: 텍스트만, 그라디언트 없음 */}
      <div className="px-6 pt-14 pb-2 text-center flex-shrink-0">
        <p className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: "#8FAF97" }}>
          오늘의 씻기 순서
        </p>
        <h1 className="text-xl font-extrabold mt-0.5" style={{ color: "#2D3A2E" }}>
          오늘은 어디부터 씻을까요? 🚿
        </h1>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pb-28 gap-5">

        {/* SPIN */}
        {phase === "spin" && (
          <>
            <div style={{ marginTop: -40 }}>
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

            {/* 결과 카드 - 3D 그림자 */}
            <div className="w-full rounded-3xl p-6 text-center bounce-in"
              style={{
                background: isJoker ? "#FFF8D6" : "#FFFFFF",
                border: `2px solid ${isJoker ? "#F5C842" : "#C2E4CF"}`,
                boxShadow: isJoker
                  ? "0 8px 0 #E0A800, 0 12px 24px rgba(245,200,66,0.25)"
                  : "0 6px 0 #B8DECA, 0 10px 20px rgba(91,175,122,0.12)",
              }}>
              {isJoker && (
                <p className="text-xs font-bold mb-3 tracking-widest" style={{ color: "#7B5EA7" }}>
                  ⭐ 나의 루틴 당첨!
                </p>
              )}
              <div className="flex items-center justify-center gap-1 mb-4">
                {resultOrder.map((id, i) => {
                  const el = WASH_ELEMENTS.find(e => e.id === id)!;
                  return (
                    <span key={id} className="flex items-center gap-1">
                      <span className="flex flex-col items-center gap-1">
                        <div className="rounded-2xl p-2" style={{ background: "#F2FAF5" }}>
                          <Image src={WASH_CHAR[id]} alt={el.label} width={56} height={56} style={{ objectFit: "contain" }} />
                        </div>
                        <span className="text-xs font-bold" style={{ color: "#4A6350" }}>{el.label}</span>
                      </span>
                      {i < resultOrder.length - 1 && <span className="text-base mx-0.5" style={{ color: "#C2E4CF" }}>→</span>}
                    </span>
                  );
                })}
              </div>
              <p className="text-sm italic" style={{ color: "#8FAF97" }}>"{copy}"</p>
            </div>

            <div className="w-full flex gap-3">
              <button onClick={handleLike}
                className="flex-1 py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform btn-3d"
                style={{
                  background: "#E0F5EA",
                  color: "#3D8A5C",
                  border: "2px solid #A8DBBE",
                  boxShadow: "0 5px 0 #7BC4A0",
                }}>
                👍 좋아요
              </button>
              <button onClick={() => setShowDislike(true)}
                className="flex-1 py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform btn-3d"
                style={{
                  background: "#FDEAEA",
                  color: "#C04040",
                  border: "2px solid #F0BABA",
                  boxShadow: "0 5px 0 #E0A0A0",
                }}>
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
            <Kaechi mood="wave" size={136} />

            {/* 오늘의 순서 카드 - 더 크고 3D */}
            <div className="w-full rounded-3xl p-6 text-center bounce-in"
              style={{
                background: "#FFFFFF",
                border: "2px solid #C2E4CF",
                boxShadow: "0 6px 0 #B8DECA, 0 10px 20px rgba(91,175,122,0.12)",
              }}>
              <p className="text-[11px] font-bold mb-4 tracking-[0.16em] uppercase" style={{ color: "#8FAF97" }}>
                오늘의 씻기 순서
              </p>
              <div className="flex items-center justify-center gap-2 mb-4">
                {resultOrder.map((id, i) => {
                  const el = WASH_ELEMENTS.find(e => e.id === id)!;
                  return (
                    <span key={id} className="flex items-center gap-2">
                      <span className="flex flex-col items-center gap-1">
                        <div className="rounded-2xl p-2" style={{ background: "#F2FAF5" }}>
                          <Image src={WASH_CHAR[id]} alt={el.label} width={60} height={60} style={{ objectFit: "contain" }} />
                        </div>
                        <span className="text-xs font-bold" style={{ color: "#4A6350" }}>{el.label}</span>
                      </span>
                      {i < resultOrder.length - 1 && <span className="text-base" style={{ color: "#C2E4CF" }}>→</span>}
                    </span>
                  );
                })}
              </div>
              <p className="text-sm font-semibold" style={{ color: "#8FAF97" }}>오늘 평가를 완료했어요 ✅</p>
            </div>

            <p className="text-sm text-center leading-relaxed fade-up" style={{ color: "#8FAF97" }}>
              내일 아침에 다시 돌아와요!<br/>씻기 요정 캐치가 기다리고 있을게요 🐥
            </p>

            {/* 빌딩 버튼 - 크고 3D */}
            <button onClick={() => router.push("/building")}
              className="w-full py-5 rounded-2xl text-white font-extrabold text-lg btn-3d"
              style={{
                background: "linear-gradient(135deg,#5BAF7A 0%,#3D8A5C 100%)",
                boxShadow: "0 6px 0 #2A6040, 0 10px 20px rgba(61,138,92,0.3)",
                letterSpacing: "0.03em",
              }}>
              🏢 빌딩 순위 확인하기
            </button>
          </>
        )}
      </div>

      <BottomNav />

      {/* 개발용 리셋 버튼 */}
      <button
        onClick={() => {
          localStorage.removeItem("wash_today");
          localStorage.removeItem("wash_voted_today");
          setResultOrder(null);
          setPhase("spin");
        }}
        className="fixed top-4 right-4 z-50 text-[10px] rounded px-2 py-1"
        style={{ background: "rgba(0,0,0,0.12)", color: "rgba(0,0,0,0.3)" }}
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
