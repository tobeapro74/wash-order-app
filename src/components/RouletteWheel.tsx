"use client";

import { useState, useRef } from "react";
import { ElementId } from "@/lib/wash";

interface RouletteWheelProps {
  myOrder: ElementId[] | null;
  onResult: (order: ElementId[], isJoker: boolean) => void;
}

const SEGMENTS = [
  { id: "teeth" as ElementId, label: "양치",   img: "/char-teeth.png", bg: "#EDE8F5", accent: "#7B5EA7", text: "#4A3070" },
  { id: "face"  as ElementId, label: "세수",   img: "/char-face.png",  bg: "#E8F5EE", accent: "#5BAF7A", text: "#2D5A3D" },
  { id: "hair"  as ElementId, label: "머리감기", img: "/char-hair.png",  bg: "#EDE8F5", accent: "#7B5EA7", text: "#4A3070" },
  { id: "body"  as ElementId, label: "몸",     img: "/char-body.png",  bg: "#E8F5EE", accent: "#5BAF7A", text: "#2D5A3D" },
];

const TOTAL = 4;
const SECTION_DEG = 90;
const SPIN_DURATION = 4200; // ms
const RESULT_DELAY = 1200;  // 멈춘 후 결과 보여주기까지 대기 (ms)

function pickOrderStartingWith(first: ElementId): ElementId[] {
  const rest = (["teeth","face","hair","body"] as ElementId[]).filter(id => id !== first);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [first, ...rest];
}

