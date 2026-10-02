'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Lock, Mail, ExternalLink, Video, Smartphone, 
  BarChart3, DollarSign, Film, Bookmark, AlertCircle, PlayCircle,
  Tag, Users, ArrowUpDown, PieChart, CheckCircle2, TrendingUp,
  Globe2, UserCheck, ShieldCheck, Heart, MessageSquare, Calendar, Eye
} from 'lucide-react';

// ==========================================
// 1. 타입 정의 (유튜브 & 블로그)
// ==========================================
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
  external_links?: Record<string, string>;
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
  content_type?: string;
  sponsor_brand?: string;
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

// 카테고리 태그 정의
const YOUTUBE_TAGS = ['전체', '맛집', '먹방', '여행', 'Vlog', 'IT', '뷰티', '패션', '게임'];
const BLOG_CATEGORIES = [
  '전체', '여행', '패션', '뷰티', '푸드', 'IT테크', '자동차', '리빙',
  '육아', '생활건강', '게임', '동물·펫', '운동·레저', '프로스포츠',
  '방송·연예', '대중음악', '영화', '공연·전시', '도서', '경제·비즈니스', '어학·교육'
];

type SubscriberRange = 'all' | 'under10k' | '10k_100k' | '100k_500k' | 'over500k';
type YoutubeSortOption = 'follower_desc' | 'views_desc' | 'engagement_desc';

type FanRange = 'all' | 'under1k' | 'over3k' | 'over5k' | 'over10k';
type BlogSortOption = 'fan_desc' | 'visitors_desc' | 'follower_desc' | 'likes_desc' | 'comments_desc';

const shuffleArray = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

