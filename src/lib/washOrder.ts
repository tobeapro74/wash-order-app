export const WASH_STEPS = ["세수", "머리", "샤워", "양치"] as const;
export type WashStep = (typeof WASH_STEPS)[number];

export function drawRandomOrder(): WashStep[] {
  const arr = [...WASH_STEPS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
