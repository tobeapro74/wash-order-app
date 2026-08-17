"use client";

import { useRouter, usePathname } from "next/navigation";

const TABS = [
  {
    href: "/today",
    label: "오늘의 순서",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"
        stroke={active ? "#1F6E42" : "#5C6B60"} strokeWidth={active ? 2.4 : 1.8}>
        <circle cx="12" cy="12" r="9" strokeLinecap="round"/>
        <circle cx="12" cy="12" r="3" fill={active ? "#1F6E42" : "none"}
          stroke={active ? "#1F6E42" : "#5C6B60"}/>
        <line x1="12" y1="3"  x2="12" y2="6"  strokeLinecap="round"/>
        <line x1="12" y1="18" x2="12" y2="21" strokeLinecap="round"/>
        <line x1="3"  y1="12" x2="6"  y2="12" strokeLinecap="round"/>
        <line x1="18" y1="12" x2="21" y2="12" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/building",
    label: "빌딩 순위",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"
        stroke={active ? "#1F6E42" : "#5C6B60"} strokeWidth={active ? 2.4 : 1.8}>
        <rect x="4" y="3" width="16" height="18" rx="2" strokeLinecap="round"/>
        <line x1="8"  y1="8"  x2="16" y2="8"  strokeLinecap="round"/>
        <line x1="8"  y1="12" x2="16" y2="12" strokeLinecap="round"/>
        <rect x="9" y="16" width="6" height="5" rx="0.5"
          fill={active ? "#1F6E42" : "none"}
          stroke={active ? "#1F6E42" : "#5C6B60"}/>
      </svg>
    ),
  },
  {
    href: "/setup",
    label: "내 순서",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"
        stroke={active ? "#1F6E42" : "#5C6B60"} strokeWidth={active ? 2.4 : 1.8}>
        <circle cx="12" cy="8" r="4" strokeLinecap="round"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export function BottomNav() {
  const router   = useRouter();
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40"
      style={{
        background: "#FFFFFF",
        borderTop: "1px solid #EDEDED",
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-center justify-around px-2">
        {TABS.map(tab => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className="flex flex-1 flex-col items-center py-3 transition-colors"
              style={{ gap: 3 }}
            >
              {/* 활성 탭: pill 캡슐 감싸기 */}
              {active ? (
                <span
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full"
                  style={{ background: "rgba(63,169,107,0.13)" }}
                >
                  {tab.icon(true)}
                  <span className="text-[12px] font-bold" style={{ color: "#1F6E42" }}>
                    {tab.label}
                  </span>
                </span>
              ) : (
                <>
                  {tab.icon(false)}
                  <span className="text-[11px] font-medium" style={{ color: "#5C6B60" }}>
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
