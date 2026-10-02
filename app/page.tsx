'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Lock, Mail, ExternalLink, Video, Smartphone, 
  BarChart3, DollarSign, Film, Bookmark, AlertCircle,
  Tag, Users, ArrowUpDown, Heart, MessageSquare, 
  Calendar, Eye, UserPlus, TrendingUp, ShieldCheck, CheckCircle2,
  Sparkles, FileText, BadgeDollarSign, Award, Target,
  Zap, Flame
} from 'lucide-react';

interface Influencer {
  channel_id: string;
  name: string;
  handle: string;
  profile_url?: string;
  profile_img_url: string;
  follower_count: number;
  total_video_count: number;
  avg_views: number;
  avg_video_views: number;
  avg_shorts_views: number;
  avg_likes: number;
  avg_comments: number;
  engagement_rate: number;
  estimated_video_cpv_price: number;
  estimated_shorts_cpv_price: number;
  sponsored_video_ratio: number;
  audience_languages: Record<string, number>;
  primary_language: string;
  contact_email: string | null;
  tags: string[];
}

interface Post {
  video_id?: string;
  channel_id: string;
  title: string;
  post_url: string;
  thumbnail_url: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
}

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

const YOUTUBE_TAGS = ['전체', '맛집', '먹방', '여행', 'Vlog', 'IT', '뷰티', '패션', '게임'];
const BLOG_CATEGORIES = [
  '전체', '여행', '패션', '뷰티', '푸드', 'IT테크', '자동차', '리빙',
  '육아', '생활건강', '게임', '동물·펫', '운동·레저', '프로스포츠',
  '방송·연예', '대중음악', '영화', '공연·전시', '도서', '경제·비즈니스', '어학·교육'
];

type SubscriberRange = 'all' | 'under10k' | '10k_100k' | '100k_500k' | 'over500k';
type YoutubeSortOption = 'follower_desc' | 'views_desc' | 'engagement_desc';
type BlogSortOption = 'fan_desc' | 'visitors_desc' | 'follower_desc' | 'likes_desc' | 'comments_desc';

const shuffleArray = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

