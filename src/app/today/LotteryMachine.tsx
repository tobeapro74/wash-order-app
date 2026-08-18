"use client";

import { useRef, useState, useCallback } from "react";
import { drawRandomOrder, WashStep } from "@/lib/washOrder";

const tokens = {
  mint100: "#D8F0E0",
  green500: "#3FA96B",
  green600: "#2E8C56",
  green700: "#1F6E42",
  ink500: "#5C6B60",
  white: "#FFFFFF",
};

type Phase = "idle" | "playing" | "result";

const VIDEO_MAP: Record<WashStep, string> = {
  세수: "/lottery-machine-세수.mp4",
  머리: "/lottery-machine-머리.mp4",
  샤워: "/lottery-machine-샤워.mp4",
  양치: "/lottery-machine-양치.mp4",
};

const POSTER_MAP: Record<WashStep, string> = {
  세수: "/lottery-machine-세수-poster.jpg",
  머리: "/lottery-machine-머리-poster.jpg",
  샤워: "/lottery-machine-샤워-poster.jpg",
  양치: "/lottery-machine-양치-poster.jpg",
};

const DEFAULT_STEP: WashStep = "양치";

export default function LotteryMachine({
  onResult,
}: {
  onResult?: (order: WashStep[]) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [order, setOrder] = useState<WashStep[] | null>(null);
  const [activeStep, setActiveStep] = useState<WashStep>(DEFAULT_STEP);
  const pendingOrder = useRef<WashStep[] | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const handleSpin = useCallback(() => {
    if (phase === "playing") return;

    const result = drawRandomOrder();
    const firstDrawn = result[0];
    pendingOrder.current = result;
    setOrder(result);
    setActiveStep(firstDrawn);
    setPhase("playing");

    requestAnimationFrame(() => {
      const video = videoRef.current;
      if (!video) return;
      video.load();
      video.currentTime = 0;
      video.play().catch(() => {
        setPhase("result");
        onResultRef.current?.(result);
      });
    });
  }, [phase]);

  const handleVideoEnded = useCallback(() => {
    setPhase("result");
    onResultRef.current?.(pendingOrder.current ?? []);
  }, []);

  const handleReset = useCallback(() => {
    setPhase("idle");
    setOrder(null);
    setActiveStep(DEFAULT_STEP);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 420,
        borderRadius: 28,
        overflow: "hidden",
        background: `linear-gradient(180deg, ${tokens.white} 0%, ${tokens.mint100} 100%)`,
        boxShadow: "0 10px 24px rgba(31,110,66,0.12)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          background: "#000",
        }}
      >
        <video
          ref={videoRef}
          src={VIDEO_MAP[activeStep]}
          poster={POSTER_MAP[activeStep]}
          muted
          playsInline
          preload="metadata"
          onEnded={handleVideoEnded}
          aria-hidden="true"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />

        {phase === "idle" && (
          <button
            onClick={handleSpin}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%)",
              border: "none",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: 24,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                background: `linear-gradient(180deg, #4CBE7C 0%, ${tokens.green600} 100%)`,
                color: tokens.white,
                fontSize: 20,
                fontWeight: 800,
                padding: "14px 40px",
                borderRadius: 999,
                boxShadow: "0 8px 20px rgba(46,140,86,0.4)",
              }}
            >
              GO! 돌리기
            </span>
          </button>
        )}

        {phase === "playing" && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 0,
              right: 0,
              textAlign: "center",
              color: tokens.white,
              fontSize: 14,
              fontWeight: 600,
              textShadow: "0 2px 4px rgba(0,0,0,0.4)",
            }}
          >
            공을 뽑는 중...
          </div>
        )}
      </div>

      {phase === "result" && order && (
        <div style={{ padding: "24px 20px", animation: "fadeInUp 0.4s ease" }}>
          <p
            style={{
              textAlign: "center",
              fontSize: 14,
              fontWeight: 500,
              color: tokens.ink500,
              marginBottom: 16,
            }}
          >
            🐣 &ldquo;씻기 요정이 정했어요.&rdquo;
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {order.map((step, i) => (
              <span key={step} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    background: tokens.mint100,
                    color: tokens.green700,
                    fontWeight: 700,
                    fontSize: 16,
                    padding: "8px 14px",
                    borderRadius: 999,
                  }}
                >
                  {i + 1}. {step}
                </span>
                {i < order.length - 1 && <span style={{ color: tokens.green500 }}>→</span>}
              </span>
            ))}
          </div>

          <button
            onClick={handleReset}
            style={{
              display: "block",
              margin: "20px auto 0",
              background: "none",
              border: "none",
              color: tokens.ink500,
              fontSize: 14,
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            다시 뽑기
          </button>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
