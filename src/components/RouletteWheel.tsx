"use client";

import { useState, useRef } from "react";
import { ElementId } from "@/lib/wash";

interface RouletteWheelProps {
  myOrder: ElementId[] | null;
  onResult: (order: ElementId[], isJoker: boolean) => void;
}

const SEGMENTS = [
  { id: "teeth" as ElementId, label: "양치",    img: "/char-teeth.png", bg: "#DCD6F5" }, // lavender
  { id: "face"  as ElementId, label: "세수",    img: "/char-face.png",  bg: "#F7CFE0" }, // pink
  { id: "body"  as ElementId, label: "몸",      img: "/char-body.png",  bg: "#FBEFC9" }, // cream
  { id: "hair"  as ElementId, label: "머리감기", img: "/char-hair.png",  bg: "#C7ECD9" }, // mint
];

const SECTION_DEG   = 90;
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

    const targetAngle = targetIdx * SECTION_DEG + SECTION_DEG / 2;
    // 현재 회전값을 0~359로 정규화해서 기준점 초기화 — 누적 오차 방지
    const currentNorm = rotation % 360;
    const spins       = 5 + Math.floor(Math.random() * 3);
    const newRotation = currentNorm + 360 * spins + (360 - targetAngle);
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
  const S      = 290;
  const cx     = S / 2;
  const cy     = S / 2;
  const outerR = 122;   // 섹터 바깥 반지름
  const innerR = 44;    // 중심 원 반지름
  const rimR   = outerR + 7;    // 외곽 링 안쪽 (흰 테두리)
  const ringR  = outerR + 18;   // LED 비드 링 반지름
  const dotR   = outerR + 14;   // LED 비드 위치

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

  function mid(i: number, r: number) {
    const a = rad(i * SECTION_DEG + SECTION_DEG / 2 - 90);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  const imgR  = outerR - 44;
  const textR = outerR - 14;
  const imgSz = 52;

  // LED 비드 16개
  const ledDots = Array.from({ length: 16 }, (_, i) => {
    const a = rad(i * (360 / 16) - 90);
    return { x: cx + dotR * Math.cos(a), y: cy + dotR * Math.sin(a) };
  });

  const textColors = ["#5B4FAD", "#8B3A5A", "#7A5A20", "#1F6E42"];

  return (
    <div className="flex flex-col items-center w-full">
      {/* 룰렛 컨테이너 카드 — 연한 민트 배경 */}
      <div className="w-full rounded-[28px] flex flex-col items-center"
        style={{
          background: "linear-gradient(160deg, #C7ECD9 0%, #D8F0E0 100%)",
          boxShadow: "0 8px 32px rgba(31,110,66,0.13)",
          padding: "28px 20px 32px",
          position: "relative",
          overflow: "hidden",
        }}>

        {/* 비눗방울 장식 (좌상단) */}
        <div style={{ position: "absolute", top: 20, left: 20, pointerEvents: "none" }}>
          <svg width="56" height="52" viewBox="0 0 56 52" fill="none">
            {/* 큰 비눗방울 */}
            <circle cx="22" cy="28" r="18" fill="none" stroke="rgba(180,220,200,0.6)" strokeWidth="2"/>
            <ellipse cx="16" cy="20" rx="6" ry="4" fill="rgba(255,255,255,0.45)" transform="rotate(-20,16,20)"/>
            {/* 중간 */}
            <circle cx="42" cy="18" r="10" fill="none" stroke="rgba(160,210,190,0.5)" strokeWidth="1.5"/>
            <ellipse cx="38" cy="14" rx="3" ry="2" fill="rgba(255,255,255,0.4)" transform="rotate(-15,38,14)"/>
            {/* 물방울들 */}
            <ellipse cx="44" cy="38" rx="4" ry="6" fill="rgba(160,220,200,0.5)" transform="rotate(10,44,38)"/>
            <ellipse cx="8"  cy="10" rx="3" ry="4.5" fill="rgba(200,230,220,0.45)" transform="rotate(-5,8,10)"/>
          </svg>
        </div>

        {/* 포인터 + 휠 */}
        <div style={{ position: "relative", width: S, height: S + 20 }}>

          {/* 포인터 (입체 핀) */}
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
            <svg width="38" height="48" viewBox="0 0 38 48">
              <defs>
                <radialGradient id="pinG" cx="38%" cy="28%" r="65%">
                  <stop offset="0%"   stopColor="#FF8A8A"/>
                  <stop offset="100%" stopColor="#D93025"/>
                </radialGradient>
              </defs>
              {/* 핀 그림자 */}
              <ellipse cx="19" cy="46" rx="8" ry="3" fill="rgba(0,0,0,0.12)"/>
              {/* 핀 원형 본체 */}
              <circle cx="19" cy="16" r="15" fill="url(#pinG)"/>
              {/* 하이라이트 */}
              <ellipse cx="13" cy="10" rx="6" ry="4" fill="white" opacity="0.38" transform="rotate(-20,13,10)"/>
              {/* 내부 흰 점 */}
              <circle cx="19" cy="16" r="5" fill="white" opacity="0.22"/>
              {/* 핀 꼬리 */}
              <polygon points="19,48 7,26 31,26" fill="url(#pinG)"/>
            </svg>
          </div>

          {/* 룰렛 휠 */}
          <div style={{
            position: "absolute",
            top: 20,
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
                {/* 외곽 링: 연한 민트 */}
                <radialGradient id="outerRing" cx="50%" cy="50%" r="50%">
                  <stop offset="75%"  stopColor="#A8D8BE"/>
                  <stop offset="100%" stopColor="#7BC4A0"/>
                </radialGradient>
                {/* LED 골드 */}
                <radialGradient id="ledG" cx="30%" cy="30%" r="70%">
                  <stop offset="0%"   stopColor="#FFFBE0"/>
                  <stop offset="100%" stopColor="#E8C060"/>
                </radialGradient>
                {/* LED 흰색 */}
                <radialGradient id="ledW" cx="30%" cy="30%" r="70%">
                  <stop offset="0%"   stopColor="#FFFFFF"/>
                  <stop offset="100%" stopColor="#D0EAD8"/>
                </radialGradient>
                {/* GO 버튼 골드 링 */}
                <linearGradient id="goldRing" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%"   stopColor="#FCE18A"/>
                  <stop offset="60%"  stopColor="#F5C84B"/>
                  <stop offset="100%" stopColor="#C89518"/>
                </linearGradient>
                {/* GO 버튼 내부 민트 */}
                <linearGradient id="goBtnGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%"   stopColor="#8DDAB0"/>
                  <stop offset="100%" stopColor="#5BAF7A"/>
                </linearGradient>
                <linearGradient id="goBtnGray" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%"   stopColor="#B0BEC5"/>
                  <stop offset="100%" stopColor="#78909C"/>
                </linearGradient>
                <filter id="ledShadow">
                  <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="rgba(255,255,200,0.5)"/>
                </filter>
              </defs>

              {/* 외곽 링 */}
              <circle cx={cx} cy={cy} r={ringR} fill="url(#outerRing)"/>

              {/* LED 비드 16개 */}
              {ledDots.map((d, i) => (
                <circle key={i} cx={d.x} cy={d.y} r={6.5}
                  fill={i % 2 === 0 ? "url(#ledG)" : "url(#ledW)"}
                  filter="url(#ledShadow)"
                  opacity={0.95}/>
              ))}

              {/* 흰 테두리 링 */}
              <circle cx={cx} cy={cy} r={rimR} fill="white"/>

              {/* 4색 섹터 */}
              {SEGMENTS.map((seg, i) => {
                const ePos  = mid(i, imgR);
                const lPos  = mid(i, textR);
                const angle = i * SECTION_DEG + SECTION_DEG / 2;
                return (
                  <g key={seg.id}>
                    <path d={segPath(i)} fill={seg.bg} stroke="white" strokeWidth="3"/>
                    <image
                      href={seg.img}
                      x={ePos.x - imgSz / 2} y={ePos.y - imgSz / 2}
                      width={imgSz} height={imgSz}
                      transform={`rotate(${angle},${ePos.x},${ePos.y})`}
                      preserveAspectRatio="xMidYMid meet"/>
                    <text
                      x={lPos.x} y={lPos.y}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize="12" fontWeight="700"
                      fill={textColors[i]}
                      transform={`rotate(${angle},${lPos.x},${lPos.y})`}
                      style={{ fontFamily:"'Apple SD Gothic Neo','Noto Sans KR',sans-serif" }}>
                      {seg.label}
                    </text>
                    <line
                      x1={cx + innerR * Math.cos(rad(i * SECTION_DEG - 90))}
                      y1={cy + innerR * Math.sin(rad(i * SECTION_DEG - 90))}
                      x2={cx + outerR * Math.cos(rad(i * SECTION_DEG - 90))}
                      y2={cy + outerR * Math.sin(rad(i * SECTION_DEG - 90))}
                      stroke="white" strokeWidth="3"/>
                  </g>
                );
              })}

              {/* 중심 흰 원 */}
              <circle cx={cx} cy={cy} r={innerR + 8} fill="white"/>
              {/* 골드 링 */}
              <circle cx={cx} cy={cy} r={innerR + 6} fill="url(#goldRing)"/>
              {/* GO 버튼 내부 */}
              <circle cx={cx} cy={cy} r={innerR}
                fill={(isSpinning || isStopped) ? "url(#goBtnGray)" : "url(#goBtnGrad)"}/>
              {/* 하이라이트 */}
              <ellipse cx={cx - 8} cy={cy - 12} rx={14} ry={9}
                fill="white" opacity="0.25" transform={`rotate(-20,${cx-8},${cy-12})`}/>
            </svg>
          </div>

          {/* GO 버튼 텍스트 오버레이 (클릭 영역) */}
          <div onClick={spin}
            style={{
              position: "absolute",
              top: 20 + S / 2 - innerR - 2,
              left: S / 2 - innerR - 2,
              width: (innerR + 2) * 2,
              height: (innerR + 2) * 2,
              borderRadius: "50%",
              zIndex: 20,
              cursor: (isSpinning || isStopped) ? "not-allowed" : "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0,
            }}>
            <span style={{
              fontSize: 18,
              fontWeight: 900,
              color: "white",
              fontFamily: "'Apple SD Gothic Neo','Noto Sans KR',sans-serif",
              lineHeight: 1.1,
              textShadow: "0 1px 4px rgba(0,0,0,0.18)",
            }}>
              {isSpinning ? "🌀" : isStopped ? "✅" : "GO!"}
            </span>
            <span style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.82)",
              fontFamily: "'Apple SD Gothic Neo','Noto Sans KR',sans-serif",
              fontWeight: 500,
            }}>
              {isSpinning ? "고르는중" : isStopped ? "완료!" : "돌리기"}
            </span>
          </div>
        </div>

        {/* 안내 문구 */}
        <p className="text-center text-xs mt-2" style={{ color: "#2E8C56", opacity: 0.75 }}>
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