export default function PlatformDashboard() {
  const [platformMode, setPlatformMode] = useState<'youtube' | 'blog'>('blog');
  const [isProUser, setIsProUser] = useState(false);
  const [search, setSearch] = useState('');

  const [activeTab, setActiveTab] = useState<'basic' | 'posts' | 'analytics'>('posts');

  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Influencer | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [ytTag, setYtTag] = useState('전체');
  const [subRange, setSubRange] = useState<SubscriberRange>('all');
  const [ytSort, setYtSort] = useState<YoutubeSortOption>('follower_desc');

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

  const fetchYoutubeChannels = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('influencers')
        .select('*')
        .order('follower_count', { ascending: false })
        .limit(2000);
      if (data) {
        setInfluencers(data as Influencer[]);
        if (data.length > 0 && !selectedChannel) {
          handleSelectChannel(data[0] as Influencer);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchYoutubePosts = async (channel: Influencer) => {
    if (!channel) return;
    setLoadingPosts(true);
    try {
      let cleanId = channel.channel_id || '';
      if (cleanId.includes('/')) {
        const parts = cleanId.split('/');
        cleanId = parts[parts.length - 1];
      }
      const { data } = await supabase
        .from('influencer_posts')
        .select('*')
        .or(`channel_id.eq.${cleanId},channel_id.eq.${channel.channel_id}`)
        .limit(30);
      if (data) setPosts(data as Post[]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleSelectChannel = (channel: Influencer) => {
    setSelectedChannel(channel);
    if (channel) fetchYoutubePosts(channel);
  };

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
        if (data.length > 0) {
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
    fetchYoutubeChannels();
    fetchBloggers();
  }, []);

  const switchToYoutube = () => {
    setPlatformMode('youtube');
    setSearch('');
    setActiveTab('basic');
    if (influencers.length > 0 && !selectedChannel) {
      handleSelectChannel(influencers[0]);
    }
  };

  const switchToBlog = () => {
    setPlatformMode('blog');
    setSearch('');
    setActiveTab('posts');
    if (bloggers.length > 0 && !selectedBlogger) {
      handleSelectBlogger(bloggers[0]);
    }
  };

  const filteredBloggers = useMemo(() => {
    const list = bloggers
      .filter((item) => {
        // 검색어 정리 (앞뒤 공백 제거 및 소문자화)
        const rawQ = (search || '').trim().toLowerCase();
        const q = rawQ.replace(/\s+/g, '');

        // 1. 이름/아이디 검색
        const nameRaw = (item.name || '').toLowerCase();
        const handleRaw = (item.handle || item.blog_id || '').toLowerCase();
        const isNameMatched = nameRaw.includes(rawQ) || 
                              nameRaw.replace(/\s+/g, '').includes(q) ||
                              handleRaw.includes(rawQ) || 
                              handleRaw.replace(/\s+/g, '').includes(q);

        // 2. 태그/전문분야 검색
        const isTagMatched = Array.isArray(item.tags) && item.tags.some(t => {
          const tagStr = (t || '').toLowerCase();
          return tagStr.includes(rawQ) || tagStr.replace(/\s+/g, '').includes(q);
        });

        // 3. 프로필 URL 검색
        const isUrlMatched = (item.profile_url || '').toLowerCase().includes(rawQ);

        const matchesSearch = !rawQ || isNameMatched || isTagMatched || isUrlMatched;

        // 카테고리 탭 분류
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

    if (!isProUser) {
      return list.slice(0, 15);
    }
    return list.slice(0, 1000);
  }, [
    bloggers, search, blogCat, 
    minFans, maxFans, minFollowers, maxFollowers, 
    minVisitors, maxVisitors, minLikes, maxLikes, 
    minComments, maxComments, blogSort, isProUser
  ]);

  // 마케팅 시각화 지표 및 카테고리별 단가 연산
  const blogAnalytics = useMemo(() => {
    if (!selectedBlogger) return null;
    const dailyV = selectedBlogger.daily_visitors || 0;
    const fans = selectedBlogger.fan_count || 0;
    const likes = selectedBlogger.avg_likes ?? selectedBlogger.recent_10_avg_likes ?? 0;
    const comments = selectedBlogger.avg_comments ?? selectedBlogger.recent_10_avg_comments ?? 0;
    const totalInteractions = likes + comments;
    const tagsArr = selectedBlogger.tags || [];

    // 1) 카테고리 매칭
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

    // 2) 참여율 (Engagement Rate)
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

    // 3) 종합 협업 지수 스코어
    let score = 75;
    if (engRate > 5.0) score += 15;
    else if (engRate > 3.0) score += 8;
    if (dailyV > 10000) score += 8;
    score = Math.min(99, Math.max(60, score));

    // 4) 포스트별 인터랙션 트렌드
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
    <div className="flex h-screen bg-[#f8f9fa] text-slate-800 antialiased overflow-hidden font-sans">
      {/* 1. 사이드바 */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between flex-shrink-0 z-20">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-2">
            <span className="text-2xl font-black tracking-tight text-red-500">findlist</span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
              platformMode === 'blog' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            }`}>
              {platformMode === 'blog' ? 'BLOG PRO' : 'PRO'}
            </span>
          </div>

          <div className="p-4 space-y-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 px-3 mb-2 tracking-wider">인플루언서 탐색</p>
              <nav className="space-y-1">
                <button 
                  type="button"
                  onClick={switchToYoutube}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                    platformMode === 'youtube' ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Search size={18} /> 유튜버 찾기
                </button>

                <button 
                  type="button"
                  onClick={switchToBlog}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                    platformMode === 'blog' ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base leading-none">📝</span> 블로그인플루언서 찾기
                </button>

                <button 
                  type="button"
                  onClick={() => alert('영상 라이브러리 준비 중입니다.')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  <Film size={18} /> 영상 라이브러리
                </button>
                <button 
                  type="button"
                  onClick={() => alert('즐겨찾기 준비 중입니다.')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
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
            className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
              isProUser 
                ? platformMode === 'blog'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isProUser ? '👑 PRO 플랜 활성화됨' : '🔒 무료(베이직) 모드 ON'}
          </button>
        </div>
      </aside>

      {/* 2. 메인 프레임 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between flex-shrink-0 z-10">
          <div className="relative w-96 flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <input 
              type="text" 
              placeholder={platformMode === 'youtube' ? "유튜버 이름 또는 핸들 검색..." : "블로거 이름 또는 네이버 아이디 검색..."} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-10 pr-10 py-2 border border-slate-200 rounded-full text-sm bg-slate-50 focus:bg-white focus:outline-none transition ${
                platformMode === 'blog' ? 'focus:ring-2 focus:ring-green-600' : 'focus:ring-2 focus:ring-red-500'
              }`}
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
              onClick={() => setIsProUser(!isProUser)}
              className={`text-xs font-semibold text-white px-4 py-2 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5 ${
                platformMode === 'blog' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              <Lock size={12} /> {isProUser ? 'PRO 이용 중' : 'PRO 업그레이드'}
            </button>
          </div>
        </header>

        {/* 블로그 필터 바 */}
        {platformMode === 'blog' && (
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

                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  <UserPlus size={12} className="text-slate-500 mr-0.5" />
                  <span className="text-slate-600 font-semibold">이웃:</span>
                  <input
                    type="number"
                    placeholder="최소"
                    value={minFollowers}
                    onChange={(e) => setMinFollowers(e.target.value)}
                    className="w-14 px-1 py-0.5 border border-slate-200 rounded text-center outline-none focus:border-green-500 text-slate-800"
                  />
                  <span className="text-slate-400">~</span>
                  <input
                    type="number"
                    placeholder="최대"
                    value={maxFollowers}
                    onChange={(e) => setMaxFollowers(e.target.value)}
                    className="w-14 px-1 py-0.5 border border-slate-200 rounded text-center outline-none focus:border-green-500 text-slate-800"
                  />
                </div>

                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  <Eye size={12} className="text-blue-500 mr-0.5" />
                  <span className="text-slate-600 font-semibold">일방문:</span>
                  <input
                    type="number"
                    placeholder="최소"
                    value={minVisitors}
                    onChange={(e) => setMinVisitors(e.target.value)}
                    className="w-14 px-1 py-0.5 border border-slate-200 rounded text-center outline-none focus:border-green-500 text-slate-800"
                  />
                  <span className="text-slate-400">~</span>
                  <input
                    type="number"
                    placeholder="최대"
                    value={maxVisitors}
                    onChange={(e) => setMaxVisitors(e.target.value)}
                    className="w-14 px-1 py-0.5 border border-slate-200 rounded text-center outline-none focus:border-green-500 text-slate-800"
                  />
                </div>

                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  <Heart size={12} className="text-rose-500 mr-0.5" />
                  <span className="text-slate-600 font-semibold">공감:</span>
                  <input
                    type="number"
                    placeholder="최소"
                    value={minLikes}
                    onChange={(e) => setMinLikes(e.target.value)}
                    className="w-14 px-1 py-0.5 border border-slate-200 rounded text-center outline-none focus:border-green-500 text-slate-800"
                  />
                  <span className="text-slate-400">~</span>
                  <input
                    type="number"
                    placeholder="최대"
                    value={maxLikes}
                    onChange={(e) => setMaxLikes(e.target.value)}
                    className="w-14 px-1 py-0.5 border border-slate-200 rounded text-center outline-none focus:border-green-500 text-slate-800"
                  />
                </div>

                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  <MessageSquare size={12} className="text-amber-500 mr-0.5" />
                  <span className="text-slate-600 font-semibold">댓글:</span>
                  <input
                    type="number"
                    placeholder="최소"
                    value={minComments}
                    onChange={(e) => setMinComments(e.target.value)}
                    className="w-14 px-1 py-0.5 border border-slate-200 rounded text-center outline-none focus:border-green-500 text-slate-800"
                  />
                  <span className="text-slate-400">~</span>
                  <input
                    type="number"
                    placeholder="최대"
                    value={maxComments}
                    onChange={(e) => setMaxComments(e.target.value)}
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

              {(blogCat !== '전체' || minFans || maxFans || minFollowers || maxFollowers || minVisitors || maxVisitors || minLikes || maxLikes || minComments || maxComments || search) && (
                <button
                  type="button"
                  onClick={resetBlogFilters}
                  className="text-xs text-green-600 hover:underline font-semibold cursor-pointer whitespace-nowrap"
                >
                  필터 초기화
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. 본문 뷰 */}
        <div className="flex-1 flex overflow-hidden">
          {platformMode === 'blog' && (
            <>
              {/* 좌측 블로그 목록 카드 */}
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
                    <div className="p-8 text-center text-sm text-slate-400">데이터를 불러오는 중...</div>
                  ) : filteredBloggers.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">일치하는 블로그 인플루언서가 없습니다.</div>
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
                            {(blogger.tags && blogger.tags.length > 0 ? blogger.tags : ['인플루언서']).map((t, idx) => (
                              <span 
                                key={idx} 
                                className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                            <span className="font-semibold text-slate-700">팬 {(blogger.fan_count || 0).toLocaleString()}명</span>
                            {isProUser ? (
                              <span className="text-slate-400">• 일방문 {(blogger.daily_visitors || 0).toLocaleString()}명</span>
                            ) : (
                              <span className="text-slate-300 flex items-center gap-0.5">• 일방문 <Lock size={10} /></span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 우측 블로거 상세 분석 대시보드 */}
              <div className="flex-1 overflow-y-auto p-8 bg-[#f8f9fa]">
                {selectedBlogger ? (
                  <div className="max-w-4xl mx-auto space-y-6">
                    {/* 상단 프로필 헤더 카드 */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between">
                      <div className="flex gap-4">
                        <img 
                          src={selectedBlogger.profile_img_url || 'https://via.placeholder.com/150'} 
                          alt={selectedBlogger.name} 
                          referrerPolicy="no-referrer"
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

                      <a 
                        href={selectedBlogger.contact_url || selectedBlogger.profile_url || `https://blog.naver.com/${selectedBlogger.blog_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-xs cursor-pointer"
                      >
                        <Mail size={14} /> 문의하기
                      </a>
                    </div>

                    {/* 3대 탭 네비게이션 */}
                    <div className="flex gap-2 border-b border-slate-200 pb-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('basic')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          activeTab === 'basic' 
                            ? 'bg-slate-900 text-white shadow-xs' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <FileText size={14} /> 기본정보
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('posts')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          activeTab === 'posts' 
                            ? 'bg-green-600 text-white shadow-xs' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        📝 최근 발행 콘텐츠 {!isProUser && <span className="bg-amber-400 text-slate-900 text-[10px] px-1.5 py-0.2 rounded font-black">PRO</span>}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('analytics')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          activeTab === 'analytics' 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <BadgeDollarSign size={14} /> 광고비 및 디테일분석 {!isProUser && <span className="bg-amber-400 text-slate-900 text-[10px] px-1.5 py-0.2 rounded font-black">PRO</span>}
                      </button>
                    </div>

                    {/* ----------------------------------------------------
                        탭 1: 기본 정보
                    ---------------------------------------------------- */}
                    {activeTab === 'basic' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-4 gap-4">
                          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                            <p className="text-xs font-medium text-slate-400 mb-1">인플루언서 팬 수</p>
                            <p className="text-2xl font-black text-slate-900">{(selectedBlogger.fan_count || 0).toLocaleString()}명</p>
                            <span className="text-[11px] text-green-600 font-medium mt-1 inline-block">✓ 공식 인증 팬</span>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
                            <p className="text-xs font-medium text-slate-400 mb-1">일일 평균 방문자</p>
                            {isProUser ? (
                              <p className="text-2xl font-black text-green-600">{(selectedBlogger.daily_visitors || 0).toLocaleString()}명</p>
                            ) : (
                              <div>
                                <p className="text-2xl font-black text-slate-300 blur-xs select-none">42,143명</p>
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1 mt-1 w-fit">
                                  <Lock size={10} /> PRO 전용
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
                            <p className="text-xs font-medium text-slate-400 mb-1">이웃(팔로워) 수</p>
                            {isProUser ? (
                              <p className="text-2xl font-black text-slate-900">{(selectedBlogger.follower_count || 0).toLocaleString()}명</p>
                            ) : (
                              <div>
                                <p className="text-2xl font-black text-slate-300 blur-xs select-none">20,000명</p>
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1 mt-1 w-fit">
                                  <Lock size={10} /> PRO 전용
                                </span>
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
                                <p className="text-2xl font-black text-slate-300 blur-xs select-none">878 / 194</p>
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1 mt-1 w-fit">
                                  <Lock size={10} /> PRO 전용
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <ShieldCheck className="text-green-600" size={18} /> 인플루언서 기본 검증 정보
                          </h3>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-slate-400 font-medium">활동 플랫폼</span>
                              <p className="font-bold text-slate-800 text-sm mt-1">네이버 블로그 (Naver Official)</p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-slate-400 font-medium">블로그 공식 URL</span>
                              <p className="font-bold text-green-700 text-sm mt-1 truncate">
                                {selectedBlogger.profile_url || `https://blog.naver.com/${selectedBlogger.blog_id}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ----------------------------------------------------
                        탭 2: 최근 발행 콘텐츠 (공감/댓글 수치 PRO 블러 마스킹 적용)
                    ---------------------------------------------------- */}
                    {activeTab === 'posts' && (
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
                        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-green-600 text-lg">📝</span>
                            <h3 className="text-sm font-bold text-slate-800">최근 발행 포스트</h3>
                            <span className="text-xs text-slate-400 font-normal">({blogPosts.length}개)</span>
                          </div>
                          <span className="text-xs text-slate-400 font-medium">실시간 발행 피드</span>
                        </div>

                        <div className="space-y-4">
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

                                  {/* ★ PRO 여부에 따른 공감/댓글 블러 마스킹 처리 ★ */}
                                  {isProUser ? (
                                    <div className="flex items-center gap-3">
                                      <span className="flex items-center gap-1 text-rose-500 font-medium">
                                        <Heart size={12} /> 공감 {(post.like_count || 0).toLocaleString()}
                                      </span>
                                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                                        <MessageSquare size={12} /> 댓글 {(post.comment_count || 0).toLocaleString()}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200">
                                      <div className="flex items-center gap-2 select-none filter blur-[3px] text-slate-400">
                                        <span className="flex items-center gap-1 text-rose-300">
                                          <Heart size={12} /> 999
                                        </span>
                                        <span className="flex items-center gap-1 text-slate-300">
                                          <MessageSquare size={12} /> 99
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5 whitespace-nowrap">
                                        <Lock size={10} /> PRO 전용
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>

                        {!isProUser && (
                          <div className="mt-6 p-6 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 flex flex-col items-center justify-center text-center">
                            <Lock className="text-amber-500 mb-2" size={24} />
                            <h4 className="text-sm font-bold text-slate-900">최근 전체 콘텐츠 열람 및 공감/댓글 반응 수치는 PRO 전용입니다</h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-md">
                              PRO 플랜을 구독하시면 포스트별 실시간 공감/댓글 반응 분석과 과거 전체 포스팅 피드를 무제한으로 열람할 수 있습니다.
                            </p>
                            <button
                              type="button"
                              onClick={() => setIsProUser(true)}
                              className="mt-3 text-xs font-bold px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg shadow-2xs hover:opacity-95 transition cursor-pointer"
                            >
                              PRO 활성화하고 전체보기
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ----------------------------------------------------
                        탭 3: 광고비 및 디테일분석 PRO
                    ---------------------------------------------------- */}
                    {activeTab === 'analytics' && (
                      <div className="space-y-6">
                        {!isProUser ? (
                          <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center py-20">
                            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 text-emerald-600">
                              <Lock size={32} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900">광고비 및 세부 수식 분석은 PRO 전용입니다</h3>
                            <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed">
                              카테고리별 현실 원고료 단가 시뮬레이션, 인터랙션 반응도 트렌드 그래프, 마케팅 협업 타당성 스코어를 확인하여 예산 집행 효율을 극대화하세요.
                            </p>
                            <button
                              type="button"
                              onClick={() => setIsProUser(true)}
                              className="mt-6 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2"
                            >
                              <Sparkles size={14} /> PRO 모드로 분석 즉시 열람하기
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* 핵심 3대 지표 카드 */}
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-white p-5 rounded-2xl border-2 border-emerald-100 shadow-2xs flex flex-col justify-between">
                                <div>
                                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 uppercase tracking-wider">
                                    <DollarSign size={13} /> 포스팅 예상 원고료
                                  </span>
                                  <p className="text-3xl font-black text-slate-900 mt-2">
                                    {(blogAnalytics?.estPrice || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">원</span>
                                  </p>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                  <span>단가 적합도</span>
                                  <span className="font-semibold text-emerald-600">시장 표준 대비 양호</span>
                                </div>
                              </div>

                              <div className="bg-white p-5 rounded-2xl border-2 border-blue-100 shadow-2xs flex flex-col justify-between">
                                <div>
                                  <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1 uppercase tracking-wider">
                                    <Award size={13} /> 인플루언서 협업 지수
                                  </span>
                                  <div className="flex items-baseline gap-1 mt-2">
                                    <p className="text-3xl font-black text-slate-900">{blogAnalytics?.score}</p>
                                    <span className="text-xs font-bold text-slate-400">/ 100점</span>
                                  </div>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                  <span className="text-slate-400">등급</span>
                                  <span className="font-bold text-blue-600">Top 5% 추천 블로거</span>
                                </div>
                              </div>

                              <div className="bg-white p-5 rounded-2xl border-2 border-purple-100 shadow-2xs flex flex-col justify-between">
                                <div>
                                  <span className="text-[11px] font-bold text-purple-600 flex items-center gap-1 uppercase tracking-wider">
                                    <Flame size={13} /> 독자 참여율 (Engagement)
                                  </span>
                                  <p className="text-3xl font-black text-purple-600 mt-2">
                                    {blogAnalytics?.engRate}%
                                  </p>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                  <span className="text-slate-400">업계 평균비</span>
                                  <span className="font-bold text-purple-600">+{(Number(blogAnalytics?.engRate || 0) - 2.8).toFixed(1)}% 상회</span>
                                </div>
                              </div>
                            </div>

                            {/* 최근 포스트 반응도 막대 그래프 */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <BarChart3 className="text-blue-600" size={15} /> 최근 발행 포스트 독자 인터랙션 (공감 + 댓글)
                                  </h4>
                                  <p className="text-[11px] text-slate-400 mt-0.5">글마다 형성되는 실제 독자 피드백 규모</p>
                                </div>
                                <span className="text-[11px] bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded">
                                  포스트당 평균 {((selectedBlogger.avg_likes ?? selectedBlogger.recent_10_avg_likes) || 0) + ((selectedBlogger.avg_comments ?? selectedBlogger.recent_10_avg_comments) || 0)}개 피드백
                                </span>
                              </div>

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
                                        className="w-full rounded-t-md bg-emerald-500 group-hover:bg-emerald-600 transition duration-300"
                                      ></div>
                                      <span className="text-[10px] text-slate-400 font-semibold mt-2">#{bar.index}</span>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                                <span>발행 포스트 순번 (좌: 최신글 ➜ 우: 과거글)</span>
                                <span>인터랙션 = 공감 수 + 댓글 수 합산</span>
                              </div>
                            </div>

                            {/* 독자 참여율 3색 레벨 게이지 바 */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <TrendingUp className="text-purple-600" size={15} /> 독자 인게이지먼트(참여율) 벤치마크 평가
                                  </h4>
                                  <p className="text-[11px] text-slate-400 mt-0.5">네이버 블로그 평균 전환율(2.0% ~ 3.5%) 대비 위치</p>
                                </div>
                                <span className="text-sm font-black text-purple-600">{blogAnalytics?.engRate}% (최상위권)</span>
                              </div>

                              <div className="relative pt-2 pb-1">
                                <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
                                  <div className="w-1/3 bg-slate-300" title="낮음 (0~2.5%)"></div>
                                  <div className="w-1/3 bg-blue-300" title="보통 (2.5~5.0%)"></div>
                                  <div className="w-1/3 bg-purple-500" title="매우 높음 (5.0% 이상)"></div>
                                </div>
                                <div 
                                  style={{ left: `${Math.min(95, Math.max(5, (Number(blogAnalytics?.engRate || 0) / 10) * 100))}%` }}
                                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
                                >
                                  <span className="text-[10px] font-black text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded shadow-2xs whitespace-nowrap">
                                    현재 위치 {blogAnalytics?.engRate}%
                                  </span>
                                  <div className="w-1.5 h-1.5 bg-purple-700 rotate-45 -mt-0.5"></div>
                                </div>
                              </div>

                              <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-2">
                                <span>기본 노출형 (0.0% ~ 2.5%)</span>
                                <span>안정적 소통형 (2.5% ~ 5.0%)</span>
                                <span>고관여 팬덤형 (5.0% ~ 10.0%+)</span>
                              </div>
                            </div>

                            {/* 마케팅 협업 타당성 정밀 진단표 */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                  <Target className="text-slate-800" size={16} /> 인플루언서 마케팅 협업 타당성 정밀 진단표
                                </h4>
                                <span className="text-[11px] text-emerald-700 bg-emerald-50 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                                  ✓ 광고 적합 판정 완료
                                </span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                  <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-100">
                                    <tr>
                                      <th className="py-3 px-4">분석 항목</th>
                                      <th className="py-3 px-4">측정 데이터</th>
                                      <th className="py-3 px-4">업계 벤치마크 평가</th>
                                      <th className="py-3 px-4">권장 캠페인 유형</th>
                                      <th className="py-3 px-4 text-right">예상 ROI 기대치</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 font-medium">
                                    <tr>
                                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                                        <Zap size={14} className="text-blue-500" /> 구매 전환 파워
                                      </td>
                                      <td className="py-3.5 px-4 font-bold text-blue-600">{blogAnalytics?.engRate}%</td>
                                      <td className="py-3.5 px-4">
                                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700">
                                          {blogAnalytics?.cpaEfficiency}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 text-slate-600">공동구매 / 프로모션 할인 코드 배포</td>
                                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600">★★★★☆</td>
                                    </tr>
                                    <tr>
                                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                                        <Calendar size={14} className="text-amber-500" /> 포스팅 지속성
                                      </td>
                                      <td className="py-3.5 px-4 font-bold text-slate-800">월 약 {blogAnalytics?.monthlyPosts}건</td>
                                      <td className="py-3.5 px-4">
                                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                                          고활동성 크리에이터
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 text-slate-600">신제품 런칭 주간 집중 바이럴</td>
                                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600">★★★★★</td>
                                    </tr>
                                    <tr>
                                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                                        <Sparkles size={14} className="text-purple-500" /> SEO 상위노출력
                                      </td>
                                      <td className="py-3.5 px-4 font-bold text-slate-800">평균 사진 {blogAnalytics?.avgImages}장</td>
                                      <td className="py-3.5 px-4">
                                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700">
                                          C-Rank 고품질 블로그
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 text-slate-600">스마트블록 키워드 점유 캠페인</td>
                                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600">★★★★★</td>
                                    </tr>
                                  </tbody>
                                </table>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
