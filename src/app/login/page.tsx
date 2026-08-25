"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadUser } from "@/lib/auth";
import { Kaechi } from "@/components/Kaechi";

const KAKAO_REST_KEY = "36794df87998cd398c837ba4c6c43b4d";
const REDIRECT_URI   = "https://main.d1qohqt5mb5sln.amplifyapp.com/auth/kakao";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loadUser()) router.replace("/today");
  }, [router]);

  const handleKakaoLogin = () => {
    setLoading(true);
    // 팝업 없이 카카오 OAuth 페이지로 직접 이동 (리다이렉트 방식)
    const params = new URLSearchParams({
      client_id: KAKAO_REST_KEY,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
    });
    window.location.href = `https://kauth.kakao.com/oauth/authorize?${params}`;
  };

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 24px",
      background: "linear-gradient(180deg,#F5F5F0 0%,#ECEEE8 45%,#E0E4D8 100%)",
    }}>
      <div style={{ marginBottom: 24 }}>
        <Kaechi mood="wave" size={140} animate />
      </div>

      <h1 style={{
        fontSize: 32, fontWeight: 900, color: "#1C2E24",
        textAlign: "center", lineHeight: 1.2, letterSpacing: "-0.5px",
        marginBottom: 10,
      }}>
        오늘은<br/>어디부터 씻을까요?
      </h1>
      <p style={{
        fontSize: 15, color: "#4D6B5A", textAlign: "center",
        lineHeight: 1.6, marginBottom: 48,
      }}>
        씻기 요정과 함께<br/>나만의 씻기 루틴을 만들어요 🐥
      </p>

      <button
        onClick={handleKakaoLogin}
        disabled={loading}
        style={{
          width: "100%", maxWidth: 360, height: 56,
          borderRadius: 999,
          background: loading ? "#E8D200" : "#FEE500",
          border: "none",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          fontSize: 16, fontWeight: 700, color: "#191919",
          cursor: loading ? "default" : "pointer",
          boxShadow: "0 4px 14px rgba(254,229,0,0.5)",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <ellipse cx="11" cy="10" rx="11" ry="10" fill="#191919"/>
          <path d="M11 4.5C7.41 4.5 4.5 6.74 4.5 9.5C4.5 11.29 5.6 12.88 7.29 13.82L6.6 16.5L9.6 14.6C10.06 14.67 10.52 14.7 11 14.7C14.59 14.7 17.5 12.46 17.5 9.7C17.5 6.94 14.59 4.5 11 4.5Z" fill="#FEE500"/>
        </svg>
        {loading ? "카카오 이동 중..." : "카카오로 시작하기"}
      </button>

      <p style={{
        marginTop: 20, fontSize: 12, color: "#4D6B5A",
        textAlign: "center", lineHeight: 1.6,
      }}>
        로그인 시 닉네임·프로필 사진 제공에 동의하게 됩니다
      </p>
    </div>
  );
}
