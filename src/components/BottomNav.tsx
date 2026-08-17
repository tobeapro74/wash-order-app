"use client";

import { useRouter, usePathname } from "next/navigation";

const TABS = [
  {
    href: "/today",
    label: "오늘의 순서",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" strokeWidth={1.8}/>
        <circle cx="12" cy="12" r="3" strokeWidth={1.8}/>
        <line x1="12" y1="3"  x2="12" y2="6"  strokeWidth={1.8}/>
        <line x1="12" y1="18" x2="12" y2="21" strokeWidth={1.8}/>
        <line x1="3"  y1="12" x2="6"  y2="12" strokeWidth={1.8}/>
        <line x1="18" y1="12" x2="21" y2="12" strokeWidth={1.8}/>
      </svg>
    ),
  },
  {
    href: "/building",
    label: "빌딩 순위",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={1.8}/>
        <line x1="7" y1="8"  x2="17" y2="8"  strokeWidth={1.8}/>
        <line x1="7" y1="12" x2="17" y2="12" strokeWidth={1.8}/>
        <rect x="9" y="15" width="6" height="6" rx="0.5" strokeWidth={1.8}/>
      </svg>
    ),
  },
  {
    href: "/setup",
    label: "내 순서",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" strokeWidth={1.8}/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeWidth={1.8}/>
      </svg>
    ),
  },
];

export function BottomNav() {
  const router   = useRouter();
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white"
      style={{
        borderTop: "1px solid #EDEDED",
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.05)",
      }}
    >
      <div className="flex items-center justify-around">
        {TABS.map(tab => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");

          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors"
            >
              {active ? (
                /* 활성: pill 캡슐 — 라벨만, 아이콘 없음 */
                <span
                  className="flex items-center justify-center rounded-full px-5 py-2"
                  style={{
                    background: "rgba(63,169,107,0.13)",
                    minWidth: 88,
                  }}
                >
                  <span
                    className="text-[13px] font-bold"
                    style={{ color: "#1F6E42" }}
                  >
                    {tab.label}
                  </span>
                </span>
              ) : (
                /* 비활성: 아이콘 + 라벨 */
                <>
                  <span style={{ color: "#5C6B60" }}>{tab.icon}</span>
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: "#5C6B60" }}
                  >
                    {tab.label}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
