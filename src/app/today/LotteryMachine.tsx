"use client";

import { useRef, useState, useCallback } from "react";
import { ElementId, WASH_ELEMENTS } from "@/lib/wash";

const LABEL: Record<ElementId, string> = {
  teeth: "양치",
  face:  "얼굴",
  hair:  "머리",
  body:  "몸",
};

const ALL_IDS: ElementId[] = ["teeth", "face", "hair", "body"];

// 중복 없이 4개를 순서대로 1개씩 뽑는 Fisher-Yates shuffle 결과
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
  const videoRef = useRef<HTMLVideoElement>(null);

  // 이번 라운드의 전체 순서 (4번 뽑기 시작 시 미리 결정)
  const fullOrderRef = useRef<ElementId[]>([]);
  // 현재까지 뽑힌 결과
  const [picked,   setPicked]   = useState<ElementId[]>([]);
  const [phase,    setPhase]    = useState<Phase>("idle");
  // 현재 뽑기 단계 (0~3)
  const stepRef = useRef(0);

  const playVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    const p = video.play();
    if (p) p.catch(() => {
      // 자동재생 실패 → 즉시 다음 단계
      handleVideoEnded();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // GO 버튼 클릭
  const handleSpin = useCallback(() => {
    if (phase === "playing") return;

    // 첫 번째 뽑기: 순서를 미리 결정
    if (stepRef.current === 0) {
      fullOrderRef.current = makeShuffledOrder();
      setPicked([]);
    }

    setPhase("playing");
    playVideo();
  }, [phase, playVideo]);

  // 영상 종료 → 해당 단계 결과 공개
  const handleVideoEnded = useCallback(() => {
    const step = stepRef.current;
    const id   = fullOrderRef.current[step];
    const next = step + 1;

    setPicked(prev => {
      const updated = [...prev, id];

      if (next >= 4) {
        // 4번 완료 → 결과
        setPhase("result");
        onResult?.(fullOrderRef.current, false);
      } else {
        // 다음 뽑기 대기
        setPhase("idle");
      }

      return updated;
    });

    stepRef.current = next;
  }, [onResult]);

  // 다시 뽑기
  const handleReset = useCallback(() => {
    setPhase("idle");
    setPicked([]);
    stepRef.current = 0;
    fullOrderRef.current = [];
    const video = videoRef.current;
    if (video) video.currentTime = 0;
  }, []);

  const step        = stepRef.current;          // 0~4
  const isDone      = phase === "result";
  const isPlaying   = phase === "playing";
  const roundLabel  = ["첫 번째", "두 번째", "세 번째", "마지막"][Math.min(step, 3)];

  return (
    <div style={{
      width: "100%",
      borderRadius: 28,
      overflow: "hidden",
      background: "linear-gradient(180deg,#FFFFFF 0%,#D8F0E0 100%)",
      boxShadow: "0 10px 24px rgba(31,110,66,0.12)",
      position: "relative",
    }}>

      {/* ── 영상 영역 ── */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", background: "#000" }}>
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

        {/* idle: GO 버튼 */}
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
            }}>
              {step === 0 ? "GO! 돌리기" : `GO! ${roundLabel} 뽑기`}
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

        {/* 완료: 오버레이 없음 (결과는 하단에 표시) */}
      </div>

      {/* ── 진행 상황 & 결과 영역 ── */}
      <div style={{ padding: "20px 20px 24px" }}>

        {/* 단계 진행 바 */}
        {!isDone && (
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                flex: 1, height: 5, borderRadius: 999,
                background: i < picked.length ? "#3FA96B" : "#C7ECD9",
                transition: "background 0.3s",
              }} />
            ))}
          </div>
        )}

        {/* 지금까지 뽑힌 공 */}
        {picked.length > 0 && !isDone && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            flexWrap: "wrap", marginBottom: 8,
          }}>
            {picked.map((id, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  background: "#D8F0E0", color: "#1F6E42",
                  fontWeight: 800, fontSize: 15,
                  padding: "6px 14px", borderRadius: 999,
                }}>
                  {i + 1}. {LABEL[id]}
                </span>
                {i < picked.length - 1 && (
                  <span style={{ color: "#3FA96B", fontWeight: 700 }}>→</span>
                )}
              </span>
            ))}
            {/* 남은 슬롯 점선 */}
            {Array.from({ length: 4 - picked.length }).map((_, i) => (
              <span key={`empty-${i}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#3FA96B", fontWeight: 700 }}>→</span>
                <span style={{
                  border: "2px dashed #9FE0B8", color: "#9FE0B8",
                  fontWeight: 700, fontSize: 15,
                  padding: "6px 14px", borderRadius: 999,
                }}>
                  {picked.length + i + 1}번째
                </span>
              </span>
            ))}
          </div>
        )}

        {/* 안내 문구 (idle & 아직 안 뽑은 경우) */}
        {!isDone && picked.length === 0 && !isPlaying && (
          <p style={{ textAlign: "center", fontSize: 14, color: "#5C6B60", margin: 0 }}>
            ⭐ GO 버튼을 눌러 공을 뽑아보세요!
          </p>
        )}

        {/* 최종 결과 */}
        {isDone && fullOrderRef.current.length === 4 && (
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
              {fullOrderRef.current.map((id, i) => (
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
