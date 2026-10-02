'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, Lock, Film, Bookmark, BarChart3, DollarSign, BookOpen 
} from 'lucide-react';

// PRO 멤버십 상태를 하위 모든 페이지에서 공유
const ProContext = createContext<{ isProUser: boolean; togglePro: () => void }>({
  isProUser: true,
  togglePro: () => {},
});

export const usePro = () => useContext(ProContext);

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isProUser, setIsProUser] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 현재 페이지 확인 (블로그인지 유튜브인지 판별)
  const isBlog = pathname?.startsWith('/blog');

  // URL의 ?q= 검색어 파라미터와 인풋 동기화
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams, pathname]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val.trim()) {
      params.set('q', val.trim());
    } else {
      params.delete('q');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const togglePro = () => setIsProUser((prev) => !prev);

  return (
    <ProContext.Provider value={{ isProUser, togglePro }}>
      <div className="flex h-screen bg-[#f8f9fa] text-slate-800 antialiased overflow-hidden font-sans">
        {/* 1. 공통 좌측 사이드바 */}
        <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between flex-shrink-0 z-30">
          <div>
            <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-2">
              <Link href="/" className="text-2xl font-black tracking-tight text-red-500">vling</Link>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                isBlog ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
              }`}>
                {isBlog ? 'BLOG PRO' : 'YOUTUBE PRO'}
              </span>
            </div>

            <div className="p-4 space-y-6">
              <div>
                <p className="text-xs font-semibold text-slate-400 px-3 mb-2 tracking-wider">인플루언서 탐색</p>
                <nav className="space-y-1">
                  <Link
                    href="/"
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                      !isBlog ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Search size={18} /> 유튜버 찾기
                  </Link>

                  <Link
                    href="/blog"
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                      isBlog ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen size={18} /> 블로그인플루언서 찾기
                  </Link>

                  <button
                    type="button"
                    onClick={() => alert('영상 라이브러리 기능 준비 중입니다.')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <Film size={18} /> 영상 라이브러리
                  </button>

                  <button
                    type="button"
                    onClick={() => alert('즐겨찾기 목록 준비 중입니다.')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <Bookmark size={18} /> 즐겨찾기
                  </button>
                </nav>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 px-3 mb-2 tracking-wider">분석 도구</p>
                <nav className="space-y-1">
                  <Link
                    href="/compare"
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                      pathname === '/compare' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <BarChart3 size={18} /> 채널 비교분석
                  </Link>
                  <Link
                    href="/calculator"
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                      pathname === '/calculator' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <DollarSign size={18} /> 수익 계산기
                  </Link>
                </nav>
              </div>
            </div>
          </div>

          {/* 하단 PRO 토글 버튼 */}
          <div className="p-4 border-t border-slate-100">
            <button
              type="button"
              onClick={togglePro}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                isProUser
                  ? isBlog 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white' 
                    : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isProUser ? '👑 PRO 플랜 활성화됨' : '🔒 무료(베이직) 모드 ON'}
            </button>
          </div>
        </aside>

        {/* 2. 우측 전체 프레임 (공통 상단 헤더 + 각 하위 페이지 컨텐츠) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* 공통 상단 헤더 (페이지별 맞춤 검색창) */}
          <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between flex-shrink-0 z-20">
            <div className="relative w-96 flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              <input
                type="text"
                placeholder={isBlog ? "블로거 이름 또는 네이버 아이디 검색..." : "유튜버 이름 또는 핸들 검색..."}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className={`w-full pl-10 pr-10 py-2 border border-slate-200 rounded-full text-sm bg-slate-50 focus:bg-white focus:outline-none transition ${
                  isBlog ? 'focus:ring-2 focus:ring-green-600' : 'focus:ring-2 focus:ring-red-500'
                }`}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => alert('월 29,000원부터 시작하는 스타터/비즈니스 플랜입니다.')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 transition cursor-pointer"
              >
                요금안내
              </button>
              <button
                type="button"
                onClick={() => setIsProUser(true)}
                className={`text-xs font-semibold text-white px-4 py-2 rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1.5 ${
                  isBlog ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                <Lock size={12} /> PRO 업그레이드
              </button>
            </div>
          </header>

          {/* 3. 하위 페이지가 렌더링되는 영역 */}
          <main className="flex-1 overflow-hidden relative">
            {children}
          </main>
        </div>
      </div>
    </ProContext.Provider>
  );
}