export function RouletteWheel({ myOrder, onResult }: RouletteWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [isStopped, setIsStopped] = useState(false); // 멈췄지만 결과 전환 전
  const [rotation, setRotation] = useState(0);
  const finalRotRef = useRef(0);

  const spin = () => {
    if (isSpinning || isStopped) return;
    setIsSpinning(true);
    setIsStopped(false);

    const isJoker = myOrder != null && Math.random() < 1 / 25;
    const targetIdx = isJoker
      ? SEGMENTS.findIndex(s => s.id === myOrder![0])
      : Math.floor(Math.random() * TOTAL);

    const targetAngle = targetIdx * SECTION_DEG + SECTION_DEG / 2;
    const spins = 5 + Math.floor(Math.random() * 3);
    const newRotation = rotation + 360 * spins + (360 - targetAngle);
    finalRotRef.current = newRotation;
    setRotation(newRotation);

    // 애니메이션 끝 → 잠깐 멈춤 → 결과 전환
    setTimeout(() => {
      setIsSpinning(false);
      setIsStopped(true);
      const resultOrder = isJoker ? myOrder! : pickOrderStartingWith(SEGMENTS[targetIdx].id);
      setTimeout(() => {
        setIsStopped(false);
        onResult(resultOrder, isJoker);
      }, RESULT_DELAY);
    }, SPIN_DURATION);
  };

  const S = 260;
  const cx = S / 2;
  const cy = S / 2;
  const outerR = 106;
  const innerR = 40;
  const rimR  = outerR + 9;
  const dotR  = outerR + 17;

  const rad = (d: number) => (d * Math.PI) / 180;

  function segPath(i: number) {
    const a1 = rad(i * SECTION_DEG - 90);
    const a2 = rad((i + 1) * SECTION_DEG - 90);
    return [
      `M ${cx + innerR * Math.cos(a1)} ${cy + innerR * Math.sin(a1)}`,
      `L ${cx + outerR * Math.cos(a1)} ${cy + outerR * Math.sin(a1)}`,
      `A ${outerR} ${outerR} 0 0 1 ${cx + outerR * Math.cos(a2)} ${cy + outerR * Math.sin(a2)}`,
      `L ${cx + innerR * Math.cos(a2)} ${cy + innerR * Math.sin(a2)}`,
      `A ${innerR} ${innerR} 0 0 0 ${cx + innerR * Math.cos(a1)} ${cy + innerR * Math.sin(a1)} Z`,
    ].join(" ");
  }

  // 각 칸의 중심 좌표
  function mid(i: number, r: number) {
    const a = rad(i * SECTION_DEG + SECTION_DEG / 2 - 90);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function rot(i: number) { return i * SECTION_DEG + SECTION_DEG / 2; }

  // 이모지와 텍스트를 분리 배치할 반지름
  // 각 칸의 방사 방향으로 이모지(안쪽)→텍스트(바깥쪽) 순서로 배치
  const emojiR = outerR - 42;  // 이미지 중심 (안쪽)
  const labelR = outerR - 12;  // 텍스트 중심 (바깥쪽)

  const ledDots = Array.from({ length: 12 }, (_, i) => {
    const a = rad(i * 30 - 90);
    return { x: cx + dotR * Math.cos(a), y: cy + dotR * Math.sin(a) };
  });

  return (
    <div className="flex flex-col items-center w-full">

      {/* ── 배경 패널 ── */}
      <div
        className="w-full rounded-3xl flex flex-col items-center gap-0"
        style={{
          background: "linear-gradient(160deg,#2D6B45 0%,#3D8A5C 55%,#5BAF7A 100%)",
          boxShadow: "0 8px 32px rgba(45,107,69,0.35)",
          paddingTop: 28,
          paddingBottom: 28,
        }}
      >
        {/* 상단 타이틀 */}
        <div className="text-center mb-8">
          <p className="text-white font-extrabold text-lg leading-tight drop-shadow">
            🎰 오늘의 씻기 순서
          </p>
          <p className="text-white/60 text-xs mt-0.5">
            GO 버튼을 눌러보세요!
          </p>
        </div>

        {/* 포인터 + 룰렛을 relative 컨테이너로 묶어 정확한 중앙 배치 */}
        <div style={{ position: "relative", width: S, height: S + 14 }}>

          {/* 포인터 — 룰렛 상단 중앙 */}
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
            <svg width="36" height="28" viewBox="0 0 36 28">
              <ellipse cx="18" cy="12" rx="12" ry="12" fill="#FF4D4D" />
              <ellipse cx="18" cy="12" rx="7"  ry="7"  fill="white" opacity="0.4" />
              <polygon points="18,28 8,16 28,16" fill="#FF4D4D" />
              <ellipse cx="18" cy="12" rx="4"  ry="4"  fill="white" opacity="0.7" />
            </svg>
          </div>

          {/* 룰렛 휠 */}
          <div
            style={{
              position: "absolute",
              top: 14,
              left: 0,
              width: S,
              height: S,
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning
                ? `transform ${SPIN_DURATION}ms cubic-bezier(0.17,0.67,0.12,0.99)`
                : "none",
            }}
          >
            <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S}>
              <defs>
                <radialGradient id="rg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor="#3D8A5C" />
                  <stop offset="100%" stopColor="#1E5235" />
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              <circle cx={cx} cy={cy} r={dotR + 8} fill="url(#rg)" />

              {ledDots.map((d, i) => (
                <circle key={i} cx={d.x} cy={d.y} r={5.5}
                  fill={i % 2 === 0 ? "#FFD93D" : "#fff"}
                  filter="url(#glow)" opacity={0.9} />
              ))}

              <circle cx={cx} cy={cy} r={rimR} fill="white" />

              {SEGMENTS.map((seg, i) => {
                const ePos = mid(i, emojiR);
                const lPos = mid(i, labelR);
                return (
                  <g key={seg.id}>
                    <path d={segPath(i)} fill={seg.bg} stroke="white" strokeWidth="3" />

                    {/* 캐릭터 이미지 — 칸 안쪽(중심 가까운 쪽) */}
                    <image
                      href={seg.img}
                      x={ePos.x - 19} y={ePos.y - 19}
                      width={38} height={38}
                      transform={`rotate(${rot(i)}, ${ePos.x}, ${ePos.y})`}
                      preserveAspectRatio="xMidYMid meet"
                      style={{ }}
                    />

                    {/* 텍스트 — 이모지 아래(바깥쪽) */}
                    <text
                      x={lPos.x} y={lPos.y}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize="12" fontWeight="900"
                      fill={seg.text}
                      transform={`rotate(${rot(i)}, ${lPos.x}, ${lPos.y})`}
                      style={{ fontFamily:"'Apple SD Gothic Neo','Noto Sans KR',sans-serif" }}
                    >
                      {seg.label}
                    </text>

                    <line
                      x1={cx + innerR * Math.cos(rad(i * SECTION_DEG - 90))}
                      y1={cy + innerR * Math.sin(rad(i * SECTION_DEG - 90))}
                      x2={cx + outerR * Math.cos(rad(i * SECTION_DEG - 90))}
                      y2={cy + outerR * Math.sin(rad(i * SECTION_DEG - 90))}
                      stroke="white" strokeWidth="3"
                    />
                  </g>
                );
              })}

              <circle cx={cx} cy={cy} r={innerR + 6} fill="white" />
              <circle cx={cx} cy={cy} r={innerR + 2} fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="2" />
            </svg>
          </div>

          {/* GO 버튼 — 룰렛 정중앙 위에 float */}
          <div
            onClick={spin}
            style={{
              position: "absolute",
              top: 14 + S / 2 - 48,
              left: S / 2 - 48,
              zIndex: 20,
              cursor: (isSpinning || isStopped) ? "not-allowed" : "pointer",
            }}
          >
            <svg viewBox="0 0 96 96" width={96} height={96}>
              <circle cx="48" cy="52" r="42" fill="rgba(0,0,0,0.18)" />
              <circle cx="48" cy="48" r="44" fill={(isSpinning || isStopped) ? "#6B7280" : "#F5C842"} />
              <circle cx="48" cy="48" r="38" fill={(isSpinning || isStopped) ? "#9CA3AF" : "#5BAF7A"} />
              <circle cx="48" cy="48" r="32" fill={(isSpinning || isStopped) ? "#6B7280" : "#3D8A5C"} />
              <text x="48" y="45" textAnchor="middle" dominantBaseline="middle"
                fontSize="18" fontWeight="900" fill="white" letterSpacing="1"
                style={{ fontFamily:"'Apple SD Gothic Neo','Noto Sans KR',sans-serif" }}>
                {isSpinning ? "🌀" : isStopped ? "✅" : "GO!"}
              </text>
              <text x="48" y="62" textAnchor="middle" dominantBaseline="middle"
                fontSize="9" fill="rgba(255,255,255,0.7)"
                style={{ fontFamily:"'Apple SD Gothic Neo','Noto Sans KR',sans-serif" }}>
                {isSpinning ? "고르는중" : isStopped ? "완료!" : "돌리기"}
              </text>
            </svg>
          </div>
        </div>

        {/* 안내 문구 */}
        <p className="text-white/70 text-xs text-center" style={{ marginTop: 20 }}>
          {isSpinning
            ? "씻기 요정이 고르는 중이에요... ✨"
            : isStopped
            ? "결과를 확인하는 중이에요! 🎉"
            : "⭐ 운이 좋으면 나의 씻기 순서가 당첨될 수 있어요!"}
        </p>
      </div>
    </div>
  );
}
