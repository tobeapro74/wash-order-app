"use client";

import { useState, useRef } from "react";
import { ElementId } from "@/lib/wash";

interface RouletteWheelProps {
  myOrder: ElementId[] | null;
  onResult: (order: ElementId[], isJoker: boolean) => void;
}

// 섹터 순서: 좌상(양치)→우상(세수)→우하(몸)→좌하(머리감기) = 0°기준 시계방향
// 포인터가 12시(top)에 있으므로 상단에 걸리는 칸이 결과
const SEGMENTS = [
  { id: "teeth" as ElementId, label: "양치",   img: "/char-teeth.png", bg: "#DCD6F5" }, // lavender200
  { id: "face"  as ElementId, label: "세수",   img: "/char-face.png",  bg: "#F7CFE0" }, // pink200
  { id: "body"  as ElementId, label: "몸",     img: "/char-body.png",  bg: "#FBEFC9" }, // cream200
  { id: "hair"  as ElementId, label: "머리감기", img: "/char-hair.png",  bg: "#C7ECD9" }, // mint200
];

const SECTION_DEG  = 90;
const SPIN_DURATION = 4200;
const RESULT_DELAY  = 1000;

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
  const [isStopped,  setIsStopped]  = useState(false);
  const [rotation,   setRotation]   = useState(0);
  const finalRotRef = useRef(0);

  const spin = () => {
    if (isSpinning || isStopped) return;
    setIsSpinning(true);

    const isJoker   = myOrder != null && Math.random() < 1 / 25;
    const targetIdx = isJoker
      ? SEGMENTS.findIndex(s => s.id === myOrder![0])
      : Math.floor(Math.random() * 4);

    // 포인터가 12시 → 해당 섹터가 12시에 오도록
    const targetAngle = targetIdx * SECTION_DEG + SECTION_DEG / 2;
    const spins       = 5 + Math.floor(Math.random() * 3);
    const newRotation = rotation + 360 * spins + (360 - targetAngle);
    finalRotRef.current = newRotation;
    setRotation(newRotation);

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

  /* ── SVG 수치 ── */
  const S      = 280;   // SVG 전체 크기
  const cx     = S / 2;
  const cy     = S / 2;
  const outerR = 118;   // 섹터 바깥 반지름
  const innerR = 42;    // 중심 원 반지름
  const rimR   = outerR + 8;   // 외곽 링 반지름
  const dotR   = outerR + 17;  // LED 비드 반지름

  const rad = (d: number) => (d * Math.PI) / 180;

  // 섹터 path (도넛 형태)
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

  function mid(i: number, r: number) {
    const a = rad(i * SECTION_DEG + SECTION_DEG / 2 - 90);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  const imgR   = outerR - 44; // 캐릭터 이미지 중심
  const textR  = outerR - 14; // 라벨 텍스트 중심
  const imgSz  = 48;

  // LED 비드 12개
  const ledDots = Array.from({ length: 12 }, (_, i) => {
    const a = rad(i * 30 - 90);
    return { x: cx + dotR * Math.cos(a), y: cy + dotR * Math.sin(a) };
  });

  // 섹터 텍스트 색 (배경에 따라)
  const textColors = ["#4A3070", "#7C2A4A", "#6B5020", "#1F6E42"];

  return (
    <div className="flex flex-col items-center w-full">
      {/* 룰렛 컨테이너 카드 */}
      <div className="w-full rounded-3xl flex flex-col items-center"
        style={{
          background: "linear-gradient(160deg,#9FE0B8 0%,#C7ECD9 100%)",
          boxShadow: "0 6px 16px rgba(31,110,66,0.18)",
          padding: "24px 16px 28px",
        }}>

        {/* 포인터 + 휠을 relative 컨테이너로 묶음 */}
        <div style={{ position: "relative", width: S, height: S + 16 }}>

          {/* 포인터 (물방울 핀, 12시) */}
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
            <svg width="32" height="40" viewBox="0 0 32 40">
              <defs>
                <radialGradient id="pinGrad" cx="40%" cy="30%" r="60%">
                  <stop offset="0%" stopColor="#FF8080"/>
                  <stop offset="100%" stopColor="#E8544A"/>
                </radialGradient>
              </defs>
              <ellipse cx="16" cy="14" rx="13" ry="13" fill="url(#pinGrad)" />
              <ellipse cx="12" cy="10" rx="5" ry="4" fill="white" opacity="0.45" />
              <ellipse cx="16" cy="14" rx="4"  ry="4"  fill="white" opacity="0.25" />
              <polygon points="16,40 5,22 27,22" fill="url(#pinGrad)" />
            </svg>
          </div>

          {/* 룰렛 휠 */}
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 0,
              width: S,
              height: S,
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning
                ? `transform ${SPIN_DURATION}ms cubic-bezier(0.17,0.67,0.12,0.99)`
                : "none",
            }}>
            <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S}>
              <defs>
                {/* 외곽 링 그라데이션 */}
                <radialGradient id="ringGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="70%"  stopColor="#7BC9A0"/>
                  <stop offset="100%" stopColor="#3FA96B"/>
                </radialGradient>
                {/* LED 비드 글로시 */}
                <radialGradient id="ledGold" cx="30%" cy="30%" r="70%">
                  <stop offset="0%"   stopColor="#FFE580"/>
                  <stop offset="100%" stopColor="#F5C84B"/>
                </radialGradient>
                <radialGradient id="ledWhite" cx="30%" cy="30%" r="70%">
                  <stop offset="0%"   stopColor="#FFFFFF"/>
                  <stop offset="100%" stopColor="#C0D8C8"/>
                </radialGradient>
                <filter id="ledGlow">
                  <feGaussianBlur stdDeviation="1.5" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              {/* 외곽 링 */}
              <circle cx={cx} cy={cy} r={dotR + 9} fill="url(#ringGrad)" />

              {/* LED 비드 */}
              {ledDots.map((d, i) => (
                <circle key={i} cx={d.x} cy={d.y} r={6}
                  fill={i % 2 === 0 ? "url(#ledGold)" : "url(#ledWhite)"}
                  filter="url(#ledGlow)" opacity={0.95} />
              ))}

              {/* 흰 링 (섹터 바깥 테두리) */}
              <circle cx={cx} cy={cy} r={rimR} fill="white" />

              {/* 4색 섹터 */}
              {SEGMENTS.map((seg, i) => {
                const ePos = mid(i, imgR);
                const lPos = mid(i, textR);
                const angle = i * SECTION_DEG + SECTION_DEG / 2;
                return (
                  <g key={seg.id}>
                    <path d={segPath(i)} fill={seg.bg} stroke="white" strokeWidth="3" />

                    {/* 캐릭터 이미지 */}
                    <image
                      href={seg.img}
                      x={ePos.x - imgSz / 2} y={ePos.y - imgSz / 2}
                      width={imgSz} height={imgSz}
                      transform={`rotate(${angle}, ${ePos.x}, ${ePos.y})`}
                      preserveAspectRatio="xMidYMid meet"
                    />

                    {/* 라벨 */}
                    <text
                      x={lPos.x} y={lPos.y}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize="11" fontWeight="700"
                      fill={textColors[i]}
                      transform={`rotate(${angle}, ${lPos.x}, ${lPos.y})`}
                      style={{ fontFamily: "'Apple SD Gothic Neo','Noto Sans KR',sans-serif" }}>
                      {seg.label}
                    </text>

                    {/* 섹터 구분선 */}
                    <line
                      x1={cx + innerR * Math.cos(rad(i * SECTION_DEG - 90))}
                      y1={cy + innerR * Math.sin(rad(i * SECTION_DEG - 90))}
                      x2={cx + outerR * Math.cos(rad(i * SECTION_DEG - 90))}
                      y2={cy + outerR * Math.sin(rad(i * SECTION_DEG - 90))}
                      stroke="white" strokeWidth="3" />
                  </g>
                );
              })}

              {/* 중심 원 베이스 */}
              <circle cx={cx} cy={cy} r={innerR + 6} fill="white" />
              <circle cx={cx} cy={cy} r={innerR + 2} fill="#D8F0E0" stroke="#9FE0B8" strokeWidth="2" />
            </svg>
          </div>

          {/* GO 버튼 — 정중앙 */}
          <div onClick={spin}
            style={{
              position: "absolute",
              top: 16 + S / 2 - 52,
              left: S / 2 - 52,
              zIndex: 20,
              cursor: (isSpinning || isStopped) ? "not-allowed" : "pointer",
            }}>
            <svg viewBox="0 0 104 104" width={104} height={104}>
              <defs>
                {/* 골드 링 */}
                <linearGradient id="goldRing" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%"   stopColor="#FCE18A"/>
                  <stop offset="60%"  stopColor="#F5C84B"/>
                  <stop offset="100%" stopColor="#D89B1F"/>
                </linearGradient>
                {/* 내부 그린 */}
                <linearGradient id="goGreen" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%"   stopColor="#4CBE7C"/>
                  <stop offset="100%" stopColor="#2E8C56"/>
                </linearGradient>
                <linearGradient id="goGray" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%"   stopColor="#9CA3AF"/>
                  <stop offset="100%" stopColor="#6B7280"/>
                </linearGradient>
              </defs>
              {/* 골드 링 */}
              <circle cx="52" cy="56" r="46" fill="rgba(0,0,0,0.12)" />
              <circle cx="52" cy="52" r="46" fill="url(#goldRing)" />
              {/* 내부 버튼 */}
              <circle cx="52" cy="52" r="38"
                fill={(isSpinning || isStopped) ? "url(#goGray)" : "url(#goGreen)"} />
              {/* 하이라이트 */}
              <ellipse cx="44" cy="36" rx="14" ry="8" fill="white" opacity="0.22" />
              {/* 텍스트 */}
              <text x="52" y="48" textAnchor="middle" dominantBaseline="middle"
                fontSize="18" fontWeight="900" fill="white"
                style={{ fontFamily: "'Apple SD Gothic Neo','Noto Sans KR',sans-serif" }}>
                {isSpinning ? "🌀" : isStopped ? "✅" : "GO!"}
              </text>
              <text x="52" y="65" textAnchor="middle" dominantBaseline="middle"
                fontSize="10" fill="rgba(255,255,255,0.8)"
                style={{ fontFamily: "'Apple SD Gothic Neo','Noto Sans KR',sans-serif" }}>
                {isSpinning ? "고르는중" : isStopped ? "완료!" : "돌리기"}
              </text>
            </svg>
          </div>
        </div>

        {/* 안내 문구 */}
        <p className="text-center text-xs mt-4" style={{ color: "#1F6E42", opacity: 0.7 }}>
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
