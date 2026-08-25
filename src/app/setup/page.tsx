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
    const STEP_LABEL = ["세수","머리","샤워","양치"];
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6"
        style={{ background: "linear-gradient(180deg,#F5F5F0 0%,#ECEEE8 45%,#E0E4D8 100%)" }}>

        {/* 상단 pill 라벨 */}
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "#D0D8CC", color: "#4D6B5A",
          fontSize: 12, fontWeight: 700,
          padding: "5px 18px", borderRadius: 999,
          letterSpacing: "0.5px", zIndex: 10,
        }}>
          셋업/내순서
        </div>

        {/* 카드 */}
        <div style={{
          width: "100%", maxWidth: 360,
          background: "#ECEEE8",
          borderRadius: 28,
          padding: "36px 28px 32px",
          display: "flex", flexDirection: "column", alignItems: "center",
          boxShadow: "0 8px 32px rgba(28,58,43,0.08)",
          marginBottom: 80,
        }}>
          {/* 원형 아이콘 */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg,#4D7A56,#1C3A2B)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 20px rgba(28,58,43,0.3)",
            marginBottom: 20, fontSize: 32,
          }}>
            🌿
          </div>

          <p style={{ fontSize: 20, fontWeight: 900, color: "#1C2E24", marginBottom: 4 }}>
            씻기 순서 설정
          </p>
          <p style={{ fontSize: 13, color: "#4D6B5A", marginBottom: 28 }}>
            나만의 순서를 정해보세요
          </p>

          {/* 순서 pill 리스트 */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
            {myOrder.map((id, i) => {
              const el = WASH_ELEMENTS.find(e => e.id === id)!;
              return (
                <div key={id} style={{
                  background: "#E0E8DC",
                  borderRadius: 999,
                  padding: "12px 20px",
                  fontSize: 15, fontWeight: 600, color: "#1C2E24",
                }}>
                  {i + 1}순위 {el.label}
                </div>
              );
            })}
          </div>

          {/* 저장하기 버튼 */}
          <button onClick={() => router.push("/today")}
            style={{
              marginTop: 28,
              height: 52, padding: "0 40px",
              borderRadius: 999,
              background: "linear-gradient(180deg,#4D7A56 0%,#1C3A2B 100%)",
              boxShadow: "0 6px 18px rgba(28,58,43,0.35)",
              fontSize: 16, fontWeight: 700, color: "#fff",
              border: "none", cursor: "pointer",
            }}>
            저장하기
          </button>

          <button
            onClick={() => { localStorage.removeItem("wash_my_order"); setMyOrder(null); }}
            style={{
              marginTop: 12,
              background: "none", border: "none", cursor: "pointer",
              fontSize: 12, color: "#4D6B5A",
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
      style={{ background: "#ECEEE8" }}>

      {/* 상단: 마스코트 + 질문 */}
      <div className="flex flex-col items-center"
        style={{ paddingTop: 56, paddingBottom: 24, background: "#ECEEE8" }}>
        <Kaechi mood="question" size={160} />
        <div className="text-center" style={{ marginTop: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#4D7A56", letterSpacing: "0.08em", marginBottom: 4 }}>
            {STEP_LABELS[step]}
          </p>
          <p style={{ fontSize: 22, fontWeight: 900, color: "#1C2E24" }}>
            {STEP_QUESTIONS[step]}
          </p>
        </div>
      </div>

      {/* 선택 버튼 2×2 그리드 */}
      <div style={{ flex: 1, padding: "0 16px 100px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {remaining.map(id => {
          const el = WASH_ELEMENTS.find(e => e.id === id)!;
          return (
            <button key={id} onClick={() => handlePick(id)}
              className="flex flex-col items-center active:scale-95 transition-transform"
              style={{
                background: "#FFFFFF",
                borderRadius: 20,
                padding: "28px 12px 20px",
                boxShadow: "0 4px 16px rgba(28,58,43,0.08)",
                border: "none", cursor: "pointer",
                gap: 12,
              }}>
              <Image src={WASH_CHAR[id]} alt={el.label}
                width={88} height={88} style={{ objectFit: "contain" }} />
              <span style={{ fontSize: 17, fontWeight: 700, color: "#1C2E24" }}>
                {el.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* 이전으로 버튼 */}
      {selected.length > 0 && (
        <div className="fixed z-30 text-center" style={{ bottom: "calc(env(safe-area-inset-bottom) + 84px)", left: 0, right: 0 }}>
          <button onClick={() => setSelected(prev => prev.slice(0, -1))}
            style={{ fontSize: 13, fontWeight: 700, color: "#4D6B5A", background: "none", border: "none", cursor: "pointer" }}>
            ← 이전으로
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
