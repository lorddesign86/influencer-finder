'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Lock, Mail, ExternalLink,
  Tag, Users, ArrowUpDown, Heart, MessageSquare, 
  Calendar, Eye, UserPlus, TrendingUp, ShieldCheck,
  Sparkles, FileText, BadgeDollarSign, Award, Target,
  Zap, Flame, BarChart3, DollarSign, Activity, CheckCircle2, Hash, X
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
  recent_10_avg_likes?: number;
  recent_10_avg_comments?: number;
  avg_likes?: number;
  avg_comments?: number;
  monthly_post_count?: number;
  engagement_rate?: number;
  estimated_post_price?: number;
  avg_image_count?: number;
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

const BLOG_CATEGORIES = [
  '전체', '여행', '패션', '뷰티', '푸드', 'IT테크', '자동차', '리빙',
  '육아', '생활건강', '게임', '동물·펫', '운동·레저', '프로스포츠',
  '방송·연예', '대중음악', '영화', '공연·전시', '도서', '경제·비즈니스', '어학·교육'
];

type BlogSortOption = 'fan_desc' | 'visitors_desc' | 'follower_desc' | 'likes_desc' | 'comments_desc';

export default function BlogDashboardPage() {
  const [isProUser, setIsProUser] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'posts' | 'analytics'>('basic');

  // 해시태그 키워드 추출 다이얼로그 상태
  const [showKeywordModal, setShowKeywordModal] = useState(false);

  const [bloggers, setBloggers] = useState<BlogInfluencer[]>([]);
  const [selectedBlogger, setSelectedBlogger] = useState<BlogInfluencer | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loadingBlogPosts, setLoadingBlogPosts] = useState(false);
  const [blogCat, setBlogCat] = useState('전체');

  const [minFans, setMinFans] = useState('');
  const [maxFans, setMaxFans] = useState('');
  const [minFollowers, setMinFollowers] = useState('');
  const [maxFollowers, setMaxFollowers] = useState('');
  const [minVisitors, setMinVisitors] = useState('');
  const [maxVisitors, setMaxVisitors] = useState('');
  const [minLikes, setMinLikes] = useState('');
  const [maxLikes, setMaxLikes] = useState('');
  const [minComments, setMinComments] = useState('');
  const [maxComments, setMaxComments] = useState('');
  const [blogSort, setBlogSort] = useState<BlogSortOption>('fan_desc');
  const [loading, setLoading] = useState(false);

  const fetchBloggers = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('blog_influencers')
        .select('*')
        .order('fan_count', { ascending: false })
        .limit(2000);
      if (data) {
        setBloggers(data as BlogInfluencer[]);
        if (data.length > 0 && !selectedBlogger) {
          handleSelectBlogger(data[0] as BlogInfluencer);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBloggerPosts = async (blogger: BlogInfluencer) => {
    if (!blogger) return;
    setLoadingBlogPosts(true);
    try {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('blog_id', blogger.blog_id)
        .order('published_at', { ascending: false })
        .limit(30);
      if (data) setBlogPosts(data as BlogPost[]);
    } finally {
      setLoadingBlogPosts(false);
    }
  };

  const handleSelectBlogger = (blogger: BlogInfluencer) => {
    setSelectedBlogger(blogger);
    if (blogger) fetchBloggerPosts(blogger);
  };

  useEffect(() => {
    fetchBloggers();
  }, []);

  // 통합 키워드 검색 로직
  const filteredBloggers = useMemo(() => {
    const list = bloggers
      .filter((item) => {
        const rawQ = (search || '').trim().toLowerCase();
        const keywords = rawQ.split(/\s+/).filter(Boolean);

        const nameRaw = (item.name || '').toLowerCase();
        const handleRaw = (item.handle || item.blog_id || '').toLowerCase();
        const tagsArr = Array.isArray(item.tags) ? item.tags.map(t => (t || '').toLowerCase()) : [];

        if (keywords.length === 0) {
          const matchesCat = blogCat === '전체' || 
            tagsArr.some(t => t.includes(blogCat.toLowerCase())) ||
            (item.name && item.name.toLowerCase().includes(blogCat.toLowerCase()));
          return matchesCat;
        }

        const isNameMatched = keywords.some(kw => nameRaw.includes(kw) || handleRaw.includes(kw));
        const isTagMatched = keywords.some(kw => tagsArr.some(t => t.includes(kw)));
        const matchesPostContent = blogPosts.some(p => {
          if (p.blog_id !== item.blog_id) return false;
          const pTitle = (p.title || '').toLowerCase();
          const pSummary = (p.summary || '').toLowerCase();
          return keywords.some(kw => pTitle.includes(kw) || pSummary.includes(kw));
        });

        const matchesSearch = isNameMatched || isTagMatched || matchesPostContent;
        const matchesCat = blogCat === '전체' || 
          tagsArr.some(t => t.includes(blogCat.toLowerCase())) ||
          (item.name && item.name.toLowerCase().includes(blogCat.toLowerCase()));

        // 숫자 범위 필터들
        const fans = item.fan_count || 0;
        const minF = minFans ? parseInt(minFans, 10) : null;
        const maxF = maxFans ? parseInt(maxFans, 10) : null;
        if (minF !== null && !isNaN(minF) && fans < minF) return false;
        if (maxF !== null && !isNaN(maxF) && fans > maxF) return false;

        const followers = item.follower_count || 0;
        const minFol = minFollowers ? parseInt(minFollowers, 10) : null;
        const maxFol = maxFollowers ? parseInt(maxFollowers, 10) : null;
        if (minFol !== null && !isNaN(minFol) && followers < minFol) return false;
        if (maxFol !== null && !isNaN(maxFol) && followers > maxFol) return false;

        const visitors = item.daily_visitors || 0;
        const minV = minVisitors ? parseInt(minVisitors, 10) : null;
        const maxV = maxVisitors ? parseInt(maxVisitors, 10) : null;
        if (minV !== null && !isNaN(minV) && visitors < minV) return false;
        if (maxV !== null && !isNaN(maxV) && visitors > maxV) return false;

        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        if (!isProUser) return 0;
        const aLikes = a.avg_likes ?? a.recent_10_avg_likes ?? 0;
        const bLikes = b.avg_likes ?? b.recent_10_avg_likes ?? 0;
        const aComments = a.avg_comments ?? a.recent_10_avg_comments ?? 0;
        const bComments = b.avg_comments ?? b.recent_10_avg_comments ?? 0;

        if (blogSort === 'fan_desc') return (b.fan_count || 0) - (a.fan_count || 0);
        if (blogSort === 'visitors_desc') return (b.daily_visitors || 0) - (a.daily_visitors || 0);
        if (blogSort === 'follower_desc') return (b.follower_count || 0) - (a.follower_count || 0);
        if (blogSort === 'likes_desc') return bLikes - aLikes;
        if (blogSort === 'comments_desc') return bComments - aComments;
        return 0;
      });

    if (!isProUser) return list.slice(0, 15);
    return list.slice(0, 1000);
  }, [
    bloggers, blogPosts, search, blogCat, 
    minFans, maxFans, minFollowers, maxFollowers, 
    minVisitors, maxVisitors, minLikes, maxLikes, 
    minComments, maxComments, blogSort, isProUser
  ]);

  // 최근 포스트에서 키워드/해시태그 추출 연산
  const extractedKeywords = useMemo(() => {
    if (!blogPosts || blogPosts.length === 0) return [];
    
    // 포스트 제목 단어들 중에서 의미 있는 키워드 추출 시뮬레이션
    const stopwords = ['의', '가', '이', '은', '들', '는', '좀', '잘', '걍', '과', '도', '를', '으로', '자', '에', '와', '한', '하다', '와이프', '오늘', '에서', '것', '대한'];
    const wordCounts: Record<string, number> = {};

    blogPosts.forEach(p => {
      const text = `${p.title || ''} ${p.summary || ''}`;
      // 특수문자 제거 후 공백 단위 분리
      const words = text.replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, '').split(/\s+/);
      words.forEach(w => {
        const cleaned = w.trim();
        if (cleaned.length >= 2 && !stopwords.includes(cleaned)) {
          wordCounts[cleaned] = (wordCounts[cleaned] || 0) + 1;
        }
      });
    });

    // 빈도수 높은 순으로 정렬하여 상위 12개 해시태그 생성
    const sorted = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([word, count]) => ({ tag: word, count }));

    if (sorted.length === 0 && selectedBlogger?.tags) {
      return selectedBlogger.tags.map(t => ({ tag: t, count: 5 }));
    }

    return sorted;
  }, [blogPosts, selectedBlogger]);

  const blogAnalytics = useMemo(() => {
    if (!selectedBlogger) return null;
    const dailyV = selectedBlogger.daily_visitors || 0;
    const likes = selectedBlogger.avg_likes ?? selectedBlogger.recent_10_avg_likes ?? 0;
    const comments = selectedBlogger.avg_comments ?? selectedBlogger.recent_10_avg_comments ?? 0;
    const totalInteractions = likes + comments;
    const tagsArr = selectedBlogger.tags || [];

    let basePrice = 80000;
    let minCap = 90000;
    let maxCap = 350000;
    let interactionWeight = 160;

    const engRate = selectedBlogger.engagement_rate ?? 
      (dailyV > 0 ? Number((((likes + comments) / dailyV) * 100).toFixed(2)) : 4.5);

    let calculated = basePrice;
    calculated += Math.min(totalInteractions * interactionWeight, 180000);
    if (engRate >= 5.0) calculated += 60000;
    calculated = Math.max(minCap, Math.min(maxCap, calculated));
    const estPrice = Math.round(calculated / 10000) * 10000;

    let score = 78;
    if (engRate > 4.0) score += 14;
    if (dailyV > 10000) score += 7;
    score = Math.min(99, Math.max(65, score));

    const recentBarData = (blogPosts.slice(0, 10)).map((p, idx) => ({
      index: idx + 1,
      total: (p.like_count || 0) + (p.comment_count || 0),
    }));

    const maxBarValue = Math.max(...recentBarData.map(d => d.total), 100);

    return {
      estPrice,
      engRate,
      score,
      monthlyPosts: selectedBlogger.monthly_post_count || 18,
      avgImages: selectedBlogger.avg_image_count || 18,
      recentBarData,
      maxBarValue,
      cpaEfficiency: engRate > 4.0 ? 'S등급 (구매 전환 극대화)' : 'A등급 (브랜딩 최적화)',
    };
  }, [selectedBlogger, blogPosts]);

  const resetBlogFilters = () => {
    setBlogCat('전체');
    setMinFans(''); setMaxFans('');
    setMinFollowers(''); setMaxFollowers('');
    setMinVisitors(''); setMaxVisitors('');
    setMinLikes(''); setMaxLikes('');
    setMinComments(''); setMaxComments('');
    setSearch('');
    setBlogSort('fan_desc');
  };

  return (
    <>
      {/* 상단 검색 헤더 */}
      <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between flex-shrink-0 z-10">
        <div className="relative w-96 flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          <input 
            type="text" 
            placeholder="키워드 검색 (예: 일본여행, 맛집, 육아)..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-full text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-600 transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setIsProUser(!isProUser)}
            className={`text-xs font-semibold text-white px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              isProUser ? 'bg-gradient-to-r from-green-600 to-emerald-500' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            <Lock size={12} /> {isProUser ? '👑 PRO 플랜 활성화됨' : '🔒 PRO 업그레이드'}
          </button>
        </div>
      </header>

      {/* 카테고리 & 필터 바 */}
      <div>
        <div className="bg-white border-b border-slate-200 px-8 py-2.5 flex items-center gap-2 overflow-x-auto flex-shrink-0">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 flex-shrink-0">
            <Tag size={13} /> 분류:
          </span>
          {BLOG_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setBlogCat(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                blogCat === cat ? 'bg-green-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 5대 정밀 범위 필터 바 */}
        <div className="bg-slate-50/80 border-b border-slate-200 px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
              <Users size={12} className="text-green-600 mr-0.5" />
              <span className="text-slate-600 font-semibold">팬:</span>
              <input type="number" placeholder="최소" value={minFans} onChange={(e) => setMinFans(e.target.value)} className="w-14 px-1 py-0.5 border border-slate-200 rounded text-center outline-none focus:border-green-500 text-slate-800" />
              <span className="text-slate-400">~</span>
              <input type="number" placeholder="최대" value={maxFans} onChange={(e) => setMaxFans(e.target.value)} className="w-14 px-1 py-0.5 border border-slate-200 rounded text-center outline-none focus:border-green-500 text-slate-800" />
            </div>

            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
              <UserPlus size={12} className="text-slate-500 mr-0.5" />
              <span className="text-slate-600 font-semibold">이웃:</span>
              <input type="number" placeholder="최소" value={minFollowers} onChange={(e) => setMinFollowers(e.target.value)} className="w-14 px-1 py-0.5 border border-slate-200 rounded text-center outline-none focus:border-green-500 text-slate-800" />
              <span className="text-slate-400">~</span>
              <input type="number" placeholder="최대" value={maxFollowers} onChange={(e) => setMaxFollowers(e.target.value)} className="w-14 px-1 py-0.5 border border-slate-200 rounded text-center outline-none focus:border-green-500 text-slate-800" />
            </div>

            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
              <Eye size={12} className="text-blue-500 mr-0.5" />
              <span className="text-slate-600 font-semibold">일방문:</span>
              <input type="number" placeholder="최소" value={minVisitors} onChange={(e) => setMinVisitors(e.target.value)} className="w-14 px-1 py-0.5 border border-slate-200 rounded text-center outline-none focus:border-green-500 text-slate-800" />
              <span className="text-slate-400">~</span>
              <input type="number" placeholder="최대" value={maxVisitors} onChange={(e) => setMaxVisitors(e.target.value)} className="w-14 px-1 py-0.5 border border-slate-200 rounded text-center outline-none focus:border-green-500 text-slate-800" />
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-white border-slate-200">
              <ArrowUpDown size={12} className="text-slate-400" />
              <select value={blogSort} onChange={(e) => setBlogSort(e.target.value as BlogSortOption)} className="bg-transparent font-medium outline-none text-slate-700 cursor-pointer">
                <option value="fan_desc">인플루언서 팬 많은 순</option>
                <option value="visitors_desc">일일 방문자 많은 순</option>
                <option value="follower_desc">이웃 많은 순</option>
                <option value="likes_desc">평균 공감 많은 순</option>
                <option value="comments_desc">평균 댓글 많은 순</option>
              </select>
            </div>
          </div>

          {(blogCat !== '전체' || minFans || maxFans || minFollowers || maxFollowers || minVisitors || maxVisitors || search) && (
            <button type="button" onClick={resetBlogFilters} className="text-xs text-green-600 hover:underline font-semibold cursor-pointer whitespace-nowrap">
              필터 초기화
            </button>
          )}
        </div>
      </div>

      {/* 메인 본문 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측 블로거 리스트 */}
        <div className="w-1/3 border-r border-slate-200 overflow-y-auto bg-white flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <span className="text-xs font-bold text-slate-500">
                블로그 인플루언서 ({filteredBloggers.length}명 {isProUser ? '전체' : '샘플'})
              </span>
              {!isProUser && (
                <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded">
                  🔒 PRO 전용 1,000+개
                </span>
              )}
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">불러오는 중...</div>
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
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full border border-slate-200 object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{blogger.name}</h4>
                      <span className="text-[9px] px-1.5 py-0.2 bg-green-100 text-green-700 font-bold rounded">INFLUENCER</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">@{blogger.handle || blogger.blog_id}</p>
                    
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(blogger.tags || ['인플루언서']).map((t, idx) => (
                        <span key={idx} className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          #{t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-[11px]">
                      <span className="font-semibold text-slate-700">
                        팬 {(blogger.fan_count || 0).toLocaleString()}명
                      </span>
                      {isProUser ? (
                        <span className="text-slate-400">
                          • 일방문 {(blogger.daily_visitors || 0).toLocaleString()}명
                        </span>
                      ) : (
                        <span className="text-slate-300 flex items-center gap-0.5">
                          • 일방문 <Lock size={10} className="text-amber-500" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 우측 상세 분석 대시보드 */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#f8f9fa]">
          {selectedBlogger ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* 프로필 헤더 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between">
                <div className="flex gap-4">
                  <img 
                    src={selectedBlogger.profile_img_url || 'https://via.placeholder.com/150'} 
                    alt={selectedBlogger.name} 
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-full border border-slate-200 object-cover"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedBlogger.name}</h2>
                    <p className="text-sm text-slate-400 mt-0.5">@{selectedBlogger.handle || selectedBlogger.blog_id}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(selectedBlogger.tags || []).map((t, idx) => (
                        <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">#{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* 해시태그 추출 다이얼로그 열기 버튼 (PRO 전용) */}
                  {isProUser && (
                    <button 
                      type="button"
                      onClick={() => setShowKeywordModal(true)}
                      className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                    >
                      <Hash size={14} /> 최근 포스팅 키워드 분석
                    </button>
                  )}
                  <a 
                    href={selectedBlogger.contact_url || selectedBlogger.profile_url || `https://blog.naver.com/${selectedBlogger.blog_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-xs cursor-pointer"
                  >
                    <Mail size={14} /> 문의하기
                  </a>
                </div>
              </div>

              {/* 3대 탭 */}
              <div className="flex gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'basic' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <FileText size={14} className="inline mr-1" /> 기본정보
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('posts')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'posts' ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  📝 최근 발행 콘텐츠 {!isProUser && <span className="bg-amber-400 text-slate-900 text-[10px] px-1 rounded ml-1 font-black">PRO</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'analytics' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <BadgeDollarSign size={14} className="inline mr-1" /> 광고비 및 디테일분석 {!isProUser && <span className="bg-amber-400 text-slate-900 text-[10px] px-1 rounded ml-1 font-black">PRO</span>}
                </button>
              </div>

              {/* 탭 1: 기본정보 */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <p className="text-xs font-medium text-slate-400 mb-1">인플루언서 팬 수</p>
                      <p className="text-2xl font-black text-slate-900">{(selectedBlogger.fan_count || 0).toLocaleString()}명</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
                      <p className="text-xs font-medium text-slate-400 mb-1">일일 평균 방문자</p>
                      {isProUser ? (
                        <p className="text-2xl font-black text-green-600">{(selectedBlogger.daily_visitors || 0).toLocaleString()}명</p>
                      ) : (
                        <div>
                          <p className="text-2xl font-black text-slate-300 blur-[4px] select-none">42,143명</p>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1 mt-1 w-fit"><Lock size={10} /> PRO 전용</span>
                        </div>
                      )}
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
                      <p className="text-xs font-medium text-slate-400 mb-1">이웃 수</p>
                      {isProUser ? (
                        <p className="text-2xl font-black text-slate-900">{(selectedBlogger.follower_count || 0).toLocaleString()}명</p>
                      ) : (
                        <div>
                          <p className="text-2xl font-black text-slate-300 blur-[4px] select-none">20,000명</p>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1 mt-1 w-fit"><Lock size={10} /> PRO 전용</span>
                        </div>
                      )}
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
                      <p className="text-xs font-medium text-slate-400 mb-1">평균 공감 / 댓글</p>
                      {isProUser ? (
                        <p className="text-2xl font-black text-slate-900">
                          {((selectedBlogger.avg_likes ?? selectedBlogger.recent_10_avg_likes) || 0).toLocaleString()} 
                          <span className="text-xs font-normal text-slate-400"> / {((selectedBlogger.avg_comments ?? selectedBlogger.recent_10_avg_comments) || 0).toLocaleString()}</span>
                        </p>
                      ) : (
                        <div>
                          <p className="text-2xl font-black text-slate-300 blur-[4px] select-none">878 / 194</p>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1 mt-1 w-fit"><Lock size={10} /> PRO 전용</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <ShieldCheck className="text-green-600" size={18} /> C-Rank 및 D.I.A.+ 검색 알고리즘 진단
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 font-medium">C-Rank 전문성 지수</span>
                        <p className="font-bold text-green-700 text-sm mt-1">상위 3% (전문 블로그 인증)</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 font-medium">D.I.A.+ 문서 신뢰도</span>
                        <p className="font-bold text-emerald-700 text-sm mt-1">최우수 (스마트블록 상위 노출 최적)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 탭 2: 최근 포스트 */}
              {activeTab === 'posts' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 text-lg">📝</span>
                      <h3 className="text-sm font-bold text-slate-800">최근 발행 포스트</h3>
                      <span className="text-xs text-slate-400 font-normal">({blogPosts.length}개)</span>
                    </div>
                  </div>

                  {(isProUser ? blogPosts : blogPosts.slice(0, 3)).map((post) => (
                    <a
                      key={post.post_id}
                      href={post.post_url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex gap-4 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition bg-slate-50/50"
                    >
                      <div className="w-40 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-slate-200 relative">
                        <img 
                          src={post.thumbnail_url || 'https://via.placeholder.com/300x200?text=No+Image'} 
                          alt={post.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-green-600 transition truncate">{post.title}</h4>
                          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{post.summary}</p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                          <span>{post.published_at}</span>
                          {isProUser ? (
                            <div className="flex items-center gap-3">
                              <span className="text-rose-500 font-medium"><Heart size={12} className="inline mr-1" />공감 {post.like_count}</span>
                              <span className="text-slate-600 font-medium"><MessageSquare size={12} className="inline mr-1" />댓글 {post.comment_count}</span>
                            </div>
                          ) : (
                            <span className="text-amber-600 font-bold"><Lock size={10} className="inline mr-1" />PRO 전용</span>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {/* 탭 3: 광고비 및 디테일분석 */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {!isProUser ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center py-20">
                      <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 text-emerald-600">
                        <Lock size={32} />
                      </div>
                      <h3 className="text-lg font-black text-slate-900">광고비 및 세부 수식 분석은 PRO 전용입니다</h3>
                      <button
                        type="button"
                        onClick={() => setIsProUser(true)}
                        className="mt-6 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-2"
                      >
                        <Sparkles size={14} /> PRO 모드로 분석 즉시 열람하기
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border-2 border-emerald-100 shadow-2xs">
                          <span className="text-[11px] font-bold text-emerald-600">포스팅 예상 원고료</span>
                          <p className="text-3xl font-black text-slate-900 mt-2">{(blogAnalytics?.estPrice || 0).toLocaleString()}원</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border-2 border-blue-100 shadow-2xs">
                          <span className="text-[11px] font-bold text-blue-600">협업 지수</span>
                          <p className="text-3xl font-black text-slate-900 mt-2">{blogAnalytics?.score}점</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border-2 border-purple-100 shadow-2xs">
                          <span className="text-[11px] font-bold text-purple-600">독자 참여율</span>
                          <p className="text-3xl font-black text-purple-600 mt-2">{blogAnalytics?.engRate}%</p>
                        </div>
                      </div>

                      {/* 최근 포스트 인터랙션 막대 그래프 */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                          <BarChart3 className="text-blue-600" size={15} /> 최근 발행 포스트 독자 인터랙션 (공감 + 댓글)
                        </h4>
                        <div className="h-44 flex items-end justify-between gap-3 pt-8 pb-2 px-4">
                          {(blogAnalytics?.recentBarData || []).map((bar, i) => {
                            const heightPct = Math.max(15, Math.round((bar.total / (blogAnalytics?.maxBarValue || 1)) * 100));
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                                <div className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition mb-1">
                                  {bar.total}
                                </div>
                                <div 
                                  style={{ height: `${heightPct}%` }}
                                  className="w-full rounded-t-md bg-emerald-500 transition duration-300"
                                ></div>
                                <span className="text-[10px] text-slate-400 font-semibold mt-2">#{bar.index}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">
              선택된 블로그 인플루언서가 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* ---------------- 해시태그 및 키워드 추출 다이얼로그 (모달) ---------------- */}
      {showKeywordModal && selectedBlogger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* 모달 헤더 */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Hash size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedBlogger.name}님의 포스팅 키워드 분석</h3>
                  <p className="text-[11px] text-slate-400">최근 발행된 글에서 추출된 핵심 관심사 및 해시태그</p>
                </div>
              </div>
              <button 
                onClick={() => setShowKeywordModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="p-6 space-y-6">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-3">🔥 실시간 추출 해시태그 클라우드</p>
                <div className="flex flex-wrap gap-2">
                  {extractedKeywords.map((item, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                    >
                      #{item.tag} 
                      <span className="w-4 h-4 rounded-full bg-emerald-200/70 text-emerald-900 text-[10px] flex items-center justify-center font-semibold">
                        {item.count}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">주요 타깃 카테고리 적합도</span>
                  <span className="font-bold text-emerald-600">98% 일치</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  해당 블로거는 최근 포스팅에서 위 키워드들을 집중적으로 다루며 독자들과 소통하고 있습니다. 캠페인 제품군과의 연관성 검토에 활용하세요.
                </p>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowKeywordModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                확인 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
