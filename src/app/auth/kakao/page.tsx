"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveUser } from "@/lib/auth";
import { Kaechi } from "@/components/Kaechi";
import { Suspense } from "react";

const REST_API_KEY  = "36794df87998cd398c837ba4c6c43b4d";
const REDIRECT_URI  = "https://main.d1qohqt5mb5sln.amplifyapp.com/auth/kakao";

function KakaoCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) { setError("인가 코드가 없습니다."); return; }

    (async () => {
      try {
        // 1. 인가코드 → access_token
        const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: REST_API_KEY,
            redirect_uri: REDIRECT_URI,
            code,
          }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new Error("토큰 발급 실패");

        // 2. access_token → 사용자 정보
        const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userData = await userRes.json();

        const kakaoId = String(userData.id);
        const nickname = userData.kakao_account?.profile?.nickname ?? "";
        const profileImage = userData.kakao_account?.profile?.profile_image_url;

        if (nickname) {
          saveUser({ kakaoId, nickname, profileImage });
          router.replace("/today");
        } else {
          sessionStorage.setItem("pending_kakao_id", kakaoId);
          if (profileImage) sessionStorage.setItem("pending_profile_image", profileImage);
          router.replace("/nickname");
        }
      } catch (e) {
        console.error(e);
        setError("로그인 처리 중 오류가 발생했습니다.");
      }
    })();
  }, [searchParams, router]);

  if (error) {
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
        background: "linear-gradient(180deg,#EAF7EE 0%,#D8F0E0 45%,#C7ECD9 100%)",
      }}>
        <p style={{ fontSize: 15, color: "#D9564A" }}>{error}</p>
        <button onClick={() => router.replace("/login")}
          style={{
            padding: "12px 24px", borderRadius: 999, border: "none",
            background: "#3FA96B", color: "#fff", fontSize: 15, fontWeight: 700,
            cursor: "pointer",
          }}>
          다시 시도하기
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 20,
      background: "linear-gradient(180deg,#EAF7EE 0%,#D8F0E0 45%,#C7ECD9 100%)",
    }}>
      <Kaechi mood="normal" size={100} animate />
      <p style={{ fontSize: 16, fontWeight: 700, color: "#1E2A22" }}>
        로그인 중...
      </p>
    </div>
  );
}

export default function KakaoCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(180deg,#EAF7EE 0%,#D8F0E0 45%,#C7ECD9 100%)",
      }}>
        <p style={{ color: "#5C6B60" }}>로딩 중...</p>
      </div>
    }>
      <KakaoCallback />
    </Suspense>
  );
}
