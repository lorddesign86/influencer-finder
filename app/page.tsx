'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Lock, Mail, ExternalLink, Video, Smartphone, 
  BarChart3, DollarSign, Film, Bookmark, AlertCircle,
  Tag, Users, ArrowUpDown, PieChart, Heart, MessageSquare, 
  Calendar, Eye, UserPlus, TrendingUp, ShieldCheck, CheckCircle2,
  Sparkles, FileText, BadgeDollarSign, HelpCircle
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
  is_sponsored?: boolean;
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
  sponsored_post_ratio?: number;
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
  is_sponsored?: boolean;
  sponsor_brand?: string;
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
  
  // PRO 모드 상태 (기본값 false로 두어 무료/PRO 차이를 직접 확인 가능)
  const [isProUser, setIsProUser] = useState(false);
  const [search, setSearch] = useState('');

  // 탭 상태: 1) 기본정보 2) 최근 발행 콘텐츠 (PRO) 3) 광고비 및 디테일 분석 (PRO)
  const [activeTab, setActiveTab] = useState<'basic' | 'posts' | 'analytics'>('basic');
  
  // 포스트 필터: 전체 | 일반글 | 협찬글
  const [postFilter, setPostFilter] = useState<'all' | 'normal' | 'sponsored'>('all');

  // 유튜브 상태
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Influencer | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [ytTag, setYtTag] = useState('전체');
  const [subRange, setSubRange] = useState<SubscriberRange>('all');
  const [ytSort, setYtSort] = useState<YoutubeSortOption>('follower_desc');

  // 블로그 상태
  const [bloggers, setBloggers] = useState<BlogInfluencer[]>([]);
  const [selectedBlogger, setSelectedBlogger] = useState<BlogInfluencer | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loadingBlogPosts, setLoadingBlogPosts] = useState(false);
  const [blogCat, setBlogCat] = useState('전체');

  // 필터 상태
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

  // 데이터 로드
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
    setActiveTab('basic');
    if (bloggers.length > 0 && !selectedBlogger) {
      handleSelectBlogger(bloggers[0]);
    }
  };

  // 블로그 필터링 연산
  const filteredBloggers = useMemo(() => {
    const list = bloggers
      .filter((item) => {
        const q = search.trim().toLowerCase();
        const matchesSearch = !q || 
          (item.name && item.name.toLowerCase().includes(q)) || 
          (item.handle && item.handle.toLowerCase().includes(q));

        const matchesCat = blogCat === '전체' || 
          (item.tags && item.tags.some(t => t.includes(blogCat))) ||
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
      // 일반 무료 모드: 15개 제한 노출
      return list.slice(0, 15);
    }
    return list.slice(0, 1000);
  }, [
    bloggers, search, blogCat, 
    minFans, maxFans, minFollowers, maxFollowers, 
    minVisitors, maxVisitors, minLikes, maxLikes, 
    minComments, maxComments, blogSort, isProUser
  ]);

  // 포스트 필터링 (전체, 일반글, 협찬글)
  const filteredPosts = useMemo(() => {
    if (postFilter === 'all') return blogPosts;
    if (postFilter === 'sponsored') return blogPosts.filter(p => p.is_sponsored);
    return blogPosts.filter(p => !p.is_sponsored);
  }, [blogPosts, postFilter]);

  // 블로그 상세 수식 분석 계산
  const blogAnalytics = useMemo(() => {
    if (!selectedBlogger) return null;
    const dailyV = selectedBlogger.daily_visitors || 0;
    const fans = selectedBlogger.fan_count || 0;
    const likes = selectedBlogger.avg_likes ?? selectedBlogger.recent_10_avg_likes ?? 0;
    const comments = selectedBlogger.avg_comments ?? selectedBlogger.recent_10_avg_comments ?? 0;
    
    // 1) 예상 원고료 산출 (기본: 일방문*25 + 팬수*30, 최소 5만원)
    const basePrice = Math.max(50000, Math.round((dailyV * 25 + fans * 30) / 10000) * 10000);
    const estPrice = selectedBlogger.estimated_post_price || basePrice;

    // 2) 협찬 포스팅 비율
    const sponRatio = selectedBlogger.sponsored_post_ratio ?? 
      (blogPosts.length > 0 ? Math.round((blogPosts.filter(p => p.is_sponsored).length / blogPosts.length) * 100) : 25);

    // 3) 참여율 (Engagement Rate)
    const engRate = selectedBlogger.engagement_rate ?? 
      (dailyV > 0 ? Number((((likes + comments) / dailyV) * 100).toFixed(2)) : 3.8);

    // 4) 월간 포스팅량
    const monthlyPosts = selectedBlogger.monthly_post_count || Math.max(12, blogPosts.length * 2);

    return {
      estPrice,
      sponRatio,
      engRate,
      monthlyPosts,
      avgImages: selectedBlogger.avg_image_count || 16,
      // 마케팅 진단 평가
      adFatigue: sponRatio > 60 ? '높음 (광고 피로도 주의)' : sponRatio > 35 ? '보통 (일반적인 수준)' : '낮음 (진정성 매우 우수)',
      cpaEfficiency: engRate > 4.0 ? '최상급 (구매 전환율 높음)' : engRate > 2.0 ? '우수 (브랜딩 적합)' : '보통 (단순 노출용)',
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
      {/* ==========================================
          1. 사이드바
      ========================================== */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between flex-shrink-0 z-20">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-2">
            <span className="text-2xl font-black tracking-tight text-red-500">vling</span>
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

        {/* PRO / 일반 모드 즉시 전환 스위치 (테스트 및 실제 사용자 제어용) */}
        <div className="p-4 border-t border-slate-100">
          <button 
            type="button"
            onClick={() => setIsProUser(!isProUser)}
            className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
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

      {/* ==========================================
          2. 메인 프레임
      ========================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 상단 검색 헤더 */}
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
              className={`text-xs font-semibold text-white px-4 py-2 rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1.5 ${
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
                    blogCat === cat ? 'bg-green-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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

        {/* ==========================================
            3. 본문 영역
        ========================================== */}
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
                          
                          {/* 전문분야 태그 */}
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
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
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
                        className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm cursor-pointer"
                      >
                        <Mail size={14} /> 문의하기
                      </a>
                    </div>

                    {/* ★ 요청하신 3대 탭 네비게이션: 기본정보 / 최근 발행 콘텐츠 PRO / 광고비 및 디테일분석 PRO ★ */}
                    <div className="flex gap-2 border-b border-slate-200 pb-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('basic')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          activeTab === 'basic' 
                            ? 'bg-slate-900 text-white shadow-sm' 
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
                            ? 'bg-green-600 text-white shadow-sm' 
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
                            ? 'bg-emerald-600 text-white shadow-sm' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <BadgeDollarSign size={14} /> 광고비 및 디테일분석 {!isProUser && <span className="bg-amber-400 text-slate-900 text-[10px] px-1.5 py-0.2 rounded font-black">PRO</span>}
                      </button>
                    </div>

                    {/* ----------------------------------------------------
                        탭 1: 기본 정보 (무료 공개)
                    ---------------------------------------------------- */}
                    {activeTab === 'basic' && (
                      <div className="space-y-6">
                        {/* 4대 주요 지표 카드 */}
                        <div className="grid grid-cols-4 gap-4">
                          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                            <p className="text-xs font-medium text-slate-400 mb-1">인플루언서 팬 수</p>
                            <p className="text-2xl font-black text-slate-900">{(selectedBlogger.fan_count || 0).toLocaleString()}명</p>
                            <span className="text-[11px] text-green-600 font-medium mt-1 inline-block">✓ 공식 인증 팬</span>
                          </div>

                          {/* 일일 방문자 (무료시 마스킹) */}
                          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
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

                          {/* 이웃 수 (무료시 마스킹) */}
                          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
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

                          {/* 평균 공감 / 댓글 (무료시 마스킹) */}
                          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
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

                        {/* 기본 정보 안내 블록 */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
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
                        탭 2: 최근 발행 콘텐츠 (PRO 차별화)
                    ---------------------------------------------------- */}
                    {activeTab === 'posts' && (
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
                        {/* 포스트 상단 필터: 전체글 | 일반글 | 협찬글 */}
                        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-green-600 text-lg">📝</span>
                            <h3 className="text-sm font-bold text-slate-800">최근 발행 포스트</h3>
                            <span className="text-xs text-slate-400 font-normal">({filteredPosts.length}개)</span>
                          </div>

                          {/* 전체글 / 일반글 / 협찬글 필터 버튼 */}
                          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                            <button
                              type="button"
                              onClick={() => setPostFilter('all')}
                              className={`px-3 py-1 rounded-md transition ${postFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                              전체글
                            </button>
                            <button
                              type="button"
                              onClick={() => setPostFilter('normal')}
                              className={`px-3 py-1 rounded-md transition ${postFilter === 'normal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                              일반글
                            </button>
                            <button
                              type="button"
                              onClick={() => setPostFilter('sponsored')}
                              className={`px-3 py-1 rounded-md transition ${postFilter === 'sponsored' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                              협찬/광고글
                            </button>
                          </div>
                        </div>

                        {/* 포스트 리스트 렌더링 (무료일 경우 3개만 보이고 아래 블러 잠금) */}
                        <div className="space-y-4">
                          {(isProUser ? filteredPosts : filteredPosts.slice(0, 3)).map((post) => (
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
                                {post.is_sponsored && (
                                  <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                                    광고/협찬
                                  </span>
                                )}
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

                        {/* 무료 모드일 때 포스트 하단 잠금 배너 */}
                        {!isProUser && (
                          <div className="mt-6 p-6 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 flex flex-col items-center justify-center text-center">
                            <Lock className="text-amber-500 mb-2" size={24} />
                            <h4 className="text-sm font-bold text-slate-900">최근 15개 전체 콘텐츠 열람은 PRO 전용입니다</h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-md">
                              PRO 플랜을 구독하시면 포스트별 광고/협찬 감지 태그와 과거 15개 전체 포스팅 반응을 무제한으로 열람할 수 있습니다.
                            </p>
                            <button
                              type="button"
                              onClick={() => setIsProUser(true)}
                              className="mt-3 text-xs font-bold px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg shadow-sm hover:opacity-95 transition cursor-pointer"
                            >
                              PRO 활성화하고 전체보기
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ----------------------------------------------------
                        탭 3: 광고비 및 디테일 분석 (PRO 전용 전문가 대시보드)
                    ---------------------------------------------------- */}
                    {activeTab === 'analytics' && (
                      <div className="relative">
                        {/* 무료 모드일 때 블러 처리 및 업그레이드 모달 */}
                        {!isProUser ? (
                          <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center py-20">
                            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                              <Lock className="text-emerald-600" size={28} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900">광고비 및 세부 수식 분석은 PRO 전용입니다</h3>
                            <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed">
                              예상 원고료 단가, 상업성 광고 집행률(%), 진성 독자 반응률, 월간 발행량 및 마케팅 가성비 진단표를 확인하여 성공적인 인플루언서 협업을 진행하세요.
                            </p>
                            <button
                              type="button"
                              onClick={() => setIsProUser(true)}
                              className="mt-6 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2"
                            >
                              <Sparkles size={14} /> PRO 모드로 즉시 분석 해제하기
                            </button>
                          </div>
                        ) : (
                          /* PRO 회원에게만 제공되는 전문가형 디테일 분석 표와 지표 */
                          <div className="space-y-6">
                            {/* 1. 핵심 단가 및 광고 비율 카드 */}
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-white p-5 rounded-2xl border-2 border-emerald-100 shadow-xs">
                                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                  <DollarSign size={14} /> 예상 원고료 (포스팅 건당)
                                </span>
                                <p className="text-3xl font-black text-slate-900 mt-2">
                                  {(blogAnalytics?.estPrice || 0).toLocaleString()} <span className="text-sm font-normal text-slate-500">원</span>
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1">방문자 수 × 가중치 기반 추정치</p>
                              </div>

                              <div className="bg-white p-5 rounded-2xl border-2 border-rose-100 shadow-xs">
                                <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
                                  <PieChart size={14} /> 상업성 광고글 비율
                                </span>
                                <p className="text-3xl font-black text-slate-900 mt-2">
                                  {blogAnalytics?.sponRatio}%
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1">최근 15개 포스트 중 협찬 글 비중</p>
                              </div>

                              <div className="bg-white p-5 rounded-2xl border-2 border-blue-100 shadow-xs">
                                <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                                  <TrendingUp size={14} /> 진성 독자 반응률 (참여율)
                                </span>
                                <p className="text-3xl font-black text-slate-900 mt-2">
                                  {blogAnalytics?.engRate}%
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1">방문자 대비 공감/댓글 전환 지표</p>
                              </div>
                            </div>

                            {/* 2. 광고주 맞춤 마케팅 진단 종합표 (전문가 표 형태) */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                📊 마케팅 협업 타당성 진단 종합표
                              </h3>

                              <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-y border-slate-100">
                                    <tr>
                                      <th className="py-3 px-4">분석 항목</th>
                                      <th className="py-3 px-4">산출 지표</th>
                                      <th className="py-3 px-4">진단 결과</th>
                                      <th className="py-3 px-4">권장 협업 전략</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 font-medium">
                                    <tr>
                                      <td className="py-3.5 px-4 text-slate-900 font-bold">광고 피로도</td>
                                      <td className="py-3.5 px-4 text-rose-600 font-bold">{blogAnalytics?.sponRatio}%</td>
                                      <td className="py-3.5 px-4">{blogAnalytics?.adFatigue}</td>
                                      <td className="py-3.5 px-4 text-slate-500">진정성 있는 스토리텔링형 기획 권장</td>
                                    </tr>
                                    <tr>
                                      <td className="py-3.5 px-4 text-slate-900 font-bold">전환율 및 반응력</td>
                                      <td className="py-3.5 px-4 text-blue-600 font-bold">{blogAnalytics?.engRate}%</td>
                                      <td className="py-3.5 px-4">{blogAnalytics?.cpaEfficiency}</td>
                                      <td className="py-3.5 px-4 text-slate-500">공동구매 및 프로모션 할인 링크 배치 적합</td>
                                    </tr>
                                    <tr>
                                      <td className="py-3.5 px-4 text-slate-900 font-bold">월평균 포스팅량</td>
                                      <td className="py-3.5 px-4 text-slate-800 font-bold">약 {blogAnalytics?.monthlyPosts}건</td>
                                      <td className="py-3.5 px-4">활동성 최상</td>
                                      <td className="py-3.5 px-4 text-slate-500">빠른 피드백 및 신속한 발행 가능</td>
                                    </tr>
                                    <tr>
                                      <td className="py-3.5 px-4 text-slate-900 font-bold">평균 사진 첨부수</td>
                                      <td className="py-3.5 px-4 text-slate-800 font-bold">약 {blogAnalytics?.avgImages}장</td>
                                      <td className="py-3.5 px-4">고품질 리뷰어</td>
                                      <td className="py-3.5 px-4 text-slate-500">C-Rank 및 스마트블록 상위 노출에 유리</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
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
