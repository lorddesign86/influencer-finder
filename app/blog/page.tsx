'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Lock, Mail, ExternalLink, Heart, MessageSquare, 
  Calendar, Users, ArrowUpDown, Tag, AlertCircle, BookOpen,
  Film, Bookmark, BarChart3, DollarSign
} from 'lucide-react';

interface BlogInfluencer {
  blog_id: string;
  name: string;
  handle: string;
  profile_url?: string;
  profile_img_url: string;
  fan_count: number;
  follower_count: number;
  daily_visitors: number;
  avg_likes: number;
  avg_comments: number;
  contact_url: string | null;
  tags: string[];
}

interface BlogPost {
  post_id: string;
  blog_id: string;
  title: string;
  summary: string;
  post_url: string;
  thumbnail_url: string;
  like_count: number;
  comment_count: number;
  published_at: string;
}

// 요청하신 21개 네이버 블로그/인플루언서 공식 카테고리
const BLOG_CATEGORIES = [
  '전체', '여행', '패션', '뷰티', '푸드', 'IT테크', '자동차', '리빙',
  '육아', '생활건강', '게임', '동물·펫', '운동·레저', '프로스포츠',
  '방송·연예', '대중음악', '영화', '공연·전시', '도서', '경제·비즈니스', '어학·교육'
];

type BlogSortOption = 'fan_desc' | 'follower_desc' | 'visitors_desc' | 'likes_desc' | 'comments_desc';

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

