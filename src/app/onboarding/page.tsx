"use client";

import { useRouter } from "next/navigation";
import { Kaechi } from "@/components/Kaechi";

const SLIDES = [
  {
    mood: "wave" as const,
    eyebrow: "씻기 요정이 왔어요!",
    title: "오늘은\n어디부터 씻을까요?",
    desc: "매일 씻는 순서, 정해진 적 있나요?\n씻기 요정과 함께 나만의 루틴을 만들어요.",
  },
  {
    mood: "normal" as const,
    eyebrow: "룰렛으로 결정해요",
    title: "오늘의 씻기 순서를\n랜덤으로 뽑아요",
    desc: "머리? 샤워? 세수? 양치?\n룰렛을 돌려 오늘의 순서를 정해봐요.",
  },
  {
    mood: "mini" as const,
    eyebrow: "함께 투표해요",
    title: "내 순서에\n좋아요를 받아보세요!",
    desc: "다른 사람들의 씻기 순서와 비교하고\n빌딩 순위에서 내 층수를 올려봐요 🏆",
  },
];

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(180deg,#EAF7EE 0%,#D8F0E0 45%,#C7ECD9 100%)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* 슬라이드 영역 */}
      <div style={{
        flex: 1,
        overflowX: "auto",
        overflowY: "hidden",
        scrollSnapType: "x mandatory",
        display: "flex",
        scrollbarWidth: "none",
      }}>
        {SLIDES.map((slide, i) => (
          <div key={i} style={{
            minWidth: "100vw",
            scrollSnapAlign: "start",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 32px 0",
            gap: 0,
          }}>
            <div style={{ marginBottom: 28 }}>
              <Kaechi mood={slide.mood} size={160} animate />
            </div>

            <p style={{
              fontSize: 13, fontWeight: 700, color: "#3FA96B",
              letterSpacing: "0.5px", textTransform: "uppercase",
              marginBottom: 10, textAlign: "center",
            }}>
              {slide.eyebrow}
            </p>

            <h2 style={{
              fontSize: 30, fontWeight: 900, color: "#1E2A22",
              textAlign: "center", lineHeight: 1.25,
              letterSpacing: "-0.5px", marginBottom: 16,
              whiteSpace: "pre-line",
            }}>
              {slide.title}
            </h2>

            <p style={{
              fontSize: 15, color: "#5C6B60", textAlign: "center",
              lineHeight: 1.7, whiteSpace: "pre-line",
            }}>
              {slide.desc}
            </p>

            {/* 마지막 슬라이드에만 버튼 */}
            {i === SLIDES.length - 1 && (
              <button
                onClick={() => {
                  localStorage.setItem("wash_onboarded", "1");
                  router.replace("/setup");
                }}
                style={{
                  marginTop: 40,
                  width: "100%", maxWidth: 320, height: 56,
                  borderRadius: 999, border: "none",
                  background: "linear-gradient(135deg,#3FA96B 0%,#2E8C56 100%)",
                  color: "#fff", fontSize: 17, fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(63,169,107,0.4)",
                }}
              >
                나의 씻기 루틴 만들기 →
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 점 인디케이터 */}
      <div style={{
        display: "flex", justifyContent: "center", gap: 8,
        paddingBottom: 48, paddingTop: 24,
      }}>
        {SLIDES.map((_, i) => (
          <div key={i} style={{
            width: i === 0 ? 20 : 8,
            height: 8,
            borderRadius: 999,
            background: i === 0 ? "#3FA96B" : "rgba(63,169,107,0.3)",
            transition: "all 0.3s",
          }} />
        ))}
      </div>
    </div>
  );
}