export default function PlatformDashboard() {
  // ★ 현재 모드: 'youtube' | 'blog'
  const [platformMode, setPlatformMode] = useState<'youtube' | 'blog'>('youtube');

  // PRO 모드 (테스트용 기본 true)
  const [isProUser, setIsProUser] = useState(true);

  // 공통 검색어
  const [search, setSearch] = useState('');

  // ----------------------------------------------------
  // 유튜브 상태값
  // ----------------------------------------------------
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Influencer | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [ytTag, setYtTag] = useState('전체');
  const [subRange, setSubRange] = useState<SubscriberRange>('all');
  const [ytSort, setYtSort] = useState<YoutubeSortOption>('follower_desc');
  const [videoTypeFilter, setVideoTypeFilter] = useState<'ALL' | 'VIDEO' | 'SHORTS'>('ALL');
  const [ytTab, setYtTab] = useState<'content_split' | 'channel' | 'video' | 'audience' | 'ad_cost'>('content_split');

  // ----------------------------------------------------
  // 블로그 상태값
  // ----------------------------------------------------
  const [bloggers, setBloggers] = useState<BlogInfluencer[]>([]);
  const [selectedBlogger, setSelectedBlogger] = useState<BlogInfluencer | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loadingBlogPosts, setLoadingBlogPosts] = useState(false);
  const [blogCat, setBlogCat] = useState('전체');
  const [fanRange, setFanRange] = useState<FanRange>('all');
  const [minVisitors, setMinVisitors] = useState('');
  const [maxVisitors, setMaxVisitors] = useState('');
  const [blogSort, setBlogSort] = useState<BlogSortOption>('fan_desc');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ==========================================
  // 데이터 불러오기 함수들
  // ==========================================
  const fetchYoutubeChannels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('influencers')
        .select('*')
        .order('follower_count', { ascending: false })
        .limit(2000);
      if (error) throw error;
      if (data) {
        setInfluencers(data as Influencer[]);
        if (data.length > 0 && !selectedChannel) {
          handleSelectChannel(data[0] as Influencer);
        }
      }
    } catch (err: any) {
      console.error(err);
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
      const { data, error } = await supabase
        .from('influencer_posts')
        .select('*')
        .or(`channel_id.eq.${cleanId},channel_id.eq.${channel.channel_id}`)
        .limit(30);
      if (!error && data) setPosts(data as Post[]);
    } catch (e) {
      setPosts([]);
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
      const { data, error } = await supabase
        .from('blog_influencers')
        .select('*')
        .order('fan_count', { ascending: false })
        .limit(2000);
      if (error) throw error;
      if (data) {
        setBloggers(data as BlogInfluencer[]);
        if (data.length > 0 && !selectedBlogger) {
          handleSelectBlogger(data[0] as BlogInfluencer);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBloggerPosts = async (blogger: BlogInfluencer) => {
    if (!blogger) return;
    setLoadingBlogPosts(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('blog_id', blogger.blog_id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error && data) setBlogPosts(data as BlogPost[]);
    } catch (e) {
      setBlogPosts([]);
    } finally {
      setLoadingBlogPosts(false);
    }
  };

  const handleSelectBlogger = (blogger: BlogInfluencer) => {
    setSelectedBlogger(blogger);
    if (blogger) fetchBloggerPosts(blogger);
  };

  // 초기 로딩 (유튜브 + 블로그 둘 다 준비)
  useEffect(() => {
    fetchYoutubeChannels();
    fetchBloggers();
  }, []);

  // 탭 변경 시 처리
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

  // ==========================================
  // 필터링 연산
  // ==========================================
  // 유튜브 필터
  const filteredInfluencers = useMemo(() => {
    const list = influencers
      .filter((item) => {
        const q = search.trim().toLowerCase();
        const matchesSearch = !q || 
          (item.name && item.name.toLowerCase().includes(q)) || 
          (item.handle && item.handle.toLowerCase().includes(q));

        const matchesTag = ytTag === '전체' || 
          (item.tags && item.tags.some(t => t.includes(ytTag))) ||
          (item.name && item.name.includes(ytTag));

        const count = item.follower_count || 0;
        let matchesRange = true;
        if (isProUser) {
          if (subRange === 'under10k') matchesRange = count < 10000;
          else if (subRange === '10k_100k') matchesRange = count >= 10000 && count < 100000;
          else if (subRange === '100k_500k') matchesRange = count >= 100000 && count < 500000;
          else if (subRange === 'over500k') matchesRange = count >= 500000;
        }

        return matchesSearch && matchesTag && matchesRange;
      })
      .sort((a, b) => {
        if (!isProUser) return 0;
        if (ytSort === 'follower_desc') return (b.follower_count || 0) - (a.follower_count || 0);
        if (ytSort === 'views_desc') return (b.avg_views || 0) - (a.avg_views || 0);
        if (ytSort === 'engagement_desc') return (b.engagement_rate || 0) - (a.engagement_rate || 0);
        return 0;
      });

    if (!isProUser) {
      const mega = list.filter((i) => (i.follower_count || 0) >= 1000000);
      return shuffleArray(mega.length >= 20 ? mega : list).slice(0, 20);
    }
    return list.slice(0, 1000);
  }, [influencers, search, ytTag, subRange, ytSort, isProUser]);

  // 블로그 필터
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
        let matchesFan = true;
        if (fanRange === 'under1k') matchesFan = fans <= 1000;
        else if (fanRange === 'over3k') matchesFan = fans >= 3000;
        else if (fanRange === 'over5k') matchesFan = fans >= 5000;
        else if (fanRange === 'over10k') matchesFan = fans >= 10000;

        const visitors = item.daily_visitors || 0;
        let matchesVisitors = true;
        const minV = minVisitors ? parseInt(minVisitors, 10) : null;
        const maxV = maxVisitors ? parseInt(maxVisitors, 10) : null;
        if (minV !== null && !isNaN(minV) && visitors < minV) matchesVisitors = false;
        if (maxV !== null && !isNaN(maxV) && visitors > maxV) matchesVisitors = false;

        return matchesSearch && matchesCat && matchesFan && matchesVisitors;
      })
      .sort((a, b) => {
        if (!isProUser) return 0;
        if (blogSort === 'fan_desc') return (b.fan_count || 0) - (a.fan_count || 0);
        if (blogSort === 'visitors_desc') return (b.daily_visitors || 0) - (a.daily_visitors || 0);
        if (blogSort === 'follower_desc') return (b.follower_count || 0) - (a.follower_count || 0);
        if (blogSort === 'likes_desc') return (b.avg_likes || 0) - (a.avg_likes || 0);
        if (blogSort === 'comments_desc') return (b.avg_comments || 0) - (a.avg_comments || 0);
        return 0;
      });

    if (!isProUser) {
      return shuffleArray(list).slice(0, 20);
    }
    return list.slice(0, 1000);
  }, [bloggers, search, blogCat, fanRange, minVisitors, maxVisitors, blogSort, isProUser]);

  // 쇼츠 vs 롱폼 분석 지표
  const channelAnalytics = useMemo(() => {
    if (!posts || posts.length === 0) {
      return {
        totalAnalyzed: 0, shortsCount: 0, videosCount: 0, shortsRatio: 0, videoRatio: 0,
        avgShortsViews: 0, avgVideoViews: 0, estShortsCpv: 0, estVideoCpv: 0,
        engagementRate: selectedChannel?.engagement_rate || 0, sponsoredCount: 0, sponsoredRatio: 0
      };
    }
    let shortsCount = 0, videosCount = 0, shortsViewSum = 0, videoViewSum = 0, totalInteractions = 0, totalViews = 0, sponsoredCount = 0;
    posts.forEach((p) => {
      const views = p.view_count || 0;
      totalViews += views;
      totalInteractions += ((p.like_count || 0) + (p.comment_count || 0));
      if (p.is_sponsored) sponsoredCount++;
      const isShorts = p.content_type === 'SHORTS' || (p.post_url && p.post_url.includes('/shorts/'));
      if (isShorts) { shortsCount++; shortsViewSum += views; }
      else { videosCount++; videoViewSum += views; }
    });
    const totalAnalyzed = posts.length;
    const shortsRatio = totalAnalyzed > 0 ? Math.round((shortsCount / totalAnalyzed) * 100) : 0;
    const avgShortsViews = shortsCount > 0 ? Math.round(shortsViewSum / shortsCount) : 0;
    const avgVideoViews = videosCount > 0 ? Math.round(videoViewSum / videosCount) : 0;
    return {
      totalAnalyzed, shortsCount, videosCount, shortsRatio, videoRatio: 100 - shortsRatio,
      avgShortsViews, avgVideoViews,
      estShortsCpv: Math.round(avgShortsViews * 15),
      estVideoCpv: Math.round(avgVideoViews * 35),
      engagementRate: totalViews > 0 ? Number(((totalInteractions / totalViews) * 100).toFixed(2)) : (selectedChannel?.engagement_rate || 0),
      sponsoredCount,
      sponsoredRatio: totalAnalyzed > 0 ? Math.round((sponsoredCount / totalAnalyzed) * 100) : 0
    };
  }, [posts, selectedChannel]);

  return (
    <div className="flex h-screen bg-[#f8f9fa] text-slate-800 antialiased overflow-hidden font-sans">
      {/* ==========================================
          1. 고정 좌측 사이드바 (완벽 일치)
      ========================================== */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between flex-shrink-0">
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
                {/* 1) 유튜버 찾기 버튼 */}
                <button 
                  type="button"
                  onClick={switchToYoutube}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                    platformMode === 'youtube' ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Search size={18} /> 유튜버 찾기
                </button>

                {/* 2) 블로그인플루언서 찾기 버튼 */}
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

      {/* ==========================================
          2. 메인 컨텐츠 영역
      ========================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 상단 공통 헤더: 현재 모드에 따라 DB 검색 대상 분기 */}
        <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between flex-shrink-0">
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

        {/* ----------------------------------------------------
            A. 유튜브 모드일 때의 상단 필터 바
        ---------------------------------------------------- */}
        {platformMode === 'youtube' && (
          <div className="bg-white border-b border-slate-200 px-8 py-3 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
                <Tag size={13} /> 분류:
              </span>
              {YOUTUBE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setYtTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                    ytTag === tag ? 'bg-red-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-slate-50 border-slate-200">
                <Users size={14} className="text-slate-400" />
                <select
                  value={subRange}
                  onChange={(e) => setSubRange(e.target.value as SubscriberRange)}
                  className="bg-transparent font-medium outline-none text-slate-700 cursor-pointer"
                >
                  <option value="all">구독자 전체</option>
                  <option value="under10k">1만 미만</option>
                  <option value="10k_100k">1만 ~ 10만</option>
                  <option value="100k_500k">10만 ~ 50만</option>
                  <option value="over500k">50만 이상 (메가)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-slate-50 border-slate-200">
                <ArrowUpDown size={14} className="text-slate-400" />
                <select
                  value={ytSort}
                  onChange={(e) => setYtSort(e.target.value as YoutubeSortOption)}
                  className="bg-transparent font-medium outline-none text-slate-700 cursor-pointer"
                >
                  <option value="follower_desc">구독자 많은 순</option>
                  <option value="views_desc">평균 조회수 높은 순</option>
                  <option value="engagement_desc">참여율 높은 순</option>
                </select>
              </div>

              {(ytTag !== '전체' || subRange !== 'all' || search !== '') && (
                <button
                  type="button"
                  onClick={() => { setYtTag('전체'); setSubRange('all'); setSearch(''); }}
                  className="text-xs text-red-500 hover:underline font-semibold ml-1 cursor-pointer"
                >
                  초기화
                </button>
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            B. 블로그 모드일 때의 상단 필터 바 (21개 태그 + 팬수/일방문자 직접입력)
        ---------------------------------------------------- */}
        {platformMode === 'blog' && (
          <div>
            {/* 1행: 21개 네이버 공식 카테고리 */}
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

            {/* 2행: 팬수 구간 & 일방문자 숫자 직접입력 (Min ~ Max) */}
            <div className="bg-slate-50/80 border-b border-slate-200 px-8 py-2.5 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* 팬수 */}
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-white border-slate-200">
                  <Users size={14} className="text-slate-400" />
                  <select
                    value={fanRange}
                    onChange={(e) => setFanRange(e.target.value as FanRange)}
                    className="bg-transparent font-medium outline-none text-slate-700 cursor-pointer"
                  >
                    <option value="all">팬 수 전체</option>
                    <option value="under1k">1,000명 이하</option>
                    <option value="over3k">3,000명 이상</option>
                    <option value="over5k">5,000명 이상</option>
                    <option value="over10k">1만명 이상</option>
                  </select>
                </div>

                {/* 일방문자 직접입력 */}
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  <Eye size={13} className="text-slate-400 mr-1" />
                  <span className="text-slate-500 font-medium">일방문자:</span>
                  <input
                    type="number"
                    placeholder="최소(명)"
                    value={minVisitors}
                    onChange={(e) => setMinVisitors(e.target.value)}
                    className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-center outline-none focus:border-green-500 text-slate-700"
                  />
                  <span className="text-slate-400">~</span>
                  <input
                    type="number"
                    placeholder="최대(명)"
                    value={maxVisitors}
                    onChange={(e) => setMaxVisitors(e.target.value)}
                    className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-center outline-none focus:border-green-500 text-slate-700"
                  />
                </div>

                {/* 블로그 정렬 */}
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-white border-slate-200">
                  <ArrowUpDown size={14} className="text-slate-400" />
                  <select
                    value={blogSort}
                    onChange={(e) => setBlogSort(e.target.value as BlogSortOption)}
                    className="bg-transparent font-medium outline-none text-slate-700 cursor-pointer"
                  >
                    <option value="fan_desc">인플루언서 팬 많은 순</option>
                    <option value="visitors_desc">일일 방문자 많은 순</option>
                    <option value="follower_desc">이웃(팔로워) 많은 순</option>
                    <option value="likes_desc">평균 공감 많은 순</option>
                    <option value="comments_desc">평균 댓글 많은 순</option>
                  </select>
                </div>
              </div>

              {(blogCat !== '전체' || fanRange !== 'all' || minVisitors !== '' || maxVisitors !== '' || search !== '') && (
                <button
                  type="button"
                  onClick={() => { setBlogCat('전체'); setFanRange('all'); setMinVisitors(''); setMaxVisitors(''); setSearch(''); }}
                  className="text-xs text-green-600 hover:underline font-semibold cursor-pointer"
                >
                  필터 초기화
                </button>
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            3. 본문 뷰 (유튜브 vs 블로그 스위칭)
        ---------------------------------------------------- */}
        <div className="flex-1 flex overflow-hidden">
          {/* =======================
              유튜브 본문 레이아웃
          ======================= */}
          {platformMode === 'youtube' && (
            <>
              {/* 채널 목록 */}
              <div className="w-1/3 border-r border-slate-200 overflow-y-auto bg-white flex flex-col justify-between">
                <div>
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                    <span className="text-xs font-bold text-slate-500">
                      인플루언서 목록 ({filteredInfluencers.length}개 {isProUser ? '전체' : '샘플'})
                    </span>
                  </div>

                  {loading ? (
                    <div className="p-8 text-center text-sm text-slate-400">데이터를 불러오는 중...</div>
                  ) : filteredInfluencers.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">일치하는 인플루언서가 없습니다.</div>
                  ) : (
                    filteredInfluencers.map((channel) => (
                      <div 
                        key={channel.channel_id}
                        onClick={() => handleSelectChannel(channel)}
                        className={`p-4 border-b border-slate-100 flex items-center gap-3 cursor-pointer transition ${
                          selectedChannel?.channel_id === channel.channel_id ? 'bg-red-50/60 border-l-4 border-l-red-500' : 'hover:bg-slate-50'
                        }`}
                      >
                        <img 
                          src={channel.profile_img_url || 'https://via.placeholder.com/150'} 
                          alt={channel.name} 
                          className="w-12 h-12 rounded-full border border-slate-200 object-cover flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{channel.name}</h4>
                          <p className="text-xs text-slate-400 truncate">{channel.handle}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-semibold text-slate-600">구독자 {(channel.follower_count / 10000).toFixed(1)}만</span>
                            <span className="text-[11px] text-slate-400">• 평균조회 {(channel.avg_views / 10000).toFixed(1)}만</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 우측 유튜브 대시보드 */}
              <div className="flex-1 overflow-y-auto p-8 bg-[#f8f9fa]">
                {selectedChannel ? (
                  <div className="max-w-4xl mx-auto space-y-6">
                    {/* 상단 프로필 카드 */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                      <div className="flex gap-4">
                        <img 
                          src={selectedChannel.profile_img_url || 'https://via.placeholder.com/150'} 
                          alt={selectedChannel.name} 
                          className="w-16 h-16 rounded-full border border-slate-200 object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-slate-900">{selectedChannel.name}</h2>
                            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">{selectedChannel.primary_language?.toUpperCase() || 'KO'}</span>
                          </div>
                          <p className="text-sm text-slate-400 mt-0.5">{selectedChannel.handle}</p>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {(selectedChannel.tags || []).map((t, idx) => (
                              <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">#{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => alert(`문의 이메일: ${selectedChannel.contact_email || '등록된 이메일이 없습니다.'}`)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                      >
                        <Mail size={14} /> 문의하기
                      </button>
                    </div>

                    {/* 탭 네비게이션 */}
                    <div className="flex gap-2 border-b border-slate-200 pb-2">
                      {[
                        { id: 'content_split', label: '📊 쇼츠 vs 롱폼 분리 통계' },
                        { id: 'channel', label: '채널 지표' },
                        { id: 'video', label: '최근 영상 목록' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setYtTab(tab.id as any)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                            ytTab === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {ytTab === 'content_split' && (
                      <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                              <PieChart size={18} className="text-red-500" /> 콘텐츠 유형 비중 (최근 {channelAnalytics.totalAnalyzed}개 기준)
                            </h3>
                            <div className="flex items-center gap-3 text-xs font-semibold">
                              <span className="flex items-center gap-1 text-red-500">쇼츠 {channelAnalytics.shortsRatio}% ({channelAnalytics.shortsCount}개)</span>
                              <span className="flex items-center gap-1 text-blue-600">롱폼 {channelAnalytics.videoRatio}% ({channelAnalytics.videosCount}개)</span>
                            </div>
                          </div>
                          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex">
                            <div style={{ width: `${channelAnalytics.shortsRatio}%` }} className="bg-red-500"></div>
                            <div style={{ width: `${channelAnalytics.videoRatio}%` }} className="bg-blue-600"></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                          <div className="bg-white p-6 rounded-2xl border-2 border-red-100 shadow-sm">
                            <div className="flex items-center gap-2 text-red-500 text-sm font-bold mb-4">
                              <Smartphone size={18} /> 숏폼(쇼츠) 성과
                            </div>
                            <p className="text-xs text-slate-400 font-medium">평균 조회수</p>
                            <p className="text-2xl font-black text-slate-900 mt-0.5">{channelAnalytics.avgShortsViews.toLocaleString()}회</p>
                          </div>
                          <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-sm">
                            <div className="flex items-center gap-2 text-blue-600 text-sm font-bold mb-4">
                              <Video size={18} /> 일반(롱폼) 영상 성과
                            </div>
                            <p className="text-xs text-slate-400 font-medium">평균 조회수</p>
                            <p className="text-2xl font-black text-slate-900 mt-0.5">{channelAnalytics.avgVideoViews.toLocaleString()}회</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {ytTab === 'video' && (
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="grid grid-cols-3 gap-4">
                          {posts.map((post, idx) => (
                            <div key={idx} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col justify-between">
                              <div className="relative aspect-video bg-slate-200">
                                <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-cover" />
                              </div>
                              <div className="p-3">
                                <h4 className="text-xs font-medium text-slate-800 line-clamp-2">{post.title}</h4>
                                <p className="text-[11px] text-slate-500 mt-2 font-semibold">조회수 {(post.view_count || 0).toLocaleString()}회</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400">선택된 인플루언서가 없습니다.</div>
                )}
              </div>
            </>
          )}

          {/* =======================
              블로그 본문 레이아웃 (요청 사항 100% 반영)
          ======================= */}
          {platformMode === 'blog' && (
            <>
              {/* 블로거 목록 */}
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
                          className="w-12 h-12 rounded-full border border-slate-200 object-cover flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-slate-900 truncate">{blogger.name}</h4>
                            <span className="text-[9px] px-1.5 py-0.2 bg-green-100 text-green-700 font-bold rounded">INFLUENCER</span>
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
              </div>

              {/* 우측 블로그 대시보드 */}
              <div className="flex-1 overflow-y-auto p-8 bg-[#f8f9fa]">
                {selectedBlogger ? (
                  <div className="max-w-4xl mx-auto space-y-6">
                    {/* 상단 블로거 프로필 카드 */}
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

                      {/* 문의하기 버튼 (인플루언서 링크 새창 이동) */}
                      <a 
                        href={selectedBlogger.contact_url || selectedBlogger.profile_url || `https://blog.naver.com/${selectedBlogger.blog_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm cursor-pointer"
                      >
                        <Mail size={14} /> 문의하기
                      </a>
                    </div>

                    {/* 블로그 4대 지표 카드 */}
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

                    {/* 최신 블로그 포스트 카드 (좌측 대표 사진 + 우측 제목, 요약, 날짜, 공감/댓글) */}
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
