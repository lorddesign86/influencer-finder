'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Lock, Mail, ExternalLink, Video, Smartphone, 
  BarChart3, DollarSign, Film, Bookmark, AlertCircle,
  Tag, Users, ArrowUpDown, PieChart, Heart, MessageSquare, 
  Calendar, Eye, UserPlus
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
  const [isProUser, setIsProUser] = useState(true);
  const [search, setSearch] = useState('');

  // 유튜브 상태
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Influencer | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [ytTag, setYtTag] = useState('전체');
  const [subRange, setSubRange] = useState<SubscriberRange>('all');
  const [ytSort, setYtSort] = useState<YoutubeSortOption>('follower_desc');
  const [ytTab, setYtTab] = useState<'content_split' | 'channel' | 'video'>('content_split');

  // 블로그 상태
  const [bloggers, setBloggers] = useState<BlogInfluencer[]>([]);
  const [selectedBlogger, setSelectedBlogger] = useState<BlogInfluencer | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loadingBlogPosts, setLoadingBlogPosts] = useState(false);
  const [blogCat, setBlogCat] = useState('전체');

  // 블로그 숫자 필터
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
        .limit(20);
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
    if (influencers.length > 0 && !selectedChannel) {
      handleSelectChannel(influencers[0]);
    }
  };

  const switchToBlog = () => {
    setPlatformMode('blog');
    setSearch('');
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

    if (!isProUser) return shuffleArray(list).slice(0, 20);
    return list.slice(0, 1000);
  }, [
    bloggers, search, blogCat, 
    minFans, maxFans, minFollowers, maxFollowers, 
    minVisitors, maxVisitors, minLikes, maxLikes, 
    minComments, maxComments, blogSort, isProUser
  ]);

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
                  onClick={() => alert('영상 라이브러리 기능 준비 중입니다.')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  <Film size={18} /> 영상 라이브러리
                </button>
                <button 
                  type="button"
                  onClick={() => alert('즐겨찾기 목록 준비 중입니다.')}
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

      {/* 2. 메인 프레임 */}
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
              onClick={() => setIsProUser(true)}
              className={`text-xs font-semibold text-white px-4 py-2 rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1.5 ${
                platformMode === 'blog' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              <Lock size={12} /> PRO 업그레이드
            </button>
          </div>
        </header>

        {/* ---------------- 블로그 필터 바 ---------------- */}
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

        {/* ---------------- 본문 뷰 ---------------- */}
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
                          
                          {/* ★ 좌측 목록 카드에 전문분야 뱃지(#여행 플래너, #국내 전문 등) 전체 노출 ★ */}
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
                            <span className="text-slate-400">• 일방문 {(blogger.daily_visitors || 0).toLocaleString()}명</span>
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
                          
                          {/* 전문 분야 태그 */}
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

                    {/* 4대 지표 카드: recent_10_avg_likes / comments / avg_likes 모두 안전 바인딩 */}
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
                          {((selectedBlogger.avg_likes ?? selectedBlogger.recent_10_avg_likes) || 0).toLocaleString()} 
                          <span className="text-xs font-normal text-slate-400"> / {((selectedBlogger.avg_comments ?? selectedBlogger.recent_10_avg_comments) || 0).toLocaleString()}</span>
                        </p>
                      </div>
                    </div>

                    {/* 최근 발행 포스트 목록 */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 text-lg">📝</span>
                          <h3 className="text-sm font-bold text-slate-800">최근 발행 콘텐츠</h3>
                          <span className="text-xs text-slate-400 font-normal">({blogPosts.length}개 포스트)</span>
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

                      {loadingBlogPosts ? (
                        <p className="text-xs text-slate-400 py-8 text-center">블로그 포스트를 불러오는 중입니다...</p>
                      ) : blogPosts.length === 0 ? (
                        <p className="text-xs text-slate-400 py-8 text-center">등록된 최신 포스트 데이터가 없습니다.</p>
                      ) : (
                        <div className="space-y-4">
                          {blogPosts.map((post) => (
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
                                  onError={(e) => {
                                    // 403 차단 시 플레이스홀더로 대체
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Blog+Image';
                                  }}
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
                  <div className="h-full flex items-center justify-center text-sm text-slate-400">선택된 블로그 인플루언서가 없습니다.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
