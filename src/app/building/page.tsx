"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ElementId, loadMyOrder, loadScores, getRanking, orderKey, WASH_ELEMENTS,
} from "@/lib/wash";
import { apiGetRankings } from "@/lib/api";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";

type RankItem = { order: ElementId[]; score: number; likes: number; dislikes: number };

function labelOf(id: ElementId) {
  return WASH_ELEMENTS.find(e => e.id === id)?.label ?? id;
}
function emojiOf(id: ElementId) {
  const map: Record<ElementId, string> = { face: "🙂", hair: "💆", body: "🚿", teeth: "🦷" };
  return map[id] ?? "";
}

export default function BuildingPage() {
  const router = useRouter();
  useAuth();

  const [myOrder,  setMyOrder]  = useState<ElementId[] | null>(null);
  const [ranking,  setRanking]  = useState<RankItem[]>([]);
  const [popup,    setPopup]    = useState<{ floor: number; idx: number } | null>(null);
  const [elevBot,  setElevBot]  = useState(0);   // px from bottom
  const [moving,   setMoving]   = useState(false);
  const [goingUp,  setGoingUp]  = useState(true);
  const wrapRef      = useRef<HTMLDivElement>(null);
  const panelRef     = useRef<HTMLDivElement>(null);
  const autoRan      = useRef(false);
  const currentFloor = useRef(0);

  useEffect(() => {
    const my = loadMyOrder();
    if (!my) { router.replace("/setup"); return; }
    setMyOrder(my);
    apiGetRankings()
      .then(rows => {
        if (rows.length > 0)
          setRanking(rows.map(r => ({ order: r.order as ElementId[], score: r.score, likes: r.likes ?? 0, dislikes: r.dislikes ?? 0 })));
      })
      .catch(() => setRanking(getRanking(loadScores()).map(r => ({ ...r, likes: 0, dislikes: 0 }))));
  }, [router]);

  const myKey   = myOrder ? orderKey(myOrder) : "";
  const total   = ranking.length;
  const myFloor = ranking.findIndex(r => orderKey(r.order) === myKey) + 1 || 0;

  // 엘리베이터 목표 bottom px 계산
  // SVG viewBox: 0~600, 빌딩 바닥 y=600, 꼭대기 y=18 → 유효 높이 582/600
  const targetBotPx = useCallback((floor: number) => {
    const H = wrapRef.current?.offsetHeight ?? 500;
    const svgBuildingH = H * (582 / 600); // 실제 빌딩 구간 픽셀
    const floorH = svgBuildingH / Math.max(total, 1);
    return Math.round((floor - 1) * floorH + floorH * 0.5);
  }, [total]);

  // 층 선택 → 엘리베이터 이동
  const selectFloor = useCallback((floor: number, idx: number) => {
    if (moving) return;
    setGoingUp(floor >= currentFloor.current);
    setMoving(true);
    setPopup(null);
    setElevBot(targetBotPx(floor));
    setTimeout(() => {
      currentFloor.current = floor;
      setMoving(false);
      setPopup({ floor, idx });
      // 패널에서 해당 버튼으로 스크롤
      const btn = panelRef.current?.querySelector(`[data-floor="${floor}"]`) as HTMLElement;
      btn?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 2700);
  }, [moving, targetBotPx]);

  // 랭킹 로드 후 자동으로 내 층으로
  useEffect(() => {
    if (autoRan.current || total === 0 || myFloor === 0) return;
    autoRan.current = true;
    const myIdx = ranking.findIndex(r => orderKey(r.order) === myKey);
    setTimeout(() => selectFloor(myFloor, myIdx), 600);
  }, [total, myFloor, ranking, myKey, selectFloor]);

  const TOTAL_FLOORS = total;

  return (
    <div style={{
      height: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: "#0E1A14",
      color: "#E8F0EC",
      overflow: "hidden",
    }}>

      {/* ── 헤더 ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px 10px",
        background: "linear-gradient(180deg,#0E1A14 0%,transparent 100%)",
        flexShrink: 0, zIndex: 10,
      }}>
        <div>
          <div style={{
            fontSize: 26, fontWeight: 900, letterSpacing: 1,
            color: "#F5C84B",
            textShadow: "0 0 20px rgba(245,200,75,0.4)",
          }}>
            🏢 씻기 빌딩
          </div>
          <div style={{ fontSize: 11, color: "#8BAFC8", letterSpacing: 1, marginTop: 2 }}>
            24층 씻기 순위 보드
          </div>
        </div>
        {myFloor > 0 && (
          <div style={{
            background: "#1C3A2B", color: "#B5E550",
            fontSize: 12, fontWeight: 700,
            padding: "6px 14px", borderRadius: 999,
            boxShadow: "0 0 16px rgba(181,229,80,0.3)",
            border: "1px solid rgba(181,229,80,0.3)",
          }}>
            내 층: {myFloor}F
          </div>
        )}
      </div>

      {/* ── 메인 ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative", paddingBottom: 72 }}>

        {/* 별 배경 */}
        <Stars />

        {/* ── 빌딩 ── */}
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1 }}>
          {/* marginBottom: 건물 전체를 위로 3층분 올림 (3/24 ≈ 12.5%) */}
          <div ref={wrapRef} style={{ position: "relative", width: 200, height: "88%", marginBottom: "6%" }}>

            {/* 스카이라운지 뱃지 — 최상단 층 중간에 위치 */}
            <div style={{
              position: "absolute",
              bottom: "calc(97% - 2.5%)",
              left: "50%", transform: "translateX(-50%)",
              background: "linear-gradient(135deg,#FCE18A,#F5C84B)",
              color: "#1a1000", fontSize: 10, fontWeight: 900,
              padding: "3px 12px", borderRadius: 999,
              whiteSpace: "nowrap", zIndex: 10,
              boxShadow: "0 0 16px rgba(245,200,75,0.5)",
              letterSpacing: "0.5px",
            }}>
              🏆 스카이라운지
            </div>

            {/* 빌딩 SVG */}
            <BuildingSvg total={TOTAL_FLOORS} litFloor={moving ? 0 : (popup?.floor ?? 0)} />

            {/* 엘리베이터 */}
            <div style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: elevBot,
              width: 28, height: 28,
              zIndex: 25,
              transition: "bottom 2.4s cubic-bezier(0.4,0,0.2,1)",
              filter: "drop-shadow(0 0 8px rgba(245,200,75,0.8))",
            }}>
              <svg viewBox="0 0 28 28" width="28" height="28">
                <rect x="1" y="1" width="26" height="26" rx="5" fill="#F5C84B" stroke="#D89B1F" strokeWidth="1.5"/>
                <rect x="4" y="5" width="8" height="16" rx="2" fill="rgba(255,255,255,0.6)"/>
                <rect x="16" y="5" width="8" height="16" rx="2" fill="rgba(255,255,255,0.6)"/>
                <circle cx="14" cy="13" r="2" fill="#D89B1F"/>
              </svg>
            </div>

            {moving && (
              <div style={{
                position: "absolute", top: "45%", left: "50%",
                transform: "translate(-50%,-50%)",
                fontSize: 12, color: "#F5C84B", fontWeight: 700,
                whiteSpace: "nowrap", zIndex: 30,
                textShadow: "0 0 10px rgba(245,200,75,0.6)",
              }}>
                {goingUp ? "⬆ 올라가는 중..." : "⬇ 내려가는 중..."}
              </div>
            )}
          </div>
        </div>

        {/* ── 층 버튼 패널 ── */}
        <div ref={panelRef} style={{
          width: 172,
          height: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          padding: "8px 10px 80px",
          gap: 4,
          flexShrink: 0,
          zIndex: 5,
          background: "linear-gradient(90deg,transparent 0%,rgba(14,26,20,0.7) 100%)",
        }}>
          {ranking.map((item, i) => {
            const floor  = total - i;
            const isMine = orderKey(item.order) === myKey;
            const isAct  = popup?.floor === floor;
            return (
              <button
                key={orderKey(item.order)}
                data-floor={floor}
                onClick={() => selectFloor(floor, i)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 10px", borderRadius: 8,
                  border: `1px solid ${isAct ? "#B5E550" : isMine ? "#4D7A56" : "transparent"}`,
                  background: isAct
                    ? "rgba(181,229,80,0.15)"
                    : isMine
                    ? "rgba(28,58,43,0.5)"
                    : "rgba(28,58,43,0.25)",
                  cursor: "pointer",
                  color: "#E8F4FF",
                  textAlign: "left",
                  flexShrink: 0,
                  transition: "all 0.2s",
                  boxShadow: isMine ? "0 0 12px rgba(76,190,124,0.2)" : "none",
                }}
              >
                <div style={{
                  fontWeight: 900, fontSize: 17, lineHeight: 1,
                  color: isAct ? "#B5E550" : isMine ? "#B5E550" : "#B5E550",
                  minWidth: 30,
                }}>
                  {floor}F
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9, color: "#8BAFC8", letterSpacing: 0.5 }}>
                    {isMine ? "✦ 나의 층" : `${i+1}위`}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#E8F4FF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.order.map(id => labelOf(id)).join("→")}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "#8BAFC8", whiteSpace: "nowrap", display: "flex", flexDirection: "column", gap: 1 }}>
                  <span>👍{item.likes}</span>
                  <span>👎{item.dislikes}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── 결과 팝업 ── */}
        {popup && (
          <div style={{
            position: "absolute",
            bottom: 80,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(12,22,16,0.97)",
            border: "1px solid rgba(181,229,80,0.35)",
            borderRadius: 20,
            padding: "18px 22px",
            minWidth: 220,
            maxWidth: 280,
            zIndex: 50,
            boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(181,229,80,0.15)",
            textAlign: "center",
            animation: "fadeUp 0.3s ease",
          }}>
            <div style={{ fontWeight: 900, fontSize: 34, color: "#F5C84B", lineHeight: 1, textShadow: "0 0 16px rgba(245,200,75,0.5)" }}>
              {popup.floor}F
            </div>
            {ranking[ranking.length - popup.floor] && orderKey(ranking[ranking.length - popup.floor].order) === myKey && (
              <div style={{
                display: "inline-block", background: "#4CBE7C", color: "#fff",
                fontSize: 10, fontWeight: 700, padding: "2px 10px",
                borderRadius: 999, margin: "4px 0 8px", letterSpacing: 0.5,
              }}>
                ✦ 나의 씻기 순서
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, flexWrap: "wrap", margin: "10px 0" }}>
              {ranking[ranking.findIndex((_, i) => total - i === popup.floor)]?.order.map((id, j) => (
                <span key={id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {j > 0 && <span style={{ color: "#8BAFC8", fontSize: 11 }}>→</span>}
                  <span style={{
                    background: j === 0 ? "rgba(245,200,75,0.2)" : "rgba(123,184,212,0.15)",
                    border: `1px solid ${j === 0 ? "#F5C84B" : "rgba(123,184,212,0.3)"}`,
                    borderRadius: 999,
                    padding: "5px 12px",
                    fontSize: 13, fontWeight: 700,
                    color: j === 0 ? "#F5C84B" : "#E8F4FF",
                  }}>
                    {emojiOf(id)} {labelOf(id)}
                  </span>
                </span>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#8BAFC8", marginBottom: 10, display: "flex", gap: 12, justifyContent: "center" }}>
              <span>👍 {ranking[ranking.findIndex((_, i) => total - i === popup.floor)]?.likes ?? 0}</span>
              <span>👎 {ranking[ranking.findIndex((_, i) => total - i === popup.floor)]?.dislikes ?? 0}</span>
            </div>
            <button
              onClick={() => setPopup(null)}
              style={{
                background: "none", border: "1px solid rgba(123,184,212,0.3)",
                color: "#8BAFC8", fontSize: 11, padding: "5px 18px",
                borderRadius: 999, cursor: "pointer",
              }}
            >
              닫기
            </button>
          </div>
        )}
      </div>

      <BottomNav />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ── 별 배경 ── */
function Stars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const draw = () => {
      c.width = c.offsetWidth;
      c.height = c.offsetHeight;
      ctx.clearRect(0, 0, c.width, c.height);
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * c.width;
        const y = Math.random() * c.height * 0.65;
        const r = Math.random() * 1.2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,244,255,${0.3 + Math.random() * 0.6})`;
        ctx.fill();
      }
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, []);
  return (
    <canvas ref={canvasRef} style={{
      position: "absolute", inset: 0,
      width: "100%", height: "100%",
      pointerEvents: "none", zIndex: 0,
    }} />
  );
}

/* ── 빌딩 SVG ── */
function BuildingSvg({ total, litFloor }: { total: number; litFloor: number }) {
  const FLOOR_H = total > 0 ? 582 / total : 24;
  const wins: { x: number; y: number; w: number; h: number; lit: boolean }[] = [];
  const lines: { y: number }[] = [];

  for (let f = 0; f < total; f++) {
    const floor = total - f;
    const y = 600 - (f + 1) * FLOOR_H;
    const lit = floor === litFloor;
    const wh = Math.max(FLOOR_H * 0.55, 4);
    wins.push({ x: 44, y: y + FLOOR_H * 0.2, w: 16, h: wh, lit });
    wins.push({ x: 140, y: y + FLOOR_H * 0.2, w: 16, h: wh, lit });
    lines.push({ y: y + FLOOR_H });
  }

  return (
    <svg viewBox="0 0 200 600" width="100%" style={{ position: "absolute", bottom: 0, left: 0, zIndex: 3, width: "100%" }}>
      <defs>
        <linearGradient id="bg1" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#1C3A2B"/>
          <stop offset="50%" stopColor="#2A5240"/>
          <stop offset="100%" stopColor="#142B1F"/>
        </linearGradient>
        <linearGradient id="bg2" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#142B1F"/>
          <stop offset="50%" stopColor="#1C3A2B"/>
          <stop offset="100%" stopColor="#0E1F16"/>
        </linearGradient>
        <linearGradient id="shaft" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#080F0A"/>
          <stop offset="50%" stopColor="#152B1C"/>
          <stop offset="100%" stopColor="#080F0A"/>
        </linearGradient>
        <linearGradient id="ant" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7AA88A"/>
          <stop offset="100%" stopColor="#2A5240"/>
        </linearGradient>
      </defs>

      {/* 왼쪽 타워 */}
      <polygon points="20,600 20,80 88,18 88,600" fill="url(#bg1)"/>
      {/* 오른쪽 타워 */}
      <polygon points="112,18 112,600 180,80 180,600" fill="url(#bg2)"/>

      {/* 창문 */}
      {wins.map((w, i) => (
        <rect key={i} x={w.x} y={w.y} width={w.w} height={w.h} rx="2"
          fill={w.lit ? "#B5E550" : "#4D7A56"}
          opacity={w.lit ? 0.95 : 0.4}/>
      ))}

      {/* 층 구분선 */}
      {lines.map((l, i) => (
        <g key={i} stroke="rgba(11,22,41,0.5)" strokeWidth="0.8">
          <line x1="20" x2="87" y1={l.y} y2={l.y}/>
          <line x1="113" x2="180" y1={l.y} y2={l.y}/>
        </g>
      ))}

      {/* 중앙 샤프트 */}
      <rect x="88" y="18" width="24" height="582" fill="url(#shaft)"/>
      <line x1="94" y1="18" x2="94" y2="600" stroke="#1a3050" strokeWidth="1.2"/>
      <line x1="106" y1="18" x2="106" y2="600" stroke="#1a3050" strokeWidth="1.2"/>

      {/* 꼭대기 연결 */}
      <polygon points="88,18 100,6 112,18" fill="#2A5240"/>

      {/* 안테나 */}
      <line x1="54" y1="80" x2="54" y2="0" stroke="url(#ant)" strokeWidth="1.8"/>
      <circle cx="54" cy="0" r="2" fill="#F5C84B"/>
      <line x1="146" y1="80" x2="146" y2="0" stroke="url(#ant)" strokeWidth="1.8"/>
      <circle cx="146" cy="0" r="2" fill="#F5C84B"/>
      <line x1="100" y1="6" x2="100" y2="-24" stroke="#8BAFC8" strokeWidth="2"/>
      <circle cx="100" cy="-26" r="2.5" fill="#F5C84B"/>

      {/* 지면 */}
      <rect x="10" y="596" width="180" height="8" rx="2" fill="#0a1825"/>
    </svg>
  );
}
