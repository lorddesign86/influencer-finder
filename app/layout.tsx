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
      <body>{children}</body>
    </html>
  );
}
