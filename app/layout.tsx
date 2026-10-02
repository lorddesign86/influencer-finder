import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "Vling Influencer Platform",
  description: "유튜브 & 네이버 블로그 인플루언서 발굴 및 비교 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased font-sans">
        <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-xs text-slate-400">화면을 불러오는 중...</div>}>
          <ClientLayout>{children}</ClientLayout>
        </Suspense>
      </body>
    </html>
  );
}
