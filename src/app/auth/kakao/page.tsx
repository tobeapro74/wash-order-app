"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveUser } from "@/lib/auth";
import { Kaechi } from "@/components/Kaechi";
import { Suspense } from "react";

function KakaoCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) { setError("인가 코드가 없습니다."); return; }

    (async () => {
      try {
        // 서버 API Route를 통해 토큰 교환 (CORS 우회)
        const res = await fetch("/api/kakao-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(`토큰 교환 실패 (${res.status}): ${JSON.stringify(data)}`);

        const kakaoId: string = data.id;
        const nickname: string = data.nickname ?? "";
        const profileImage: string | undefined = data.profileImage || undefined;

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
        setError(`오류: ${e instanceof Error ? e.message : String(e)}`);
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
