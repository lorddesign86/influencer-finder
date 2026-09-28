import './globals.css';

export const metadata = {
  title: '인플루언서 랭킹 파인더',
  description: 'B2B 인플루언서 분석 플랫폼',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-slate-900 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
