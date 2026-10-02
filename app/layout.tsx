import './globals.css';
import Link from 'next/link';
import { Search, Film, Bookmark, BarChart3, DollarSign, Lock } from 'lucide-react';

export const metadata = {
  title: 'Findlist - Influencer Analytics Platform',
  description: 'YouTube & Naver Blog Influencer Marketing Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="flex h-screen bg-[#f8f9fa] text-slate-800 antialiased overflow-hidden font-sans">
        {/* 공통 고정 좌측 사이드바 */}
        <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between flex-shrink-0 z-20">
          <div>
            <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-2">
              <span className="text-2xl font-black tracking-tight text-red-500">findlist</span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600">PRO</span>
            </div>

            <div className="p-4 space-y-6">
              <div>
                <p className="text-xs font-semibold text-slate-400 px-3 mb-2 tracking-wider">인플루언서 탐색</p>
                <nav className="space-y-1">
                  {/* 유튜브 전용 페이지 이동 */}
                  <Link 
                    href="/youtube"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-red-600 transition"
                  >
                    <Search size={18} /> 유튜버 찾기
                  </Link>

                  {/* 블로그 전용 페이지 이동 */}
                  <Link 
                    href="/blog"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-green-50 hover:text-green-700 transition"
                  >
                    <span className="text-base leading-none">📝</span> 블로그인플루언서 찾기
                  </Link>

                  <button 
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                  >
                    <Film size={18} /> 영상 라이브러리
                  </button>
                  <button 
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                  >
                    <Bookmark size={18} /> 즐겨찾기
                  </button>
                </nav>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 px-3 mb-2 tracking-wider">분석 도구</p>
                <nav className="space-y-1">
                  <button 
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                  >
                    <BarChart3 size={18} /> 채널 비교분석
                  </button>
                  <button 
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                  >
                    <DollarSign size={18} /> 수익 계산기
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </aside>

        {/* 우측 페이지 본문 (각각의 page.tsx가 주입되는 영역) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
