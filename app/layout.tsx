import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vling Style Influencer Platform",
  description: "유튜브 & 블로그 인플루언서 발굴 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
