const BASE = "https://buarx90gmk.execute-api.ap-northeast-2.amazonaws.com/prod";

// 브라우저에서 고유 userId 생성/유지
export function getUserId(): string {
  let id = localStorage.getItem("wash_user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("wash_user_id", id);
  }
  return id;
}

// 내 씻기 순서 저장 (서버 — 최초 1회만 저장됨)
export async function apiSaveMyOrder(myOrder: string[]): Promise<void> {
  const userId = getUserId();
  await fetch(`${BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, myOrder }),
  });
}

// 내 씻기 순서 조회
export async function apiGetMyOrder(): Promise<string[] | null> {
  const userId = getUserId();
  const res = await fetch(`${BASE}/users/${userId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.myOrder ?? null;
}

// 오늘의 씻기 순서
export async function apiGetTodayOrder(): Promise<string[]> {
  const userId = getUserId();
  const res = await fetch(`${BASE}/today?userId=${userId}`);
  const data = await res.json();
  return data.order;
}

// 투표
export async function apiVote(orderKey: string, liked: boolean): Promise<{ ok?: boolean; error?: string }> {
  const userId = getUserId();
  const res = await fetch(`${BASE}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, orderKey, liked }),
  });
  return res.json();
}

// 랭킹 조회
export async function apiGetRankings(): Promise<{ order: string[]; orderKey: string; score: number }[]> {
  const res = await fetch(`${BASE}/rankings`);
  const data = await res.json();
  return data.rankings ?? [];
}
