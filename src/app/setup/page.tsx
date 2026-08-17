"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WASH_ELEMENTS, ElementId, saveMyOrder, loadMyOrder } from "@/lib/wash";
import { apiSaveMyOrder, apiGetMyOrder } from "@/lib/api";
import { Kaechi, WASH_CHAR } from "@/components/Kaechi";
import { BottomNav } from "@/components/BottomNav";
import Image from "next/image";

const STEP_LABELS = ["첫 번째", "두 번째", "세 번째", "마지막"];
const STEP_QUESTIONS = [
  "제일 먼저 어디부터 씻으세요?",
  "그 다음은 어디를 씻으세요?",
  "그 다음은 어디를 씻으세요?",
  "마지막으로 어디를 씻으세요?",
];

export default function SetupPage() {
  const router = useRouter();
  const [myOrder, setMyOrder] = useState<ElementId[] | null | undefined>(undefined);
  const [selected, setSelected] = useState<ElementId[]>([]);

  useEffect(() => {
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

        {/* 헤더: 텍스트만 */}
        <div className="px-6 pt-14 pb-4 text-center flex-shrink-0">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: "#8FAF97" }}>
            내 씻기 순서
          </p>
          <h1 className="text-xl font-extrabold mt-0.5" style={{ color: "#2D3A2E" }}>
            나의 씻기 루틴 🐥
          </h1>
        </div>

        <div className="flex justify-center pt-2 pb-4">
          <Kaechi mood="normal" size={112} animate={false} />
        </div>

        <div className="flex-1 px-5 pb-44 flex flex-col gap-3">
          {myOrder.map((id, i) => {
            const el = WASH_ELEMENTS.find(e => e.id === id)!;
            return (
              <div key={id} className="flex items-center gap-4 rounded-2xl px-4 py-4 bounce-in"
                style={{
                  background: "#FFFFFF",
                  border: "2px solid #C2E4CF",
                  boxShadow: "0 4px 0 #B8DECA",
                  animationDelay: `${i * 0.07}s`,
                }}>
                <div className="w-8 h-8 rounded-full text-white text-sm font-extrabold flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#5BAF7A,#3D8A5C)", boxShadow: "0 2px 0 #2A6040" }}>
                  {i + 1}
                </div>
                <Image src={WASH_CHAR[id]} alt={el.label} width={44} height={44} style={{ objectFit: "contain" }} />
                <span className="font-bold text-base" style={{ color: "#2D3A2E" }}>{el.label}</span>
              </div>
            );
          })}
        </div>

        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-5 flex flex-col gap-2 z-30">
          <button onClick={() => router.push("/today")}
            className="w-full py-5 rounded-2xl font-extrabold text-lg text-white btn-3d"
            style={{
              background: "linear-gradient(135deg,#5BAF7A 0%,#3D8A5C 100%)",
              boxShadow: "0 6px 0 #2A6040, 0 10px 20px rgba(61,138,92,0.3)",
              letterSpacing: "0.03em",
            }}>
            오늘의 씻기 순서 보기 🎰
          </button>
          <button
            onClick={() => { localStorage.removeItem("wash_my_order"); setMyOrder(null); }}
            className="text-xs text-center py-1"
            style={{ color: "rgba(0,0,0,0.2)" }}>
            순서 초기화
          </button>
        </div>

        <BottomNav />
      </div>
    );
  }

  // 로딩 중
  if (myOrder === undefined) return null;

  const remaining = WASH_ELEMENTS.map(e => e.id as ElementId).filter(id => !selected.includes(id));
  const step = selected.length;

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
    <div className="flex flex-col min-h-dvh" style={{ background: "#E8F5EE" }}>

      {/* 진행 바 */}
      <div className="flex gap-2 px-6 pt-14 pb-0">
        {[0,1,2,3].map(i => (
          <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < step ? "#5BAF7A" : "#C2E4CF" }} />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-5 pb-10">
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

        {/* 선택 버튼 - 3D 카드 */}
        <div className="w-full grid grid-cols-2 gap-3">
          {remaining.map(id => {
            const el = WASH_ELEMENTS.find(e => e.id === id)!;
            return (
              <button key={id} onClick={() => handlePick(id)}
                className="flex flex-col items-center gap-2 py-5 rounded-2xl active:scale-95 transition-transform btn-3d"
                style={{
                  background: "#FFFFFF",
                  border: "2px solid #C2E4CF",
                  boxShadow: "0 5px 0 #B8DECA, 0 8px 16px rgba(91,175,122,0.1)",
                }}>
                <Image src={WASH_CHAR[id]} alt={el.label} width={56} height={56} style={{ objectFit: "contain" }} />
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

      <BottomNav />
    </div>
  );
}
