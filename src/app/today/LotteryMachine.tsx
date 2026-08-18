"use client";

import { useRef, useState, useEffect } from "react";
import { ElementId } from "@/lib/wash";

const LABEL: Record<ElementId, string> = {
  teeth: "양치",
  face:  "얼굴",
  hair:  "머리",
  body:  "몸",
};

const ALL_IDS: ElementId[] = ["teeth", "face", "hair", "body"];

function makeShuffledOrder(): ElementId[] {
  const arr = [...ALL_IDS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type Phase = "idle" | "playing" | "result";

export default function LotteryMachine({
  onResult,
}: {
  onResult?: (order: ElementId[], isJoker: boolean) => void;
}) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const fullOrder   = useRef<ElementId[]>([]);
  const stepRef     = useRef(0);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const [picked, setPicked] = useState<ElementId[]>([]);
  const [phase,  setPhase]  = useState<Phase>("idle");

  // DOM 직접 등록 — React 합성이벤트 stale closure 완전 회피
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onEnded = () => {
      const s    = stepRef.current;
      const id   = fullOrder.current[s];
      const next = s + 1;
      stepRef.current = next;

      if (next >= 4) {
        setPicked(fullOrder.current.slice());
        setTimeout(() => {
          setPhase("result");
          onResultRef.current?.(fullOrder.current.slice(), false);
        }, 1200);
      } else {
        setPicked(prev => [...prev, id]);
        setPhase("idle");
      }
    };

    video.addEventListener("ended", onEnded);
    return () => video.removeEventListener("ended", onEnded);
  }, []);

  const handleSpin = () => {
    if (phase === "playing") return;

    if (stepRef.current === 0) {
      fullOrder.current = makeShuffledOrder();
      setPicked([]);
    }

    setPhase("playing");
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {
      const s    = stepRef.current;
      const id   = fullOrder.current[s];
      const next = s + 1;
      stepRef.current = next;
      if (next >= 4) {
        setPicked(fullOrder.current.slice());
        setTimeout(() => {
          setPhase("result");
          onResultRef.current?.(fullOrder.current.slice(), false);
        }, 1200);
      } else {
        setPicked(prev => [...prev, id]);
        setPhase("idle");
      }
    });
  };

  const handleReset = () => {
    stepRef.current = 0;
    fullOrder.current = [];
    setPicked([]);
    setPhase("idle");
    const video = videoRef.current;
    if (video) video.currentTime = 0;
  };

  const currentStep  = stepRef.current;
  const isDone       = phase === "result";
  const isPlaying    = phase === "playing";
  const ROUND_LABELS = ["첫 번째", "두 번째", "세 번째", "마지막"];
  const roundLabel   = ROUND_LABELS[Math.min(currentStep, 3)];
  const displayPicked = isDone ? fullOrder.current : picked;

  return (
    <div style={{
      width: "100%",
      borderRadius: 28,
      overflow: "hidden",
      background: "linear-gradient(180deg,#FFFFFF 0%,#D8F0E0 100%)",
      boxShadow: "0 10px 24px rgba(31,110,66,0.12)",
    }}>

      {/* ── 영상 ── */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", background: "#c8e8d4" }}>
        <video
          ref={videoRef}
          src="/lottery-machine.mp4"
          poster="/lottery-machine-poster.jpg"
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />

        {isPlaying && (
          <div style={{
            position: "absolute", top: 14, left: 0, right: 0,
            textAlign: "center", color: "#fff", fontSize: 14, fontWeight: 600,
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          }}>
            🎱 {roundLabel} 공을 뽑는 중...
          </div>
        )}
      </div>

      {/* GO 버튼 — 영상 바깥 아래에 배치 */}
      {!isPlaying && !isDone && (
        <div style={{ padding: "16px 20px 0", display: "flex", justifyContent: "center" }}>
          <button
            onClick={handleSpin}
            style={{
              width: "100%",
              background: "linear-gradient(180deg,#4CBE7C 0%,#2E8C56 100%)",
              border: "none", cursor: "pointer", borderRadius: 999,
              padding: "11px 0",
              color: "#fff", fontSize: 20, fontWeight: 800,
              boxShadow: "0 8px 20px rgba(46,140,86,0.4)",
              letterSpacing: "0.02em",
            }}
          >
            {currentStep === 0 ? "GO! 돌리기" : `GO! ${roundLabel} 뽑기`}
          </button>
        </div>
      )}

      {/* ── 하단 진행 & 결과 ── */}
      <div style={{ padding: "14px 20px 20px" }}>

        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              flex: 1, height: 5, borderRadius: 999,
              background: i < displayPicked.length ? "#3FA96B" : "#C7ECD9",
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        {!isDone && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {displayPicked.length === 0 && !isPlaying && (
              <p style={{ fontSize: 13, color: "#5C6B60", margin: 0, textAlign: "center", whiteSpace: "nowrap" }}>
                ⭐ GO 버튼을 눌러 공을 뽑아보세요!
              </p>
            )}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "nowrap", overflow: "hidden" }}>
            {displayPicked.map((id, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  background: "#D8F0E0", color: "#1F6E42",
                  fontWeight: 800, fontSize: 13,
                  padding: "5px 10px", borderRadius: 999, whiteSpace: "nowrap",
                }}>
                  {i + 1}. {LABEL[id]}
                </span>
                {i < displayPicked.length - 1 && (
                  <span style={{ color: "#3FA96B", fontWeight: 700 }}>→</span>
                )}
              </span>
            ))}
            {Array.from({ length: 4 - displayPicked.length }).map((_, i) => (
              <span key={`e-${i}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {(displayPicked.length + i > 0) && (
                  <span style={{ color: "#9FE0B8", fontWeight: 700 }}>→</span>
                )}
                <span style={{
                  border: "2px dashed #9FE0B8", color: "#9FE0B8",
                  fontWeight: 700, fontSize: 13,
                  padding: "5px 10px", borderRadius: 999, whiteSpace: "nowrap",
                }}>
                  {displayPicked.length + i + 1}번째
                </span>
              </span>
            ))}
          </div>
          </div>
        )}

        {isDone && (
          <div style={{ animation: "lmFadeInUp 0.4s ease" }}>
            <p style={{
              textAlign: "center", fontSize: 14, fontWeight: 500,
              color: "#5C6B60", marginBottom: 12,
            }}>
              🐣 씻기 요정이 정했어요.
            </p>
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 6, flexWrap: "wrap",
            }}>
              {fullOrder.current.map((id, i) => (
                <span key={id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    background: "#D8F0E0", color: "#1F6E42",
                    fontWeight: 800, fontSize: 16,
                    padding: "8px 16px", borderRadius: 999,
                  }}>
                    {i + 1}. {LABEL[id]}
                  </span>
                  {i < 3 && <span style={{ color: "#3FA96B", fontSize: 16, fontWeight: 700 }}>→</span>}
                </span>
              ))}
            </div>
            <button onClick={handleReset} style={{
              display: "block", margin: "14px auto 0",
              background: "none", border: "none",
              color: "#5C6B60", fontSize: 13,
              textDecoration: "underline", cursor: "pointer",
            }}>
              다시 뽑기
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes lmFadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
