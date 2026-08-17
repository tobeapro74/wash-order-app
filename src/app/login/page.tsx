"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { initKakao, loadUser } from "@/lib/auth";
import { Kaechi } from "@/components/Kaechi";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // 이미 로그인된 경우 스킵
    const user = loadUser();
    if (user) {
      router.replace("/today");
      return;
    }
    initKakao();
  }, [router]);

  const handleKakaoLogin = () => {
    const w = window as unknown as {
      Kakao?: {
        Auth?: {
          login: (opts: {
            success: (res: { access_token: string }) => void;
            fail: (err: unknown) => void;
          }) => void;
        };
        API?: {
          request: (opts: {
            url: string;
            success: (res: { id: number; kakao_account?: { profile?: { nickname?: string; profile_image_url?: string } } }) => void;
            fail: (err: unknown) => void;
          }) => void;
        };
      };
    };

    if (!w.Kakao?.Auth) {
      alert("카카오 SDK 로딩 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    w.Kakao.Auth.login({
      success: () => {
        w.Kakao!.API!.request({
          url: "/v2/user/me",
          success: (res) => {
            const kakaoId = String(res.id);
            const nickname = res.kakao_account?.profile?.nickname ?? "";
            const profileImage = res.kakao_account?.profile?.profile_image_url;

            // 닉네임이 있으면 바로 저장, 없으면 닉네임 입력 페이지로
            if (nickname) {
              import("@/lib/auth").then(({ saveUser }) => {
                saveUser({ kakaoId, nickname, profileImage });
                router.replace("/today");
              });
            } else {
              // kakaoId만 임시 저장 후 닉네임 입력으로
              sessionStorage.setItem("pending_kakao_id", kakaoId);
              if (profileImage) sessionStorage.setItem("pending_profile_image", profileImage);
              router.push("/nickname");
            }
          },
          fail: (err) => {
            console.error("카카오 사용자 정보 실패", err);
            alert("로그인 중 오류가 발생했어요.");
          },
        });
      },
      fail: (err) => {
        console.error("카카오 로그인 실패", err);
      },
    });
  };

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 24px",
      background: "linear-gradient(180deg,#EAF7EE 0%,#D8F0E0 45%,#C7ECD9 100%)",
    }}>
      {/* 마스코트 */}
      <div style={{ marginBottom: 24 }}>
        <Kaechi mood="wave" size={140} animate />
      </div>

      {/* 타이틀 */}
      <h1 style={{
        fontSize: 32, fontWeight: 900, color: "#1E2A22",
        textAlign: "center", lineHeight: 1.2, letterSpacing: "-0.5px",
        marginBottom: 10,
      }}>
        오늘은<br/>어디부터 씻을까요?
      </h1>
      <p style={{
        fontSize: 15, color: "#5C6B60", textAlign: "center",
        lineHeight: 1.6, marginBottom: 48,
      }}>
        씻기 요정과 함께<br/>나만의 씻기 루틴을 만들어요 🐥
      </p>

      {/* 카카오 로그인 버튼 */}
      <button
        onClick={handleKakaoLogin}
        style={{
          width: "100%",
          maxWidth: 360,
          height: 56,
          borderRadius: 999,
          background: "#FEE500",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          fontSize: 16,
          fontWeight: 700,
          color: "#191919",
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(254,229,0,0.5)",
        }}
      >
        {/* 카카오 로고 */}
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <ellipse cx="11" cy="10" rx="11" ry="10" fill="#191919"/>
          <path d="M11 4.5C7.41 4.5 4.5 6.74 4.5 9.5C4.5 11.29 5.6 12.88 7.29 13.82L6.6 16.5L9.6 14.6C10.06 14.67 10.52 14.7 11 14.7C14.59 14.7 17.5 12.46 17.5 9.7C17.5 6.94 14.59 4.5 11 4.5Z" fill="#FEE500"/>
        </svg>
        카카오로 시작하기
      </button>

      <p style={{
        marginTop: 20, fontSize: 12, color: "#5C6B60",
        textAlign: "center", lineHeight: 1.6,
      }}>
        로그인 시 닉네임·프로필 사진 제공에 동의하게 됩니다
      </p>
    </div>
  );
}
