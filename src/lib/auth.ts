const KAKAO_JS_KEY = "8cefe9fe0a51a3cb8f0b0f23cbb7e18d";
const LS_USER = "wash_kakao_user";

export interface WashUser {
  kakaoId: string;
  nickname: string;
  profileImage?: string;
}

// 카카오 SDK 초기화 (중복 방지)
export function initKakao() {
  const w = window as unknown as { Kakao?: { isInitialized?: () => boolean; init?: (key: string) => void } };
  if (w.Kakao && !w.Kakao.isInitialized?.()) {
    w.Kakao.init?.(KAKAO_JS_KEY);
  }
}

// 로그인된 사용자 로드
export function loadUser(): WashUser | null {
  try {
    const raw = localStorage.getItem(LS_USER);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// 사용자 저장
export function saveUser(user: WashUser) {
  localStorage.setItem(LS_USER, JSON.stringify(user));
}

// 로그아웃
export function clearUser() {
  localStorage.removeItem(LS_USER);
}

// 카카오 userId = LS 키로도 사용 (기존 wash_user_id 대체)
export function getAuthUserId(): string {
  const user = loadUser();
  if (user) return user.kakaoId;
  // 비로그인 fallback (기존 UUID)
  let id = localStorage.getItem("wash_user_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("wash_user_id", id); }
  return id;
}
