"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WASH_ELEMENTS, ElementId, saveMyOrder, loadMyOrder } from "@/lib/wash";
import { apiSaveMyOrder, apiGetMyOrder } from "@/lib/api";
import { Kaechi, WASH_CHAR } from "@/components/Kaechi";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

const STEP_LABELS    = ["첫 번째", "두 번째", "세 번째", "마지막"];
const STEP_QUESTIONS = [
  "제일 먼저 어디부터 씻으세요?",
  "그 다음은 어디를 씻으세요?",
  "그 다음은 어디를 씻으세요?",
  "마지막으로 어디를 씻으세요?",
];

// 드래그 핸들 아이콘
function HandleIcon() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
      <line x1="2" y1="2"  x2="18" y2="2"  stroke="#5C6B60" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <line x1="2" y1="7"  x2="18" y2="7"  stroke="#5C6B60" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <line x1="2" y1="12" x2="18" y2="12" stroke="#5C6B60" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

export default function SetupPage() {
  const router   = useRouter();
  useAuth();  // 비로그인 시 /login 리다이렉트
  const [myOrder, setMyOrder] = useState<ElementId[] | null | undefined>(undefined);
  const [selected, setSelected] = useState<ElementId[]>([]);

  useEffect(() => {
    const local = loadMyOrder();
    if (local) { setMyOrder(local); return; }
    apiGetMyOrder().then(remote => {
      if (remote) { saveMyOrder(remote as ElementId[]); setMyOrder(remote as ElementId[]); }
      else setMyOrder(null);
    }).catch(() => setMyOrder(null));
  }, []);

  /* ── 확인 화면 (순서 이미 있음) ── */
  if (myOrder !== undefined && myOrder !== null) {
    return (
      <div className="flex flex-col min-h-dvh"
        style={{ background: "linear-gradient(180deg,#EAF7EE 0%,#D8F0E0 45%,#C7ECD9 100%)" }}>

        {/* 헤더: 타이틀 좌측 + 마스코트 우측 */}
        <div className="px-5 flex items-center justify-between" style={{ paddingTop: 60, paddingBottom: 20 }}>
          <h1 style={{
            fontSize: 38, fontWeight: 900, color: "#1E2A22",
            letterSpacing: "-1px", lineHeight: 1.15,
          }}>
            나의 씻기<br/>루틴
          </h1>
          <Kaechi mood="wave" size={100} animate={false} />
        </div>

        {/* 순서 카드 리스트 */}
        <div className="flex-1 px-5 pb-44 flex flex-col" style={{ gap: 14 }}>
          {myOrder.map((id, i) => {
            const el = WASH_ELEMENTS.find(e => e.id === id)!;
            return (
              <div key={id} className="bounce-in flex items-center gap-4"
                style={{
                  background: "#FFFFFF",
                  borderRadius: 16,
                  padding: "16px 20px",
                  height: 88,
                  boxShadow: "0 4px 14px rgba(31,110,66,0.10), 0 1px 3px rgba(0,0,0,0.06)",
                  animationDelay: `${i * 0.07}s`,
                }}>
                {/* 숫자 뱃지 — 원형 44×44 */}
                <div className="flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "linear-gradient(180deg,#3FA96B 0%,#2E8C56 100%)",
                  }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF" }}>{i + 1}</span>
                </div>
                {/* 캐릭터 */}
                <Image src={WASH_CHAR[id]} alt={el.label}
                  width={56} height={56} style={{ objectFit: "contain", flexShrink: 0 }} />
                {/* 라벨 */}
                <span className="flex-1" style={{ fontSize: 17, fontWeight: 600, color: "#1E2A22" }}>
                  {el.label}
                </span>
                {/* 드래그 핸들 */}
                <HandleIcon />
              </div>
            );
          })}
        </div>

        {/* 하단 고정 버튼 */}
        <div className="fixed z-30 px-5 flex flex-col gap-2"
          style={{
            bottom: "calc(env(safe-area-inset-bottom) + 84px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: 448,
          }}>
          <button onClick={() => router.push("/today")}
            className="w-full font-bold text-white"
            style={{
              height: 56,
              borderRadius: 999,
              background: "linear-gradient(180deg,#4CBE7C 0%,#2E8C56 100%)",
              boxShadow: "0 8px 20px rgba(46,140,86,0.35)",
              fontSize: 17,
              letterSpacing: "0.02em",
              border: "none",
              cursor: "pointer",
            }}>
            오늘의 씻기 순서 보기 🎰
          </button>
          <button
            onClick={() => { localStorage.removeItem("wash_my_order"); setMyOrder(null); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, color: "#5C6B60", textAlign: "center", padding: "4px 0",
            }}>
            순서 초기화
          </button>
        </div>

        <BottomNav />
      </div>
    );
  }

  /* ── 로딩 ── */
  if (myOrder === undefined) return null;

  /* ── 순서 선택 화면 ── */
  const remaining = WASH_ELEMENTS.map(e => e.id as ElementId).filter(id => !selected.includes(id));
  const step      = selected.length;

  const handlePick = (id: ElementId) => {
    const next = [...selected, id];
    if (next.length === 4) {
      saveMyOrder(next);
      apiSaveMyOrder(next);
      router.push("/today");
    } else {
      setSelected(next);
    }
  };

  return (
    <div className="flex flex-col min-h-dvh"
      style={{ background: "linear-gradient(180deg,#EAF7EE 0%,#D8F0E0 45%,#C7ECD9 100%)" }}>

      {/* 진행 바 */}
      <div className="flex gap-2 px-5 pt-14 pb-0">
        {[0,1,2,3].map(i => (
          <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < step ? "#3FA96B" : "#9FE0B8" }} />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-5 pb-10">
        <Kaechi mood="question" size={140} />

        <div className="text-center">
          <p className="text-xs font-bold tracking-widest mb-1.5" style={{ color: "#3FA96B" }}>
            {STEP_LABELS[step]}
          </p>
          <p className="font-bold leading-snug" style={{ fontSize: 20, color: "#1E2A22" }}>
            {STEP_QUESTIONS[step]}
          </p>
        </div>

        {/* 선택된 순서 미리보기 */}
        {selected.length > 0 && (
          <div className="flex items-center gap-2 fade-up">
            {selected.map((id, i) => {
              const el = WASH_ELEMENTS.find(e => e.id === id)!;
              return (
                <span key={id} className="flex items-center gap-1.5">
                  <span className="flex flex-col items-center gap-0.5">
                    <Image src={WASH_CHAR[id]} alt={el.label}
                      width={36} height={36} style={{ objectFit: "contain" }} />
                    <span className="text-[10px] font-bold" style={{ color: "#5C6B60" }}>{el.label}</span>
                  </span>
                  <span style={{ color: "#3FA96B", fontSize: 14 }}>→</span>
                </span>
              );
            })}
            <span className="text-2xl opacity-25">?</span>
          </div>
        )}

        {/* 선택 버튼 2×2 그리드 */}
        <div className="w-full grid grid-cols-2 gap-3">
          {remaining.map(id => {
            const el = WASH_ELEMENTS.find(e => e.id === id)!;
            return (
              <button key={id} onClick={() => handlePick(id)}
                className="flex flex-col items-center gap-2 rounded-2xl active:scale-95 transition-transform"
                style={{
                  background: "#FFFFFF",
                  padding: "20px 12px",
                  boxShadow: "0 6px 16px rgba(31,110,66,0.12)",
                  border: "none",
                }}>
                <Image src={WASH_CHAR[id]} alt={el.label}
                  width={64} height={64} style={{ objectFit: "contain" }} />
                <span className="font-semibold" style={{ fontSize: 15, color: "#1E2A22" }}>
                  {el.label}
                </span>
              </button>
            );
          })}
        </div>

        {selected.length > 0 && (
          <button onClick={() => setSelected(prev => prev.slice(0, -1))}
            className="text-sm font-bold" style={{ color: "#5C6B60" }}>
            ← 이전으로
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
