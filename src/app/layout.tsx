import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘은 어디부터 씻지?",
  description: "매일 아침 랜덤 씻기 순서를 받고, 평가하고, 24층 빌딩에서 1등을 노려요.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "씻기순서",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ background: "#E8F5EE" }} className="min-h-dvh">
        <main className="max-w-md mx-auto min-h-dvh relative">
          {children}
        </main>
      </body>
    </html>
  );
}
