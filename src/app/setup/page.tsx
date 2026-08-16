"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WASH_ELEMENTS, ElementId, saveMyOrder, loadMyOrder } from "@/lib/wash";
import { apiSaveMyOrder, apiGetMyOrder } from "@/lib/api";

import { Kaechi, WASH_CHAR } from "@/components/Kaechi";
import Image from "next/image";

const STEP_LABELS = ["첫 번째", "두 번째", "세 번째", "마지막"];
const STEP_QUESTIONS = [
  "제일 먼저 어디부터 씻으세요?",
  "그 다음은 어디를 씻으세요?",
  "그 다음은 어디를 씻으세요?",
  "마지막으로 어디를 씻으세요?",
];

function BottomNav({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white flex z-40"
      style={{ borderTop: "1px solid #C2E4CF" }}>
      <button onClick={() => router.push("/today")} className="flex-1 py-3.5 flex flex-col items-center gap-1">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="9" stroke="#8FAF97" strokeWidth="2"/>
          <circle cx="11" cy="11" r="3" fill="#8FAF97"/>
          <line x1="11" y1="2" x2="11" y2="5" stroke="#8FAF97" strokeWidth="2" strokeLinecap="round"/>
          <line x1="11" y1="17" x2="11" y2="20" stroke="#8FAF97" strokeWidth="2" strokeLinecap="round"/>
          <line x1="2" y1="11" x2="5" y2="11" stroke="#8FAF97" strokeWidth="2" strokeLinecap="round"/>
          <line x1="17" y1="11" x2="20" y2="11" stroke="#8FAF97" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span className="text-[10px] font-bold" style={{ color: "#8FAF97" }}>오늘의 순서</span>
      </button>
      <button onClick={() => router.push("/building")} className="flex-1 py-3.5 flex flex-col items-center gap-1">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="4" y="3" width="14" height="17" rx="1.5" stroke="#8FAF97" strokeWidth="2"/>
          <line x1="8" y1="8" x2="14" y2="8" stroke="#8FAF97" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="8" y1="12" x2="14" y2="12" stroke="#8FAF97" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="8.5" y="15" width="5" height="5" rx="0.5" fill="#8FAF97"/>
        </svg>
        <span className="text-[10px] font-bold" style={{ color: "#8FAF97" }}>빌딩 순위</span>
      </button>
      <button onClick={() => router.push("/setup")} className="flex-1 py-3.5 flex flex-col items-center gap-1">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="8" r="3.5" stroke="#5BAF7A" strokeWidth="2"/>
          <path d="M4 19c0-3.866 3.134-7 7-7h0c3.866 0 7 3.134 7 7" stroke="#5BAF7A" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span className="text-[10px] font-bold" style={{ color: "#5BAF7A" }}>내 순서</span>
      </button>
    </div>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const [myOrder, setMyOrder] = useState<ElementId[] | null | undefined>(undefined);
  const [selected, setSelected] = useState<ElementId[]>([]);

  useEffect(() => {
    // 로컬 먼저, 없으면 서버에서 조회
    const local = loadMyOrder();
    if (local) { setMyOrder(local); return; }
    apiGetMyOrder().then(remote => {
      if (remote) {
        saveMyOrder(remote as ElementId[]);
        setMyOrder(remote as ElementId[]);
      } else {
        setMyOrder(null);
      }
    }).catch(() => setMyOrder(null));
  }, []);

  // 이미 순서가 있으면 확인 화면
  if (myOrder !== undefined && myOrder !== null) {
    return (
      <div className="flex flex-col min-h-dvh" style={{ background: "#E8F5EE" }}>
        <div className="px-6 pt-14 pb-6 text-center text-white"
          style={{ background: "linear-gradient(135deg,#5BAF7A 0%,#3D8A5C 100%)" }}>
          <Kaechi mood="normal" size={112} animate={false} />
          <p className="text-xl font-extrabold mt-3">나의 씻기 순서</p>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.75)" }}>
            씻기 요정이 기억하고 있어요 🐥
          </p>
        </div>

        <div className="flex-1 px-6 pt-8 pb-44 flex flex-col gap-3">
          {myOrder.map((id, i) => {
            const el = WASH_ELEMENTS.find(e => e.id === id)!;
            return (
              <div key={id} className="flex items-center gap-4 rounded-2xl px-4 py-4"
                style={{ background: "#FFFFFF", border: "2px solid #C2E4CF" }}>
                <div className="w-7 h-7 rounded-full text-white text-xs font-extrabold flex items-center justify-center flex-shrink-0"
                  style={{ background: "#5BAF7A" }}>
                  {i + 1}
                </div>
                <Image src={WASH_CHAR[id]} alt={el.label} width={40} height={40} style={{ objectFit: "contain" }} />
                <span className="font-bold text-base" style={{ color: "#2D3A2E" }}>{el.label}</span>
              </div>
            );
          })}
        </div>

        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md px-6 flex flex-col gap-2 z-30">
          <button onClick={() => router.push("/today")}
            className="w-full py-4 rounded-2xl font-extrabold text-base active:scale-95 transition-transform text-white"
            style={{ background: "#5BAF7A" }}>
            오늘의 씻기 순서 보기 🎰
          </button>
          <button
            onClick={() => { localStorage.removeItem("wash_my_order"); setMyOrder(null); }}
            className="text-xs text-center py-1"
            style={{ color: "rgba(0,0,0,0.2)" }}>
            순서 초기화
          </button>
        </div>
        <BottomNav router={router} />
      </div>
    );
  }

  // 아직 순서가 없으면 선택 화면
  if (myOrder === undefined) return null; // 로딩 중

  const remaining = WASH_ELEMENTS.map(e => e.id as ElementId).filter(id => !selected.includes(id));
  const step = selected.length;

  const handlePick = (id: ElementId) => {
    const next = [...selected, id];
    if (next.length === 4) {
      saveMyOrder(next);
      apiSaveMyOrder(next); // 서버 저장 (비동기, 실패해도 로컬은 유지)
      router.push("/today");
    } else {
      setSelected(next);
    }
  };

  return (
    <div className="flex flex-col min-h-dvh" style={{ background: "#E8F5EE" }}>

      {/* 진행 바 */}
      <div className="flex gap-2 px-6 pt-14 pb-0">
        {[0,1,2,3].map(i => (
          <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < step ? "#5BAF7A" : "#C2E4CF" }} />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 pb-8">
        <Kaechi mood="question" size={148} />

        <div className="text-center">
          <p className="text-xs font-bold tracking-widest mb-1" style={{ color: "#5BAF7A" }}>
            {STEP_LABELS[step]}
          </p>
          <p className="text-xl font-extrabold leading-snug" style={{ color: "#2D3A2E" }}>
            {STEP_QUESTIONS[step]}
          </p>
        </div>

        {/* 선택된 순서 미리보기 */}
        {selected.length > 0 && (
          <div className="flex items-center gap-2">
            {selected.map((id, i) => {
              const el = WASH_ELEMENTS.find(e => e.id === id)!;
              return (
                <span key={id} className="flex items-center gap-1">
                  <span className="flex flex-col items-center gap-0.5">
                    <Image src={WASH_CHAR[id]} alt={el.label} width={36} height={36} style={{ objectFit: "contain" }} />
                    <span className="text-[10px] font-bold" style={{ color: "#8FAF97" }}>{el.label}</span>
                  </span>
                  <span className="text-xs" style={{ color: "#C2E4CF" }}>→</span>
                </span>
              );
            })}
            <span className="text-2xl opacity-30">?</span>
          </div>
        )}

        {/* 선택 버튼 */}
        <div className="w-full grid grid-cols-2 gap-3">
          {remaining.map(id => {
            const el = WASH_ELEMENTS.find(e => e.id === id)!;
            return (
              <button key={id} onClick={() => handlePick(id)}
                className="flex flex-col items-center gap-2 py-5 rounded-2xl active:scale-95 transition-transform"
                style={{ background: "#FFFFFF", border: "2px solid #C2E4CF" }}>
                <Image src={WASH_CHAR[id]} alt={el.label} width={52} height={52} style={{ objectFit: "contain" }} />
                <span className="text-sm font-extrabold" style={{ color: "#2D3A2E" }}>{el.label}</span>
              </button>
            );
          })}
        </div>

        {selected.length > 0 && (
          <button onClick={() => setSelected(prev => prev.slice(0, -1))}
            className="text-sm font-bold" style={{ color: "#8FAF97" }}>
            ← 이전으로
          </button>
        )}
      </div>

      <BottomNav router={router} />
    </div>
  );
}
