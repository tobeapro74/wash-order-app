"use client";

import { useRef, useState } from "react";
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
  const fullOrder   = useRef<ElementId[]>([]);   // 미리 결정된 4개 순서
  const step        = useRef(0);                  // 현재 단계 0~4
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const [picked, setPicked] = useState<ElementId[]>([]);
  const [phase,  setPhase]  = useState<Phase>("idle");

  // ── 영상 재생 ──
  const playVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => revealCurrent());
  };

  // ── 현재 단계 결과 공개 ──
  const revealCurrent = () => {
    const currentStep = step.current;
    const id = fullOrder.current[currentStep];
    const nextStep = currentStep + 1;
    step.current = nextStep;

    if (nextStep >= 4) {
      // 마지막 공 공개 → 잠깐 보여준 뒤 result로
      setPicked(fullOrder.current.slice());
      setTimeout(() => {
        setPhase("result");
        // 결과를 page.tsx로 전달 (투표 플로우 진입)
        onResultRef.current?.(fullOrder.current.slice(), false);
      }, 1200); // 1.2초 동안 4개 공 표시
    } else {
      setPicked(prev => [...prev, id]);
      setPhase("idle");
    }
  };

  // ── GO 버튼 클릭 ──
  const handleSpin = () => {
    if (phase === "playing") return;

    // 첫 번째 뽑기: 순서 결정
    if (step.current === 0) {
      fullOrder.current = makeShuffledOrder();
      setPicked([]);
    }

    setPhase("playing");
    playVideo();
  };

  // ── 영상 종료 ──
  const handleVideoEnded = () => {
    revealCurrent();
  };

  // ── 다시 뽑기 ──
  const handleReset = () => {
    step.current = 0;
    fullOrder.current = [];
    setPicked([]);
    setPhase("idle");
    const video = videoRef.current;
    if (video) video.currentTime = 0;
  };

  const currentStep  = step.current;
  const isDone       = phase === "result";
  const isPlaying    = phase === "playing";
  const ROUND_LABELS = ["첫 번째", "두 번째", "세 번째", "마지막"];
  const roundLabel   = ROUND_LABELS[Math.min(currentStep, 3)];

  // 진행 중 표시할 picked (마지막 공 reveal 직후에는 4개 모두 표시)
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
      <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", background: "#000" }}>
        <video
          ref={videoRef}
          src="/lottery-machine.mp4"
          poster="/lottery-machine-poster.jpg"
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          onEnded={handleVideoEnded}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />

        {/* idle: GO 버튼 오버레이 */}
        {!isPlaying && !isDone && (
          <button
            onClick={handleSpin}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              background: "linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,0.30) 100%)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
              paddingBottom: 28,
            }}
          >
            <span style={{
              background: "linear-gradient(180deg,#4CBE7C 0%,#2E8C56 100%)",
              color: "#fff", fontSize: 20, fontWeight: 800,
              padding: "14px 40px", borderRadius: 999,
              boxShadow: "0 8px 20px rgba(46,140,86,0.4)",
              letterSpacing: "0.02em",
              pointerEvents: "none",
            }}>
              {currentStep === 0 ? "GO! 돌리기" : `GO! ${roundLabel} 뽑기`}
            </span>
          </button>
        )}

        {/* playing: 안내 */}
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

      {/* ── 하단 진행 & 결과 영역 ── */}
      <div style={{ padding: "20px 20px 36px" }}>

        {/* 진행 바 */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              flex: 1, height: 5, borderRadius: 999,
              background: i < displayPicked.length ? "#3FA96B" : "#C7ECD9",
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        {/* 뽑힌 공 + 남은 슬롯 */}
        {!isDone && (
          <div style={{
            display: "flex", alignItems: "center",
            gap: 6, flexWrap: "wrap", minHeight: 40,
          }}>
            {displayPicked.length === 0 && !isPlaying && (
              <p style={{ fontSize: 14, color: "#5C6B60", margin: 0, width: "100%", textAlign: "center" }}>
                ⭐ GO 버튼을 눌러 공을 뽑아보세요!
              </p>
            )}

            {displayPicked.map((id, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  background: "#D8F0E0", color: "#1F6E42",
                  fontWeight: 800, fontSize: 15,
                  padding: "6px 14px", borderRadius: 999,
                }}>
                  {i + 1}. {LABEL[id]}
                </span>
                {i < displayPicked.length - 1 && (
                  <span style={{ color: "#3FA96B", fontWeight: 700 }}>→</span>
                )}
              </span>
            ))}

            {/* 남은 슬롯 점선 */}
            {Array.from({ length: 4 - displayPicked.length }).map((_, i) => (
              <span key={`empty-${i}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {displayPicked.length + i > 0 && (
                  <span style={{ color: "#9FE0B8", fontWeight: 700 }}>→</span>
                )}
                <span style={{
                  border: "2px dashed #9FE0B8", color: "#9FE0B8",
                  fontWeight: 700, fontSize: 14,
                  padding: "6px 12px", borderRadius: 999,
                }}>
                  {displayPicked.length + i + 1}번째
                </span>
              </span>
            ))}
          </div>
        )}

        {/* 최종 결과 */}
        {isDone && (
          <div style={{ animation: "lmFadeInUp 0.4s ease" }}>
            <p style={{
              textAlign: "center", fontSize: 14, fontWeight: 500,
              color: "#5C6B60", marginBottom: 16,
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
              display: "block", margin: "18px auto 0",
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
