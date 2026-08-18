"use client";

import { useRef, useState, useCallback } from "react";
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

const tokens = {
  mint100: "#D8F0E0",
  green500: "#3FA96B",
  green600: "#2E8C56",
  green700: "#1F6E42",
  gold400:  "#F5C84B",
  gold600:  "#D89B1F",
  ink500:   "#5C6B60",
  white:    "#FFFFFF",
};

type Phase = "idle" | "playing" | "labelShown" | "result";

const LABEL_FADE_START = 3.85;
const VIDEO_DURATION_FALLBACK_MS = 6000;
const OVERLAY_POSITION = { left: "18%", top: "80%" };

export default function LotteryMachine({
  onResult,
}: {
  onResult?: (order: ElementId[], isJoker: boolean) => void;
}) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const onResultRef   = useRef(onResult);
  onResultRef.current = onResult;

  const [phase, setPhase] = useState<Phase>("idle");
  const [order, setOrder] = useState<ElementId[] | null>(null);
  const labelShownRef = useRef(false);

  const handleSpin = useCallback(() => {
    if (phase === "playing" || phase === "labelShown") return;

    const result = makeShuffledOrder();
    setOrder(result);
    setPhase("playing");
    labelShownRef.current = false;

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {
        setPhase("result");
        onResultRef.current?.(result, false);
      });
    } else {
      setTimeout(() => {
        setPhase("result");
        onResultRef.current?.(result, false);
      }, VIDEO_DURATION_FALLBACK_MS);
    }
  }, [phase]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || labelShownRef.current) return;
    if (video.currentTime >= LABEL_FADE_START) {
      labelShownRef.current = true;
      setPhase("labelShown");
    }
  }, []);

  const handleVideoEnded = useCallback(() => {
    setOrder(prev => {
      if (prev) setTimeout(() => onResultRef.current?.(prev, false), 400);
      return prev;
    });
    setTimeout(() => setPhase("result"), 400);
  }, []);

  const handleReset = useCallback(() => {
    setPhase("idle");
    setOrder(null);
    labelShownRef.current = false;
    const video = videoRef.current;
    if (video) video.currentTime = 0;
  }, []);

  const firstDrawn = order?.[0];

  return (
    <div style={{
      width: "100%",
      borderRadius: 28,
      overflow: "hidden",
      background: `linear-gradient(180deg, ${tokens.white} 0%, ${tokens.mint100} 100%)`,
      boxShadow: "0 10px 24px rgba(31,110,66,0.12)",
      position: "relative",
    }}>
      {/* ── 영상 ── */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", background: "#000" }}>
        <video
          ref={videoRef}
          src="/lottery-machine.mp4"
          poster="/lottery-machine-poster.jpg"
          muted
          playsInline
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          aria-hidden="true"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />

        {/* 3.85초 시점에 배출구 위 라벨 오버레이 */}
        {(phase === "labelShown" || phase === "result") && firstDrawn && (
          <div style={{
            position: "absolute",
            left: OVERLAY_POSITION.left,
            top: OVERLAY_POSITION.top,
            transform: "translate(-50%, -50%)",
            background: `linear-gradient(180deg, ${tokens.gold400} 0%, ${tokens.gold600} 100%)`,
            color: tokens.white,
            fontWeight: 800,
            fontSize: 15,
            padding: "6px 14px",
            borderRadius: 999,
            boxShadow: "0 4px 10px rgba(217,155,31,0.5)",
            animation: "labelPop 0.35s ease",
            whiteSpace: "nowrap",
          }}>
            {LABEL[firstDrawn]}
          </div>
        )}

        {/* idle: GO 버튼 */}
        {phase === "idle" && (
          <button onClick={handleSpin} style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            background: "linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,0.35) 100%)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            paddingBottom: 24,
          }}>
            <span style={{
              background: `linear-gradient(180deg,#4CBE7C 0%,${tokens.green600} 100%)`,
              color: tokens.white, fontSize: 20, fontWeight: 800,
              padding: "14px 40px", borderRadius: 999,
              boxShadow: "0 8px 20px rgba(46,140,86,0.4)",
              pointerEvents: "none",
            }}>
              GO! 돌리기
            </span>
          </button>
        )}

        {/* playing: 안내 */}
        {phase === "playing" && (
          <div style={{
            position: "absolute", top: 12, left: 0, right: 0,
            textAlign: "center", color: tokens.white,
            fontSize: 14, fontWeight: 600,
            textShadow: "0 2px 4px rgba(0,0,0,0.4)",
          }}>
            공을 뽑는 중...
          </div>
        )}
      </div>

      {/* ── 결과 카드 ── */}
      {phase === "result" && order && (
        <div style={{ padding: "24px 20px", animation: "fadeInUp 0.4s ease" }}>
          <p style={{
            textAlign: "center", fontSize: 14, fontWeight: 500,
            color: tokens.ink500, marginBottom: 16,
          }}>
            🐣 씻기 요정이 정했어요.
          </p>
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8, flexWrap: "wrap",
          }}>
            {order.map((id, i) => (
              <span key={id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  background: tokens.mint100, color: tokens.green700,
                  fontWeight: 700, fontSize: 16,
                  padding: "8px 14px", borderRadius: 999,
                }}>
                  {i + 1}. {LABEL[id]}
                </span>
                {i < order.length - 1 && (
                  <span style={{ color: tokens.green500 }}>→</span>
                )}
              </span>
            ))}
          </div>
          <button onClick={handleReset} style={{
            display: "block", margin: "20px auto 0",
            background: "none", border: "none",
            color: tokens.ink500, fontSize: 14,
            textDecoration: "underline", cursor: "pointer",
          }}>
            다시 뽑기
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes labelPop {
          from { opacity: 0; transform: translate(-50%,-50%) scale(0.6); }
          to   { opacity: 1; transform: translate(-50%,-50%) scale(1); }
        }
      `}</style>
    </div>
  );
}
