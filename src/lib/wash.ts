// 씻기 4요소
export const WASH_ELEMENTS = [
  { id: "teeth", label: "양치", emoji: "🦷" },
  { id: "face",  label: "세수", emoji: "🙂" },
  { id: "hair",  label: "머리", emoji: "💆" },
  { id: "body",  label: "샤워", emoji: "🚿" },
] as const;

export type ElementId = typeof WASH_ELEMENTS[number]["id"];

// 4! = 24가지 순열 생성
function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  return arr.flatMap((item, i) =>
    permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map((p) => [item, ...p])
  );
}

export const ALL_ORDERS: ElementId[][] = permutations(
  WASH_ELEMENTS.map((e) => e.id)
);

// 순서 배열 → 표시 문자열
export function orderToLabel(order: ElementId[]): string {
  return order.map((id) => WASH_ELEMENTS.find((e) => e.id === id)!.emoji).join(" → ");
}

// LocalStorage 키
const LS_MY_ORDER = "wash_my_order";
const LS_SCORES   = "wash_scores";
const LS_TODAY    = "wash_today";
const LS_VOTED    = "wash_voted_today";

export function saveMyOrder(order: ElementId[]) {
  localStorage.setItem(LS_MY_ORDER, JSON.stringify(order));
}
export function loadMyOrder(): ElementId[] | null {
  const v = localStorage.getItem(LS_MY_ORDER);
  return v ? JSON.parse(v) : null;
}

// scores: { [orderKey]: number }
export type Scores = Record<string, number>;

export function orderKey(order: ElementId[]): string {
  return order.join("-");
}

export function loadScores(): Scores {
  const v = localStorage.getItem(LS_SCORES);
  if (v) return JSON.parse(v);
  // 초기값: 모든 조합 0점
  const init: Scores = {};
  ALL_ORDERS.forEach((o) => { init[orderKey(o)] = 0; });
  return init;
}

export function saveScores(scores: Scores) {
  localStorage.setItem(LS_SCORES, JSON.stringify(scores));
}

export function vote(order: ElementId[], liked: boolean) {
  const scores = loadScores();
  const key = orderKey(order);
  scores[key] = (scores[key] ?? 0) + (liked ? 2 : -1);
  saveScores(scores);
}

// KST 기준 오늘 날짜 (YYYY-MM-DD)
function todayKST(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

// 오늘의 랜덤 순서 (날짜가 바뀌면 재생성, KST 기준)
export function getTodayOrder(): ElementId[] {
  const today = todayKST();
  const saved = localStorage.getItem(LS_TODAY);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.date === today) return parsed.order;
  }
  const myOrder = loadMyOrder();
  // 조커 칸: 24개 + 내 순서 1칸 추가 (25칸 중 내 것이 1개 더)
  const pool = myOrder ? [...ALL_ORDERS, myOrder] : ALL_ORDERS;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  localStorage.setItem(LS_TODAY, JSON.stringify({ date: today, order: picked }));
  return picked;
}

// 오늘 이미 투표했는지 (KST 기준)
export function hasVotedToday(): boolean {
  const today = todayKST();
  const v = localStorage.getItem(LS_VOTED);
  if (!v) return false;
  return JSON.parse(v).date === today;
}

export function markVotedToday() {
  const today = todayKST();
  localStorage.setItem(LS_VOTED, JSON.stringify({ date: today }));
}

// 빌딩 순위 정렬
export function getRanking(scores: Scores): { order: ElementId[]; score: number }[] {
  return ALL_ORDERS
    .map((order) => ({ order, score: scores[orderKey(order)] ?? 0 }))
    .sort((a, b) => b.score - a.score);
}

// 하찮은 결과 문구
const COPY_LINES = [
  "이유는 없어요.",
  "씻기 요정이 정했어요.",
  "오늘의 운명이에요.",
  "거부할 수 없어요.",
  "물이 당신을 좋아해요.",
  "오늘은 이렇게 씻는 날이에요.",
];
export function randomCopy(): string {
  return COPY_LINES[Math.floor(Math.random() * COPY_LINES.length)];
}

// 싫어요 이유 목록
export const DISLIKE_REASONS = [
  "양치가 늦어서 입이 허전해요",
  "머리가 먼저라 물이 차가워요",
  "샤워가 먼저라 기분이 이상해요",
  "순서가 그냥 마음에 안 들어요",
  "그냥 싫어요",
];
