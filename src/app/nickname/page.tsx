"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveUser } from "@/lib/auth";
import { Kaechi } from "@/components/Kaechi";

export default function NicknamePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [error, setError]       = useState("");

  useEffect(() => {
    // kakaoId 없으면 로그인으로
    if (!sessionStorage.getItem("pending_kakao_id")) {
      router.replace("/login");
    }
  }, [router]);

  const handleSubmit = () => {
    const trimmed = nickname.trim();
    if (!trimmed) { setError("닉네임을 입력해주세요."); return; }
    if (trimmed.length < 2) { setError("2글자 이상 입력해주세요."); return; }
    if (trimmed.length > 10) { setError("10글자 이하로 입력해주세요."); return; }

    const kakaoId = sessionStorage.getItem("pending_kakao_id")!;
    const profileImage = sessionStorage.getItem("pending_profile_image") ?? undefined;
    saveUser({ kakaoId, nickname: trimmed, profileImage });
    sessionStorage.removeItem("pending_kakao_id");
    sessionStorage.removeItem("pending_profile_image");
    router.replace("/today");
  };

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0 24px",
      background: "linear-gradient(180deg,#EAF7EE 0%,#D8F0E0 45%,#C7ECD9 100%)",
    }}>
      <div style={{ marginTop: 72, marginBottom: 24 }}>
        <Kaechi mood="question" size={120} animate />
      </div>

      <h1 style={{
        fontSize: 26, fontWeight: 900, color: "#1E2A22",
        textAlign: "center", lineHeight: 1.3, letterSpacing: "-0.3px",
        marginBottom: 8,
      }}>
        어떻게 불러드릴까요?
      </h1>
      <p style={{
        fontSize: 14, color: "#5C6B60",
        textAlign: "center", marginBottom: 40,
      }}>
        빌딩 순위에 표시될 닉네임이에요
      </p>

      {/* 닉네임 입력 */}
      <div style={{ width: "100%", maxWidth: 360 }}>
        <input
          type="text"
          value={nickname}
          onChange={e => { setNickname(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder="닉네임 입력 (2~10자)"
          maxLength={10}
          style={{
            width: "100%",
            height: 56,
            borderRadius: 16,
            border: error ? "2px solid #F0857A" : "2px solid #9FE0B8",
            padding: "0 20px",
            fontSize: 17,
            fontWeight: 600,
            color: "#1E2A22",
            background: "#FFFFFF",
            outline: "none",
            boxSizing: "border-box",
            boxShadow: "0 4px 12px rgba(31,110,66,0.08)",
          }}
          autoFocus
        />
        {error && (
          <p style={{
            marginTop: 8, fontSize: 13, color: "#D9564A", paddingLeft: 4,
          }}>{error}</p>
        )}
        <p style={{
          textAlign: "right", fontSize: 12,
          color: "#5C6B60", marginTop: 6,
        }}>
          {nickname.trim().length}/10
        </p>
      </div>

      {/* 완료 버튼 */}
      <button
        onClick={handleSubmit}
        style={{
          width: "100%", maxWidth: 360,
          height: 56, marginTop: 24,
          borderRadius: 999,
          background: nickname.trim().length >= 2
            ? "linear-gradient(180deg,#4CBE7C 0%,#2E8C56 100%)"
            : "#C7ECD9",
          border: "none",
          fontSize: 17, fontWeight: 700,
          color: "#FFFFFF",
          cursor: nickname.trim().length >= 2 ? "pointer" : "default",
          boxShadow: nickname.trim().length >= 2
            ? "0 8px 20px rgba(46,140,86,0.35)" : "none",
          transition: "all 0.2s",
        }}
      >
        시작하기 🐥
      </button>
    </div>
  );
}
