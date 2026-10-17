import './globals.css';
import Link from 'next/link';
import { Search, Film, Bookmark, BarChart3, DollarSign, ExternalLink, Shield, HelpCircle, Briefcase, Mail, Menu } from 'lucide-react';

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
      <body className="flex flex-col md:flex-row h-screen bg-[#f8f9fa] text-slate-800 antialiased overflow-hidden font-sans">
        {/* 모바일 최적화 공통 좌측 사이드바 (모바일에서는 접히고 PC에서는 고정) */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-white flex flex-col justify-between flex-shrink-0 z-20 overflow-y-auto max-h-48 md:max-h-full">
          <div>
            <div className="h-16 flex items-center justify-between md:justify-start px-6 border-b border-slate-100 gap-2 flex-shrink-0 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-red-500">findlist</span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600">PRO</span>
              </div>
              {/* 모바일 안내 아이콘 */}
              <div className="md:hidden text-xs text-slate-400 font-bold">
                메뉴 스크롤 ↓
              </div>
            </div>

            <div className="p-4 space-y-6">
              <div>
                <p className="text-xs font-semibold text-slate-400 px-3 mb-2 tracking-wider">인플루언서 탐색</p>
                <nav className="space-y-1">
                  <Link 
                    href="/youtube"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-red-600 transition"
                  >
                    <Search size={18} /> 유튜버 찾기
                  </Link>

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
                  <Link
                    href="/favorites"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                  >
                    <Bookmark size={18} /> 즐겨찾기
                  </Link>
                </nav>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 px-3 mb-2 tracking-wider">분석 도구</p>
                <nav className="space-y-1">
                  <Link
                    href="/compare"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                  >
                    <BarChart3 size={18} /> 채널 비교분석
                  </Link>
                  <button 
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                  >
                    <DollarSign size={18} /> 수익 계산기
                  </button>
                </nav>
              </div>

              {/* 하단 서비스 및 유틸 링크 메뉴 섹션 */}
              <div className="pt-2 border-t border-slate-100 hidden md:block">
                <p className="text-xs font-semibold text-slate-400 px-3 mb-2 tracking-wider">고객 지원 및 안내</p>
                <nav className="space-y-1 text-xs font-medium text-slate-600">
                  <Link href="/pricing" className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition">
                    <span>요금 안내</span>
                    <span className="text-[10px] bg-red-50 text-red-600 font-bold px-1.5 py-0.5 rounded">PRO</span>
                  </Link>
                  <a href="#" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition">
                    <Briefcase size={14} className="text-slate-400" /> 광고 대행 서비스
                  </a>
                  <a href="#" className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition">
                    <span>크롬 익스텐션</span>
                    <ExternalLink size={12} className="text-slate-400" />
                  </a>
                  <a href="#" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition">
                    <Shield size={14} className="text-slate-400" /> 서비스 이용약관
                  </a>
                  <a href="#" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition">
                    <HelpCircle size={14} className="text-slate-400" /> 자주 묻는 질문(FAQ)
                  </a>
                  <a href="#" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition">
                    <Mail size={14} className="text-slate-400" /> 제휴 및 고객문의
                  </a>
                </nav>
              </div>

              {/* 하단 사업자 정보 및 카피라이트 영역 (PC 전용) */}
              <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 space-y-1 px-3 leading-relaxed hidden md:block">
                <p className="font-bold text-slate-500">상호명: (주)파인드리스트</p>
                <p>대표이사: 박종범</p>
                <p>이메일: contact@findlist.co.kr</p>
                <p>주소: 서울특별시 강남구 봉은사로 524</p>
                <p className="pt-1">사업자등록번호: 841-88-01562</p>
                <p>통신판매업: 제 2026-성남분당A-0912호</p>
                <p className="pt-3 text-[10px] text-slate-300">
                  Copyright 2026 FINDLIST. All Right Reserved.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* 우측 페이지 본문 영역 (모바일 스크롤 및 반응형 대응) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto md:overflow-hidden h-full">
          {children}
        </div>
      </body>
    </html>
  );
}
