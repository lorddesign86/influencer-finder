'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Lock, Mail, ExternalLink,
  Tag, Users, ArrowUpDown, Heart, MessageSquare, 
  Calendar, Eye, UserPlus, TrendingUp, ShieldCheck,
  Sparkles, FileText, BadgeDollarSign, Award, Target,
  Zap, Flame, BarChart3, DollarSign
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

  const filteredBloggers = useMemo(() => {
    const list = bloggers
      .filter((item) => {
        const rawQ = (search || '').trim().toLowerCase();
        const q = rawQ.replace(/\s+/g, '');

        const nameRaw = (item.name || '').toLowerCase();
        const handleRaw = (item.handle || item.blog_id || '').toLowerCase();
        const isNameMatched = nameRaw.includes(rawQ) || 
                              nameRaw.replace(/\s+/g, '').includes(q) ||
                              handleRaw.includes(rawQ) || 
                              handleRaw.replace(/\s+/g, '').includes(q);

        const isTagMatched = Array.isArray(item.tags) && item.tags.some(t => {
          const tagStr = (t || '').toLowerCase();
          return tagStr.includes(rawQ) || tagStr.replace(/\s+/g, '').includes(q);
        });

        const isUrlMatched = (item.profile_url || '').toLowerCase().includes(rawQ);
        const matchesSearch = !rawQ || isNameMatched || isTagMatched || isUrlMatched;

        const matchesCat = blogCat === '전체' || 
          (Array.isArray(item.tags) && item.tags.some(t => t.includes(blogCat))) ||
          (item.name && item.name.includes(blogCat));

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

        const likes = item.avg_likes ?? item.recent_10_avg_likes ?? 0;
        const minL = minLikes ? parseInt(minLikes, 10) : null;
        const maxL = maxLikes ? parseInt(maxLikes, 10) : null;
        if (minL !== null && !isNaN(minL) && likes < minL) return false;
        if (maxL !== null && !isNaN(maxL) && likes > maxL) return false;

        const comments = item.avg_comments ?? item.recent_10_avg_comments ?? 0;
        const minC = minComments ? parseInt(minComments, 10) : null;
        const maxC = maxComments ? parseInt(maxComments, 10) : null;
        if (minC !== null && !isNaN(minC) && comments < minC) return false;
        if (maxC !== null && !isNaN(maxC) && comments > maxC) return false;

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
    bloggers, search, blogCat, 
    minFans, maxFans, minFollowers, maxFollowers, 
    minVisitors, maxVisitors, minLikes, maxLikes, 
    minComments, maxComments, blogSort, isProUser
  ]);

  const blogAnalytics = useMemo(() => {
    if (!selectedBlogger) return null;
    const dailyV = selectedBlogger.daily_visitors || 0;
    const fans = selectedBlogger.fan_count || 0;
    const likes = selectedBlogger.avg_likes ?? selectedBlogger.recent_10_avg_likes ?? 0;
    const comments = selectedBlogger.avg_comments ?? selectedBlogger.recent_10_avg_comments ?? 0;
    const totalInteractions = likes + comments;
    const tagsArr = selectedBlogger.tags || [];

    const isTier1 = tagsArr.some(t => 
      ['여행', 'IT테크', '자동차', '경제', '비즈니스', '어학', '교육', '테크'].some(k => t.includes(k))
    );
    const isTier2 = tagsArr.some(t => 
      ['뷰티', '패션', '육아', '게임', '생활건강', '리빙'].some(k => t.includes(k))
    );
    const isFood = tagsArr.some(t => 
      ['푸드', '맛집', '식음료', '카페'].some(k => t.includes(k))
    );

    let basePrice = 70000;
    let minCap = 80000;
    let maxCap = 250000;
    let interactionWeight = 150;

    if (isTier1) {
      basePrice = 110000;
      minCap = 100000;
      maxCap = 400000;
      interactionWeight = 180;
    } else if (isTier2) {
      basePrice = 90000;
      minCap = 100000;
      maxCap = 300000;
      interactionWeight = 160;
    } else if (isFood) {
      basePrice = 60000;
      minCap = 80000;
      maxCap = 200000;
      interactionWeight = 120;
    }

    const engRate = selectedBlogger.engagement_rate ?? 
      (dailyV > 0 ? Number((((likes + comments) / dailyV) * 100).toFixed(2)) : 4.5);

    let calculated = basePrice;
    calculated += Math.min(totalInteractions * interactionWeight, 180000);

    if (engRate >= 6.0) calculated += 50000;
    else if (engRate >= 3.5) calculated += 30000;
    else if (engRate >= 2.0) calculated += 15000;

    calculated += Math.min(dailyV * 4, 60000);
    calculated = Math.max(minCap, Math.min(maxCap, calculated));
    const estPrice = Math.round(calculated / 10000) * 10000;

    let score = 75;
    if (engRate > 5.0) score += 15;
    else if (engRate > 3.0) score += 8;
    if (dailyV > 10000) score += 8;
    score = Math.min(99, Math.max(60, score));

    const recentBarData = (blogPosts.slice(0, 10)).map((p, idx) => ({
      index: idx + 1,
      likes: p.like_count || 0,
      comments: p.comment_count || 0,
      total: (p.like_count || 0) + (p.comment_count || 0),
    }));

    const maxBarValue = Math.max(...recentBarData.map(d => d.total), 100);

    return {
      estPrice,
      engRate,
      score,
      monthlyPosts: selectedBlogger.monthly_post_count || Math.max(12, blogPosts.length * 2),
      avgImages: selectedBlogger.avg_image_count || 16,
      recentBarData,
      maxBarValue,
      cpaEfficiency: engRate > 4.5 ? 'S등급 (전환율 극대화)' : engRate > 2.5 ? 'A등급 (브랜딩 우수)' : 'B등급 (단순 노출용)',
    };
  }, [selectedBlogger, blogPosts]);

  return (
    <>
      {/* 블로그 상단 헤더 */}
      <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between flex-shrink-0 z-10">
        <div className="relative w-96 flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          <input 
            type="text" 
            placeholder="블로거 이름 또는 네이버 아이디 검색..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-full text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-600 transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setIsProUser(!isProUser)}
            className="text-xs font-semibold text-white px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition cursor-pointer flex items-center gap-1.5"
          >
            <Lock size={12} /> {isProUser ? 'PRO 모드 ON' : 'PRO 업그레이드'}
          </button>
        </div>
      </header>

      {/* 블로그 카테고리 & 상세 필터 */}
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

        <div className="bg-slate-50/80 border-b border-slate-200 px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
              <Users size={12} className="text-green-600 mr-0.5" />
              <span className="text-slate-600 font-semibold">팬:</span>
              <input
                type="number"
                placeholder="최소"
                value={minFans}
                onChange={(e) => setMinFans(e.target.value)}
                className="w-14 px-1 py-0.5 border border-slate-200 rounded text-center outline-none focus:border-green-500 text-slate-800"
              />
              <span className="text-slate-400">~</span>
              <input
                type="number"
                placeholder="최대"
                value={maxFans}
                onChange={(e) => setMaxFans(e.target.value)}
                className="w-14 px-1 py-0.5 border border-slate-200 rounded text-center outline-none focus:border-green-500 text-slate-800"
              />
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-white border-slate-200">
              <ArrowUpDown size={12} className="text-slate-400" />
              <select
                value={blogSort}
                onChange={(e) => setBlogSort(e.target.value as BlogSortOption)}
                className="bg-transparent font-medium outline-none text-slate-700 cursor-pointer"
              >
                <option value="fan_desc">인플루언서 팬 많은 순</option>
                <option value="visitors_desc">일일 방문자 많은 순</option>
                <option value="follower_desc">이웃 많은 순</option>
                <option value="likes_desc">평균 공감 많은 순</option>
                <option value="comments_desc">평균 댓글 많은 순</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 블로그 상세 대시보드 뷰 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측 블로그 카드 리스트 */}
        <div className="w-1/3 border-r border-slate-200 overflow-y-auto bg-white flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <span className="text-xs font-bold text-slate-500">
                블로그 인플루언서 ({filteredBloggers.length}명)
              </span>
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
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 우측 블로그 상세 분석 */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#f8f9fa]">
          {selectedBlogger && (
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
                <a 
                  href={selectedBlogger.contact_url || selectedBlogger.profile_url || `https://blog.naver.com/${selectedBlogger.blog_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-xs cursor-pointer"
                >
                  <Mail size={14} /> 문의하기
                </a>
              </div>

              {/* 3대 탭 */}
              <div className="flex gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'basic' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <FileText size={14} className="inline mr-1" /> 기본정보
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('posts')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'posts' ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  📝 최근 발행 콘텐츠 {!isProUser && <span className="bg-amber-400 text-slate-900 text-[10px] px-1 rounded ml-1">PRO</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'analytics' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <BadgeDollarSign size={14} className="inline mr-1" /> 광고비 및 디테일분석 {!isProUser && <span className="bg-amber-400 text-slate-900 text-[10px] px-1 rounded ml-1">PRO</span>}
                </button>
              </div>

              {/* 탭 1: 기본정보 */}
              {activeTab === 'basic' && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                    <p className="text-xs font-medium text-slate-400 mb-1">인플루언서 팬 수</p>
                    <p className="text-2xl font-black text-slate-900">{(selectedBlogger.fan_count || 0).toLocaleString()}명</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                    <p className="text-xs font-medium text-slate-400 mb-1">일일 평균 방문자</p>
                    <p className="text-2xl font-black text-green-600">{(selectedBlogger.daily_visitors || 0).toLocaleString()}명</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                    <p className="text-xs font-medium text-slate-400 mb-1">이웃 수</p>
                    <p className="text-2xl font-black text-slate-900">{(selectedBlogger.follower_count || 0).toLocaleString()}명</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                    <p className="text-xs font-medium text-slate-400 mb-1">평균 공감 / 댓글</p>
                    <p className="text-2xl font-black text-slate-900">
                      {((selectedBlogger.avg_likes ?? selectedBlogger.recent_10_avg_likes) || 0).toLocaleString()} / {((selectedBlogger.avg_comments ?? selectedBlogger.recent_10_avg_comments) || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* 탭 2: 최근 포스트 (공감/댓글 PRO 마스킹) */}
              {activeTab === 'posts' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
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
                              <span className="text-rose-500"><Heart size={12} className="inline mr-1" />{post.like_count}</span>
                              <span className="text-slate-600"><MessageSquare size={12} className="inline mr-1" />{post.comment_count}</span>
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