export default function BlogFinderPage() {
  const [bloggers, setBloggers] = useState<BlogInfluencer[]>([]);
  const [selectedBlogger, setSelectedBlogger] = useState<BlogInfluencer | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [sortBy, setSortBy] = useState<BlogSortOption>('fan_desc');
  const [isProUser, setIsProUser] = useState(true); // 개발용 기본 true
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. 블로거 데이터 조회 (Supabase blog_influencers 테이블)
  const fetchBloggers = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (!supabase) throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
      const { data, error } = await supabase
        .from('blog_influencers')
        .select('*')
        .order('fan_count', { ascending: false })
        .limit(2000);

      if (error) {
        setErrorMessage(error.message);
      } else if (data) {
        setBloggers(data as BlogInfluencer[]);
        if (data.length > 0 && !selectedBlogger) {
          handleSelectBlogger(data[0] as BlogInfluencer);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 2. 선택된 블로거의 최근 포스트 조회 (Supabase blog_posts 테이블)
  const fetchBloggerPosts = async (blogger: BlogInfluencer) => {
    if (!blogger) return;
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('blog_id', blogger.blog_id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Supabase fetch error:', error);
        setPosts([]);
      } else if (data) {
        setPosts(data as BlogPost[]);
      }
    } catch (e) {
      console.error(e);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleSelectBlogger = (blogger: BlogInfluencer) => {
    setSelectedBlogger(blogger);
    if (blogger) {
      fetchBloggerPosts(blogger);
    }
  };

  useEffect(() => {
    fetchBloggers();
  }, []);

  // 3. 필터링 및 다중 정렬 연산
  const filteredBloggers = useMemo(() => {
    const list = bloggers
      .filter((item) => {
        const q = search.trim().toLowerCase();
        const matchesSearch = !q || 
          (item.name && item.name.toLowerCase().includes(q)) || 
          (item.handle && item.handle.toLowerCase().includes(q));

        const matchesCategory = selectedCategory === '전체' || 
          (item.tags && item.tags.some(t => t.includes(selectedCategory))) ||
          (item.name && item.name.includes(selectedCategory));

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (!isProUser) return 0;
        if (sortBy === 'fan_desc') return (b.fan_count || 0) - (a.fan_count || 0);
        if (sortBy === 'follower_desc') return (b.follower_count || 0) - (a.follower_count || 0);
        if (sortBy === 'visitors_desc') return (b.daily_visitors || 0) - (a.daily_visitors || 0);
        if (sortBy === 'likes_desc') return (b.avg_likes || 0) - (a.avg_likes || 0);
        if (sortBy === 'comments_desc') return (b.avg_comments || 0) - (a.avg_comments || 0);
        return 0;
      });

    if (!isProUser) {
      return shuffleArray(list).slice(0, 20);
    }
    return list.slice(0, 1000);
  }, [bloggers, search, selectedCategory, sortBy, isProUser]);

  const handleProFilterClick = () => {
    if (!isProUser) {
      alert('🔒 상세 정렬 필터는 PRO 멤버십 전용 기능입니다.');
    }
  };

  return (
    <div className="flex h-screen bg-[#f8f9fa] text-slate-800 antialiased overflow-hidden font-sans">
      {/* 1. 사이드바 (공통 메뉴 네비게이션) */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-2">
            <a href="/" className="text-2xl font-black tracking-tight text-red-500">vling</a>
            <span className="text-xs bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded">BLOG</span>
          </div>

          <div className="p-4 space-y-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 px-3 mb-2 tracking-wider">인플루언서 탐색</p>
              <nav className="space-y-1">
                {/* 유튜브 찾기 (클릭 시 메인 루트로 이동) */}
                <a 
                  href="/"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  <Search size={18} /> 유튜버 찾기
                </a>

                {/* 블로그인플루언서 찾기 (현재 활성 탭) */}
                <a 
                  href="/blog"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold bg-green-50 text-green-700 transition cursor-pointer"
                >
                  <BookOpen size={18} /> 블로그인플루언서 찾기
                </a>

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
                <button 
                  type="button"
                  onClick={() => alert('채널 비교분석 도구 준비 중입니다.')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  <BarChart3 size={18} /> 채널 비교분석
                </button>
                <button 
                  type="button"
                  onClick={() => alert('수익 계산기 준비 중입니다.')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  <DollarSign size={18} /> 수익 계산기
                </button>
              </nav>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100">
          <button 
            type="button"
            onClick={() => setIsProUser(!isProUser)}
            className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
              isProUser 
                ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-green-200' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isProUser ? '👑 PRO 플랜 활성화됨' : '🔒 무료(베이직) 모드 ON'}
          </button>
        </div>
      </aside>

      {/* 2. 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 상단 검색바 */}
        <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between flex-shrink-0">
          <div className="relative w-96 flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <input 
              type="text" 
              placeholder="블로거 이름 또는 아이디 검색..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-full text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
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
              className="text-xs font-semibold bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              <Lock size={12} /> PRO 업그레이드
            </button>
          </div>
        </header>

        {/* 21개 카테고리 태그 및 다중 정렬 필터 */}
        <div className="bg-white border-b border-slate-200 px-8 py-3 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[70%] no-scrollbar">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1 flex-shrink-0">
              <Tag size={13} /> 분류:
            </span>
            {BLOG_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                  selectedCategory === cat 
                    ? 'bg-green-600 text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 블로그 전용 다중 정렬 필터 (PRO 잠금 오버레이 포함) */}
          <div className="flex items-center gap-3 text-xs">
            <div className="relative">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition ${
                  isProUser 
                    ? 'bg-slate-50 border-slate-200' 
                    : 'bg-slate-100/80 border-dashed border-amber-300'
                }`}
              >
                {isProUser ? <ArrowUpDown size={14} className="text-slate-400" /> : <Lock size={14} className="text-amber-500" />}
                <select
                  disabled={!isProUser}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as BlogSortOption)}
                  className={`bg-transparent font-medium outline-none ${
                    isProUser ? 'text-slate-700 cursor-pointer' : 'text-slate-400 pointer-events-none'
                  }`}
                >
                  <option value="fan_desc">인플루언서 팬 많은 순 {!isProUser && '(PRO)'}</option>
                  <option value="visitors_desc">일일 방문자 많은 순</option>
                  <option value="follower_desc">이웃(팔로워) 많은 순</option>
                  <option value="likes_desc">평균 공감 많은 순</option>
                  <option value="comments_desc">평균 댓글 많은 순</option>
                </select>
              </div>

              {!isProUser && (
                <button
                  type="button"
                  onClick={handleProFilterClick}
                  className="absolute inset-0 w-full h-full cursor-pointer z-10 bg-transparent"
                  title="PRO 전용 필터"
                />
              )}
            </div>

            {(selectedCategory !== '전체' || sortBy !== 'fan_desc' || search !== '') && (
              <button
                type="button"
                onClick={() => { setSelectedCategory('전체'); setSortBy('fan_desc'); setSearch(''); }}
                className="text-xs text-green-600 hover:underline font-semibold ml-1 cursor-pointer"
              >
                초기화
              </button>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border-b border-red-200 px-8 py-2.5 flex items-center gap-2 text-xs text-red-600">
            <AlertCircle size={16} />
            <span>데이터베이스 연결 안내: {errorMessage}</span>
          </div>
        )}

        {/* 3. 블로그 인플루언서 목록 & 우측 상세 영역 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 좌측 블로거 리스트 */}
          <div className="w-1/3 border-r border-slate-200 overflow-y-auto bg-white flex flex-col justify-between">
            <div>
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                <span className="text-xs font-bold text-slate-500">
                  블로그 인플루언서 ({filteredBloggers.length}명 {isProUser ? '전체' : '샘플'})
                </span>
                {!isProUser && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    무료 샘플 20명
                  </span>
                )}
              </div>

              {loading ? (
                <div className="p-8 text-center text-sm text-slate-400">데이터를 불러오는 중...</div>
              ) : filteredBloggers.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">일치하는 블로거가 없습니다.</div>
              ) : (
                filteredBloggers.map((blogger) => (
                  <div 
                    key={blogger.blog_id}
                    onClick={() => handleSelectBlogger(blogger)}
                    className={`p-4 border-b border-slate-100 flex items-center gap-3 cursor-pointer transition ${
                      selectedBlogger?.blog_id === blogger.blog_id ? 'bg-green-50/70 border-l-4 border-l-green-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <img 
                      src={blogger.profile_img_url || 'https://via.placeholder.com/150'} 
                      alt={blogger.name} 
                      className="w-12 h-12 rounded-full border border-slate-200 object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{blogger.name}</h4>
                        <span className="text-[10px] px-1.5 py-0.2 bg-green-100 text-green-700 font-bold rounded">INFLUENCER</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">@{blogger.handle || blogger.blog_id}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px]">
                        <span className="font-semibold text-slate-700">팬 {(blogger.fan_count || 0).toLocaleString()}명</span>
                        <span className="text-slate-400">• 일방문 {(blogger.daily_visitors || 0).toLocaleString()}명</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 무료 모드 하단 고정 배너 */}
            {!isProUser && (
              <div className="p-4 bg-gradient-to-t from-slate-50 to-white border-t border-slate-200 text-center sticky bottom-0">
                <p className="text-xs text-slate-500 mb-2 font-medium">현재 무료 모드로 <strong>20명</strong>만 표시 중입니다.</p>
                <button
                  type="button"
                  onClick={() => setIsProUser(true)}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:brightness-105 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Lock size={13} /> PRO 결제하고 전체 블로거 확인하기 →
                </button>
              </div>
            )}
          </div>

          {/* 우측 블로거 프로필 및 최신 글 카드 */}
          <div className="flex-1 overflow-y-auto p-8 bg-[#f8f9fa]">
            {selectedBlogger ? (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* 1. 상단 프로필 카드 */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                  <div className="flex gap-4">
                    <img 
                      src={selectedBlogger.profile_img_url || 'https://via.placeholder.com/150'} 
                      alt={selectedBlogger.name} 
                      className="w-16 h-16 rounded-full border border-slate-200 object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900">{selectedBlogger.name}</h2>
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-bold">네이버 공식 인플루언서</span>
                      </div>
                      <p className="text-sm text-slate-400 mt-0.5">@{selectedBlogger.handle || selectedBlogger.blog_id}</p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {(selectedBlogger.tags || []).map((t, idx) => (
                          <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">#{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 문의하기 버튼 (인플루언서 외부 제휴 링크/블로그로 이동) */}
                  <div className="flex gap-2">
                    <a 
                      href={selectedBlogger.contact_url || selectedBlogger.profile_url || `https://blog.naver.com/${selectedBlogger.blog_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm cursor-pointer"
                    >
                      <Mail size={14} /> 문의하기
                    </a>
                  </div>
                </div>

                {/* 2. 블로그 핵심 지표 4열 카드 */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-medium text-slate-400 mb-1">인플루언서 팬 수</p>
                    <p className="text-xl font-extrabold text-slate-900">{(selectedBlogger.fan_count || 0).toLocaleString()}명</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-medium text-slate-400 mb-1">일일 평균 방문자</p>
                    <p className="text-xl font-extrabold text-green-600">{(selectedBlogger.daily_visitors || 0).toLocaleString()}명</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-medium text-slate-400 mb-1">이웃(팔로워) 수</p>
                    <p className="text-xl font-extrabold text-slate-900">{(selectedBlogger.follower_count || 0).toLocaleString()}명</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-medium text-slate-400 mb-1">평균 공감 / 댓글</p>
                    <p className="text-xl font-extrabold text-slate-900">
                      {(selectedBlogger.avg_likes || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">/ {(selectedBlogger.avg_comments || 0).toLocaleString()}</span>
                    </p>
                  </div>
                </div>

                {/* 3. 최근 발행 블로그 글 목록 */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <BookOpen size={18} className="text-green-600" />
                      <h3 className="text-sm font-bold text-slate-800">최근 발행 콘텐츠</h3>
                      <span className="text-xs text-slate-400 font-normal">({posts.length}개 포스트)</span>
                    </div>
                    <a 
                      href={selectedBlogger.profile_url || `https://blog.naver.com/${selectedBlogger.blog_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-400 hover:text-green-600 flex items-center gap-1 font-medium"
                    >
                      블로그 홈 바로가기 <ExternalLink size={12} />
                    </a>
                  </div>

                  {loadingPosts ? (
                    <p className="text-xs text-slate-400 py-8 text-center">블로그 포스트를 불러오는 중입니다...</p>
                  ) : posts.length === 0 ? (
                    <p className="text-xs text-slate-400 py-8 text-center">등록된 최신 포스트 데이터가 없습니다.</p>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <a
                          key={post.post_id}
                          href={post.post_url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex gap-4 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition bg-slate-50/50"
                        >
                          {/* 대표 썸네일 사진 */}
                          <div className="w-40 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-slate-200 relative">
                            <img 
                              src={post.thumbnail_url || 'https://via.placeholder.com/300x200?text=No+Image'} 
                              alt={post.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          </div>

                          {/* 제목, 본문 요약, 발행일, 공감/댓글수 */}
                          <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 group-hover:text-green-600 transition truncate">
                                {post.title}
                              </h4>
                              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                                {post.summary || '내용 미리보기가 제공되지 않는 포스트입니다.'}
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100/80">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} /> {post.published_at || '최근 작성'}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 text-rose-500 font-medium">
                                  <Heart size={12} /> 공감 {(post.like_count || 0).toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1 text-slate-600 font-medium">
                                  <MessageSquare size={12} /> 댓글 {(post.comment_count || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                선택된 블로그 인플루언서가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
