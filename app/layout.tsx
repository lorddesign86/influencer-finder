'use client';

import './globals.css';
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, Film, Bookmark, BarChart3, DollarSign, ExternalLink, 
  Shield, HelpCircle, Briefcase, Mail, ChevronLeft, ChevronRight, Menu, X 
} from 'lucide-react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false); // PC 사이드바 접힘 여부
  const [mobileOpen, setMobileOpen] = useState(false);     // 모바일 메뉴 열림 여부

  return (
    <html lang="ko">
      <body className="flex flex-col md:flex-row h-screen bg-[#f8f9fa] text-slate-800 antialiased overflow-hidden font-sans">
        
        {/* 모바일 상단 바 (모바일에서만 노출) */}
        <div className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 flex-shrink-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-red-500">findlist</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600">PRO</span>
          </div>
          <button 
            type="button" 
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* 모바일 백드롭 (메뉴 열렸을 때 배경 어둡게) */}
        {mobileOpen && (
          <div 
            className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* 좌측 사이드바 (PC: 접기/펼치기 가능, 모바일: 슬라이드 Drawer) */}
        <aside className={`
          fixed md:relative inset-y-0 left-0 z-40 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 transition-all duration-300
          ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        `}>
          <div>
            {/* 로고 및 접기/펼치기 토글 버튼 영역 */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 flex-shrink-0 bg-white relative">
              {!isCollapsed && (
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-2xl font-black tracking-tight text-red-500">findlist</span>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600">PRO</span>
                </div>
              )}
              {isCollapsed && (
                <span className="text-xl font-black tracking-tight text-red-500 mx-auto">f</span>
              )}

              {/* PC 전용 접기/펼치기 토글 버튼 (참고 사진의 화살표 위치) */}
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden md:flex items-center justify-center w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-xs transition absolute -right-3.5 top-5 z-50 cursor-pointer"
                title={isCollapsed ? '메뉴 펼치기' : '메뉴 접기'}
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            </div>

            {/* 메뉴 리스트 영역 */}
            <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] no-scrollbar">
              <div>
                {!isCollapsed && <p className="text-[11px] font-semibold text-slate-400 px-3 mb-2 tracking-wider">인플루언서 탐색</p>}
                <nav className="space-y-1">
                  <Link 
                    href="/youtube"
                    onClick={() => setMobileOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-red-600 transition"
                    title="유튜버 찾기"
                  >
                    <Search size={18} className="flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">유튜버 찾기</span>}
                  </Link>

                  <Link 
                    href="/blog"
                    onClick={() => setMobileOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-green-50 hover:text-green-700 transition"
                    title="블로그인플루언서 찾기"
                  >
                    <span className="text-base leading-none flex-shrink-0">📝</span>
                    {!isCollapsed && <span className="truncate">블로그인플루언서 찾기</span>}
                  </Link>

                  <button 
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                    title="영상 라이브러리"
                  >
                    <Film size={18} className="flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">영상 라이브러리</span>}
                  </button>

                  <Link
                    href="/favorites"
                    onClick={() => setMobileOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                    title="즐겨찾기"
                  >
                    <Bookmark size={18} className="flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">즐겨찾기</span>}
                  </Link>
                </nav>
              </div>

              <div>
                {!isCollapsed && <p className="text-[11px] font-semibold text-slate-400 px-3 mb-2 tracking-wider">분석 도구</p>}
                <nav className="space-y-1">
                  <Link
                    href="/compare"
                    onClick={() => setMobileOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                    title="채널 비교분석"
                  >
                    <BarChart3 size={18} className="flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">채널 비교분석</span>}
                  </Link>
                  <button 
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                    title="수익 계산기"
                  >
                    <DollarSign size={18} className="flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">수익 계산기</span>}
                  </button>
                </nav>
              </div>

              {/* 하단 고객 지원 메뉴 (접혔을 때 숨김) */}
              {!isCollapsed && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 px-3 mb-2 tracking-wider">고객 지원 및 안내</p>
                  <nav className="space-y-1 text-xs font-medium text-slate-600">
                    <Link href="/pricing" onClick={() => setMobileOpen(false)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition">
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
                  </nav>
                </div>
              )}
            </div>
          </div>

          {/* 하단 사업자 정보 (펼쳐졌을 때만 표시) */}
          {!isCollapsed && (
            <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400 space-y-1 leading-relaxed hidden md:block">
              <p className="font-bold text-slate-500">상호명: (주)파인드리스트</p>
              <p>대표이사: 박종범</p>
              <p>사업자등록번호: 841-88-01562</p>
              <p className="pt-2 text-[10px] text-slate-300">Copyright 2026 FINDLIST.</p>
            </div>
          )}
        </aside>

        {/* 우측 본문 콘텐츠 영역 */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full">
          {children}
        </div>
      </body>
    </html>
  );
}
