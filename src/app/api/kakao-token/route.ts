import { NextRequest, NextResponse } from "next/server";

const REST_API_KEY = "36794df87998cd398c837ba4c6c43b4d";
const REDIRECT_URI = "https://main.d1qohqt5mb5sln.amplifyapp.com/auth/kakao";

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "no code" }, { status: 400 });

  // 서버에서 토큰 교환 (CORS 없음)
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
  if (!tokenData.access_token) {
    return NextResponse.json({ error: "token_fail", detail: tokenData }, { status: 400 });
  }

  // 서버에서 사용자 정보 조회
  const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = await userRes.json();

  return NextResponse.json({
    id: String(userData.id),
    nickname: userData.kakao_account?.profile?.nickname ?? "",
    profileImage: userData.kakao_account?.profile?.profile_image_url ?? "",
  });
}
