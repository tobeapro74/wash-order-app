"use client";

import { useRef, useState, useCallback } from "react";
import { ElementId, ALL_ORDERS, loadMyOrder, orderKey } from "@/lib/wash";

// 기존 앱 색상 토큰
const tokens = {
  mint100: "#D8F0E0",
  green500: "#3FA96B",
  green600: "#2E8C56",
  green700: "#1F6E42",
  ink900: "#1E2A22",
  ink500: "#5C6B60",
  white: "#FFFFFF",
};

const LABEL: Record<ElementId, string> = {
  teeth: "양치",
  face: "얼굴",
  hair: "머리",
  body: "몸",
};

type Phase = "idle" | "playing" | "result";

function drawRandomOrder(): ElementId[] {
  const myOrder = loadMyOrder();
  // 조커 칸: 내 순서가 있으면 25칸 중 1칸을 내 순서로
  const pool = myOrder ? [...ALL_ORDERS, myOrder] : ALL_ORDERS;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return [...picked];
}

export default function LotteryMachine({
  onResult,
}: {
  onResult?: (order: ElementId[], isJoker: boolean) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [order, setOrder] = useState<ElementId[] | null>(null);
  const orderRef = useRef<ElementId[] | null>(null);

  const handleSpin = useCallback(() => {
    if (phase === "playing") return;

    const myOrder = loadMyOrder();
    const result = drawRandomOrder();
    const isJoker = !!myOrder && orderKey(result) === orderKey(myOrder);
    orderRef.current = result;
    setOrder(result);
    setPhase("playing");

    onResult?.(result, isJoker);

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {
        setPhase("result");
      });
    }
  }, [phase, onResult]);

  const handleVideoEnded = useCallback(() => {
    setPhase("result");
  }, []);

  const handleReset = useCallback(() => {
    setPhase("idle");
    setOrder(null);
    orderRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
    }
  }, []);

  return (
    <div style={{
      width: "100%",
      borderRadius: 28,
      overflow: "hidden",
      background: `linear-gradient(180deg, ${tokens.white} 0%, ${tokens.mint100} 100%)`,
      boxShadow: "0 10px 24px rgba(31,110,66,0.12)",
      position: "relative",
    }}>
      {/* 영상 영역 */}
      <div style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        background: "#000",
      }}>
        <video
          ref={videoRef}
          src="/lottery-machine.mp4"
          poster="/lottery-machine-poster.jpg"
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          onEnded={handleVideoEnded}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />

        {/* idle: GO 버튼 오버레이 */}
        {phase === "idle" && (
          <button
            onClick={handleSpin}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%)",
              border: "none",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: 28,
              cursor: "pointer",
            }}
          >
            <span style={{
              background: `linear-gradient(180deg, #4CBE7C 0%, ${tokens.green600} 100%)`,
              color: tokens.white,
              fontSize: 20,
              fontWeight: 800,
              padding: "14px 40px",
              borderRadius: 999,
              boxShadow: "0 8px 20px rgba(46,140,86,0.4)",
              letterSpacing: "0.02em",
            }}>
              GO! 돌리기
            </span>
          </button>
        )}

        {/* playing: 안내 텍스트 */}
        {phase === "playing" && (
          <div style={{
            position: "absolute",
            top: 14,
            left: 0,
            right: 0,
            textAlign: "center",
            color: tokens.white,
            fontSize: 14,
            fontWeight: 600,
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          }}>
            🎱 공을 뽑는 중...
          </div>
        )}
      </div>

      {/* 결과 카드 (영상 종료 후) */}
      {phase === "result" && order && (
        <div style={{
          padding: "24px 20px 28px",
          animation: "lmFadeInUp 0.4s ease",
        }}>
          <p style={{
            textAlign: "center",
            fontSize: 14,
            fontWeight: 500,
            color: tokens.ink500,
            marginBottom: 18,
          }}>
            🐣 씻기 요정이 정했어요.
          </p>

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            flexWrap: "wrap",
          }}>
            {order.map((id, i) => (
              <span key={id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  background: tokens.mint100,
                  color: tokens.green700,
                  fontWeight: 800,
                  fontSize: 16,
                  padding: "8px 16px",
                  borderRadius: 999,
                }}>
                  {i + 1}. {LABEL[id]}
                </span>
                {i < order.length - 1 && (
                  <span style={{ color: tokens.green500, fontSize: 16, fontWeight: 700 }}>→</span>
                )}
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
              fontSize: 13,
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            다시 뽑기
          </button>
        </div>
      )}

      <style>{`
        @keyframes lmFadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
