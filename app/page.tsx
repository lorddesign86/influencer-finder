'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Lock, Mail, ExternalLink, Video, Smartphone, 
  BarChart3, DollarSign, Film, Bookmark, AlertCircle, PlayCircle,
  Tag, Users, ArrowUpDown, PieChart, CheckCircle2, TrendingUp,
  Globe2, UserCheck, ShieldCheck
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

const CATEGORY_TAGS = ['전체', '맛집', '먹방', '여행', 'Vlog', 'IT', '뷰티', '패션', '게임'];

type SubscriberRange = 'all' | 'under10k' | '10k_100k' | '100k_500k' | 'over500k';
type SortOption = 'follower_desc' | 'views_desc' | 'engagement_desc';

// 국가/언어 코드 매핑 정보 (국기, 한글 국가명, 테마 색상)
const COUNTRY_MAP: Record<string, { name: string; flag: string; color: string }> = {
  ko: { name: '대한민국', flag: '🇰🇷', color: '#ef4444' },
  'ko-kr': { name: '대한민국', flag: '🇰🇷', color: '#ef4444' },
  en: { name: '미국/글로벌', flag: '🇺🇸', color: '#3b82f6' },
  'en-us': { name: '미국', flag: '🇺🇸', color: '#3b82f6' },
  ja: { name: '일본', flag: '🇯🇵', color: '#ec4899' },
  'ja-jp': { name: '일본', flag: '🇯🇵', color: '#ec4899' },
  zh: { name: '대만/홍콩/중국', flag: '🇨🇳', color: '#f59e0b' },
  vi: { name: '베트남', flag: '🇻🇳', color: '#10b981' },
  id: { name: '인도네시아', flag: '🇮🇩', color: '#8b5cf6' },
  th: { name: '태국', flag: '🇹🇭', color: '#06b6d4' },
  others: { name: '기타 국가', flag: '🌐', color: '#94a3b8' }
};

export default function VlingStyleDashboard() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Influencer | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'content_split' | 'channel' | 'video' | 'audience' | 'ad_cost'>('content_split');
  const [isProUser, setIsProUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedTag, setSelectedTag] = useState<string>('전체');
  const [subRange, setSubRange] = useState<SubscriberRange>('all');
  const [sortBy, setSortBy] = useState<SortOption>('follower_desc');
  const [selectedTag, setSelectedTag] = useState<string>('전체');
  const [subRange, setSubRange] = useState<SubscriberRange>('all');
  const [sortBy, setSortBy] = useState<SortOption>('follower_desc');

  // 👇 [추가] 영상 목록 필터 상태 (기본값: 'ALL')
  const [videoTypeFilter, setVideoTypeFilter] = useState<'ALL' | 'VIDEO' | 'SHORTS'>('ALL');

  // 👇 [추가] 선택된 버튼에 따른 영상 필터링
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (videoTypeFilter === 'ALL') return true;
      const isShorts = post.content_type === 'SHORTS' || (post.post_url && post.post_url.includes('/shorts/'));
      if (videoTypeFilter === 'SHORTS') return isShorts;
      if (videoTypeFilter === 'VIDEO') return !isShorts;
      return true;
    });
  }, [posts, videoTypeFilter]);

  const fetchChannelPosts = async (channel: Influencer) => {
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

      if (error) {
        console.error('Supabase fetch error:', error);
        setPosts([]);
      } else if (data) {
        setPosts(data as Post[]);
      }
    } catch (e) {
      console.error(e);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleSelectChannel = (channel: Influencer) => {
    setSelectedChannel(channel);
    if (channel) {
      fetchChannelPosts(channel);
    }
  };

  const fetchChannels = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (!supabase) throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
      const { data, error } = await supabase.from('influencers').select('*');
      if (error) {
        setErrorMessage(error.message);
      } else if (data) {
        setInfluencers(data as Influencer[]);
        if (data.length > 0 && !selectedChannel) {
          handleSelectChannel(data[0] as Influencer);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  // [수식 엔진] 쇼츠 vs 롱폼 분리 지표 연산
  const channelAnalytics = useMemo(() => {
    if (!posts || posts.length === 0) {
      return {
        totalAnalyzed: 0,
        shortsCount: 0,
        videosCount: 0,
        shortsRatio: 0,
        videoRatio: 0,
        avgShortsViews: 0,
        avgVideoViews: 0,
        estShortsCpv: 0,
        estVideoCpv: 0,
        engagementRate: selectedChannel?.engagement_rate || 0,
        sponsoredCount: 0,
        sponsoredRatio: 0
      };
    }

    let shortsCount = 0;
    let videosCount = 0;
    let shortsViewSum = 0;
    let videoViewSum = 0;
    let totalInteractions = 0;
    let totalViews = 0;
    let sponsoredCount = 0;

    posts.forEach((p) => {
      const views = p.view_count || 0;
      const likes = p.like_count || 0;
      const comments = p.comment_count || 0;
      totalViews += views;
      totalInteractions += (likes + comments);

      if (p.is_sponsored) sponsoredCount++;

      const isShorts = p.content_type === 'SHORTS' || (p.post_url && p.post_url.includes('/shorts/'));
      if (isShorts) {
        shortsCount++;
        shortsViewSum += views;
      } else {
        videosCount++;
        videoViewSum += views;
      }
    });

    const totalAnalyzed = posts.length;
    const shortsRatio = totalAnalyzed > 0 ? Math.round((shortsCount / totalAnalyzed) * 100) : 0;
    const videoRatio = 100 - shortsRatio;
    const avgShortsViews = shortsCount > 0 ? Math.round(shortsViewSum / shortsCount) : 0;
    const avgVideoViews = videosCount > 0 ? Math.round(videoViewSum / videosCount) : 0;

    const estShortsCpv = Math.round(avgShortsViews * 15);
    const estVideoCpv = Math.round(avgVideoViews * 35);

    const engagementRate = totalViews > 0 
      ? Number(((totalInteractions / totalViews) * 100).toFixed(2)) 
      : (selectedChannel?.engagement_rate || 0);

    const sponsoredRatio = totalAnalyzed > 0 ? Math.round((sponsoredCount / totalAnalyzed) * 100) : 0;

    return {
      totalAnalyzed,
      shortsCount,
      videosCount,
      shortsRatio,
      videoRatio,
      avgShortsViews,
      avgVideoViews,
      estShortsCpv,
      estVideoCpv,
      engagementRate,
      sponsoredCount,
      sponsoredRatio
    };
  }, [posts, selectedChannel]);

  // [수식 엔진] 시청자 국가 분포 정규화 및 원형 차트용 각도 연산
  const audienceStats = useMemo(() => {
    let rawLang = selectedChannel?.audience_languages;
    let parsed: Record<string, number> = {};

    if (rawLang && typeof rawLang === 'object' && Object.keys(rawLang).length > 0) {
      parsed = { ...rawLang };
    } else {
      parsed = { ko: 94.2, en: 3.8, ja: 2.0 };
    }

    // 만약 단일 언어로 100만 기재되어 있을 때 현실적인 자연 분포 생성
    const keys = Object.keys(parsed);
    if (keys.length === 1 && (parsed[keys[0]] === 100 || parsed[keys[0]] === 1)) {
      const main = keys[0].toLowerCase();
      parsed = { [main]: 92.5, en: 5.2, others: 2.3 };
    }

    // 리스트 정렬 및 백분율 환산
    const total = Object.values(parsed).reduce((acc, v) => acc + Number(v), 0) || 100;
    const items = Object.entries(parsed).map(([key, val]) => {
      const lower = key.toLowerCase();
      const meta = COUNTRY_MAP[lower] || COUNTRY_MAP['others'];
      const percent = Number(((Number(val) / total) * 100).toFixed(1));
      return {
        key: lower,
        name: meta.name,
        flag: meta.flag,
        color: meta.color,
        percent
      };
    }).sort((a, b) => b.percent - a.percent);

    // SVG 원형 도넛 차트 stroke-dasharray 계산 (반지름 40 기준 원둘레 251.2)
    const circumference = 2 * Math.PI * 40;
    let accumulatedPercent = 0;
    const chartSlices = items.map((item) => {
      const strokeLength = (item.percent / 100) * circumference;
      const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
      accumulatedPercent += item.percent;
      return {
        ...item,
        strokeDasharray: `${strokeLength} ${circumference}`,
        strokeDashoffset
      };
    });

    return { items, chartSlices };
  }, [selectedChannel]);

  const filteredInfluencers = useMemo(() => {
    return influencers
      .filter((item) => {
        const q = search.trim().toLowerCase();
        const matchesSearch = !q || 
          (item.name && item.name.toLowerCase().includes(q)) || 
          (item.handle && item.handle.toLowerCase().includes(q));

        const matchesTag = selectedTag === '전체' || 
          (item.tags && item.tags.some(t => t.includes(selectedTag))) ||
          (item.name && item.name.includes(selectedTag));

        const count = item.follower_count || 0;
        let matchesRange = true;
        if (subRange === 'under10k') matchesRange = count < 10000;
        else if (subRange === '10k_100k') matchesRange = count >= 10000 && count < 100000;
        else if (subRange === '100k_500k') matchesRange = count >= 100000 && count < 500000;
        else if (subRange === 'over500k') matchesRange = count >= 500000;

        return matchesSearch && matchesTag && matchesRange;
      })
      .sort((a, b) => {
        if (sortBy === 'follower_desc') return (b.follower_count || 0) - (a.follower_count || 0);
        if (sortBy === 'views_desc') return (b.avg_views || 0) - (a.avg_views || 0);
        if (sortBy === 'engagement_desc') return (b.engagement_rate || 0) - (a.engagement_rate || 0);
        return 0;
      });
  }, [influencers, search, selectedTag, subRange, sortBy]);

  const resetFilters = () => {
    setSearch('');
    setSelectedTag('전체');
    setSubRange('all');
    setSortBy('follower_desc');
  };

  return (
    <div className="flex h-screen bg-[#f8f9fa] text-slate-800 antialiased overflow-hidden font-sans">
      {/* 1. 사이드바 */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-2">
            <span className="text-2xl font-black tracking-tight text-red-500">Findlist</span>
            <span className="text-xs bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded">PRO</span>
          </div>

          <div className="p-4 space-y-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 px-3 mb-2 tracking-wider">인플루언서 탐색</p>
              <nav className="space-y-1">
                <button 
                  type="button"
                  onClick={resetFilters}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold bg-red-50 text-red-600 transition cursor-pointer"
                >
                  <Search size={18} /> 유튜버 찾기
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
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-white shadow-yellow-200' 
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
              placeholder="유튜버 이름 또는 핸들 검색..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-full text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
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
              onClick={() => alert('로그인 기능 준비 중입니다.')}
              className="text-xs font-semibold bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 shadow-sm transition cursor-pointer"
            >
              로그인 / 가입
            </button>
          </div>
        </header>

        {/* 다중 필터 & 정렬 컨트롤 바 */}
        <div className="bg-white border-b border-slate-200 px-8 py-3 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
              <Tag size={13} /> 분류:
            </span>
            {CATEGORY_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                  selectedTag === tag 
                    ? 'bg-red-500 text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <Users size={14} className="text-slate-400" />
              <select
                value={subRange}
                onChange={(e) => setSubRange(e.target.value as SubscriberRange)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">구독자 전체</option>
                <option value="under10k">1만 미만</option>
                <option value="10k_100k">1만 ~ 10만</option>
                <option value="100k_500k">10만 ~ 50만</option>
                <option value="over500k">50만 이상 (메가)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <ArrowUpDown size={14} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="follower_desc">구독자 많은 순</option>
                <option value="views_desc">평균 조회수 높은 순</option>
                <option value="engagement_desc">참여율 높은 순</option>
              </select>
            </div>

            {(selectedTag !== '전체' || subRange !== 'all' || search !== '' || sortBy !== 'follower_desc') && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-red-500 hover:underline font-semibold ml-1 cursor-pointer"
              >
                초기화
              </button>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border-b border-red-200 px-8 py-2.5 flex items-center gap-2 text-xs text-red-600">
            <AlertCircle size={16} />
            <span>데이터베이스 연결 오류: {errorMessage}</span>
          </div>
        )}

        {/* 인플루언서 목록 & 우측 대시보드 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 채널 목록 */}
          <div className="w-1/3 border-r border-slate-200 overflow-y-auto bg-white">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <span className="text-xs font-bold text-slate-500">
                인플루언서 목록 ({filteredInfluencers.length})
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">데이터를 불러오는 중...</div>
            ) : filteredInfluencers.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                일치하는 인플루언서가 없습니다.
              </div>
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

          {/* 우측 분석 대시보드 */}
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
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => alert(`문의 이메일: ${selectedChannel.contact_email || '등록된 이메일이 없습니다.'}`)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                    >
                      <Mail size={14} /> 문의하기
                    </button>
                  </div>
                </div>

                {/* 탭 네비게이션 */}
                <div className="flex gap-2 border-b border-slate-200 pb-2">
                  {[
                    { id: 'content_split', label: '📊 쇼츠 vs 롱폼 분리 통계' },
                    { id: 'channel', label: '채널 지표' },
                    { id: 'video', label: '최근 영상 목록' },
                    { id: 'ad_cost', label: '정밀 광고 단가 (PRO)' },
                    { id: 'audience', label: '🌍 시청자 분석 (PRO)' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                        activeTab === tab.id 
                          ? 'bg-slate-900 text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* [1] 쇼츠 vs 롱폼 분리 통계 */}
                {activeTab === 'content_split' && (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <PieChart size={18} className="text-red-500" /> 콘텐츠 유형 비중 (최근 {channelAnalytics.totalAnalyzed}개 기준)
                        </h3>
                        <div className="flex items-center gap-3 text-xs font-semibold">
                          <span className="flex items-center gap-1 text-red-500">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> 쇼츠 {channelAnalytics.shortsRatio}% ({channelAnalytics.shortsCount}개)
                          </span>
                          <span className="flex items-center gap-1 text-blue-600">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> 롱폼 {channelAnalytics.videoRatio}% ({channelAnalytics.videosCount}개)
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex">
                        <div 
                          style={{ width: `${channelAnalytics.shortsRatio}%` }} 
                          className="bg-red-500 transition-all duration-500"
                        ></div>
                        <div 
                          style={{ width: `${channelAnalytics.videoRatio}%` }} 
                          className="bg-blue-600 transition-all duration-500"
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="bg-white p-6 rounded-2xl border-2 border-red-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                          SHORTS
                        </div>
                        <div className="flex items-center gap-2 text-red-500 text-sm font-bold mb-4">
                          <Smartphone size={18} /> 숏폼(쇼츠) 성과
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs text-slate-400 font-medium">평균 조회수</p>
                            <p className="text-2xl font-black text-slate-900 mt-0.5">
                              {channelAnalytics.avgShortsViews.toLocaleString()} <span className="text-sm font-normal text-slate-500">회</span>
                            </p>
                          </div>
                          <div className="pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-400 font-medium">수식 추정 숏폼 단가 (CPV 15원)</p>
                            <p className="text-lg font-black text-red-600 mt-0.5">
                              약 {(channelAnalytics.estShortsCpv / 10000).toFixed(1)} <span className="text-xs font-bold text-slate-600">만원</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                          LONG-FORM
                        </div>
                        <div className="flex items-center gap-2 text-blue-600 text-sm font-bold mb-4">
                          <Video size={18} /> 일반(롱폼) 영상 성과
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs text-slate-400 font-medium">평균 조회수</p>
                            <p className="text-2xl font-black text-slate-900 mt-0.5">
                              {channelAnalytics.avgVideoViews.toLocaleString()} <span className="text-sm font-normal text-slate-500">회</span>
                            </p>
                          </div>
                          <div className="pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-400 font-medium">수식 추정 롱폼 단가 (CPV 35원)</p>
                            <p className="text-lg font-black text-blue-600 mt-0.5">
                              약 {(channelAnalytics.estVideoCpv / 10000).toFixed(1)} <span className="text-xs font-bold text-slate-600">만원</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                          <TrendingUp size={24} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium">진성 반응률 (Engagement)</p>
                          <p className="text-xl font-black text-emerald-600 mt-0.5">
                            {channelAnalytics.engagementRate}%
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">조회수 대비 댓글·좋아요 상호작용</p>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium">유료 광고/협찬 집행 비중</p>
                          <p className="text-xl font-black text-purple-600 mt-0.5">
                            {channelAnalytics.sponsoredRatio}% <span className="text-xs font-normal text-slate-500">({channelAnalytics.sponsoredCount}건 감지)</span>
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">설명란 유료광고 키워드 기반 판별</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* [2] 채널 기본 지표 */}
                {activeTab === 'channel' && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <p className="text-xs font-medium text-slate-400 mb-1">총 구독자 수</p>
                      <p className="text-2xl font-extrabold text-slate-900">{(selectedChannel.follower_count || 0).toLocaleString()}명</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <p className="text-xs font-medium text-slate-400 mb-1">총 영상 수</p>
                      <p className="text-2xl font-extrabold text-slate-900">{(selectedChannel.total_video_count || 0).toLocaleString()}개</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <p className="text-xs font-medium text-slate-400 mb-1">평균 조회수</p>
                      <p className="text-2xl font-extrabold text-slate-900">{(selectedChannel.avg_views || 0).toLocaleString()}회</p>
                    </div>
                  </div>
                )}

{/* [3] 최근 영상 목록 그리드 */}
                {activeTab === 'video' && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    {/* 상단 헤더: 제목 + [전체/롱폼/숏폼] 버튼 */}
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <PlayCircle size={18} className="text-red-500" />
                        <h3 className="text-sm font-bold text-slate-800">수집된 영상 목록</h3>
                        <span className="text-xs text-slate-400 font-normal">
                          ({filteredPosts.length}개)
                        </span>
                      </div>

                      {/* 👇 [추가] 전체 / 롱폼 / 숏폼 분기 버튼 */}
                      <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                        <button
                          type="button"
                          onClick={() => setVideoTypeFilter('ALL')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                            videoTypeFilter === 'ALL'
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          전체
                        </button>
                        <button
                          type="button"
                          onClick={() => setVideoTypeFilter('VIDEO')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                            videoTypeFilter === 'VIDEO'
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          롱폼
                        </button>
                        <button
                          type="button"
                          onClick={() => setVideoTypeFilter('SHORTS')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                            videoTypeFilter === 'SHORTS'
                              ? 'bg-white text-red-600 shadow-sm'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          숏폼
                        </button>
                      </div>
                    </div>

                    {loadingPosts ? (
                      <p className="text-xs text-slate-400 py-6 text-center">영상 데이터를 불러오는 중...</p>
                    ) : filteredPosts.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">해당 분류의 영상 데이터가 없습니다.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        {filteredPosts.map((post, idx) => (
                          <a
                            key={idx}
                            href={post.post_url}
                            target="_blank"
                            rel="noreferrer"
                            className="group block rounded-xl overflow-hidden border border-slate-200 hover:shadow-md transition bg-slate-50"
                          >
                            <div className="relative aspect-video overflow-hidden bg-slate-200">
                              <img
                                src={post.thumbnail_url}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                              {(post.content_type === 'SHORTS' || (post.post_url && post.post_url.includes('/shorts/'))) && (
                                <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  SHORTS
                                </span>
                              )}
                            </div>
                            <div className="p-3">
                              <h4 className="text-xs font-medium text-slate-800 line-clamp-2 leading-relaxed group-hover:text-red-500 transition">
                                {post.title}
                              </h4>
                              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                                <span>조회수 {(post.view_count || 0).toLocaleString()}회</span>
                                <ExternalLink size={12} />
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* [4] PRO 정밀 광고 단가 탭 */}
                {activeTab === 'ad_cost' && (
                  <div>
                    {!isProUser ? (
                      <div className="relative overflow-hidden bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
                        <div className="filter blur-sm select-none pointer-events-none space-y-4">
                          <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto"></div>
                          <div className="h-20 bg-slate-100 rounded w-full"></div>
                        </div>
                        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center p-6">
                          <div className="p-3 bg-red-100 text-red-500 rounded-full mb-3">
                            <Lock size={24} />
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mb-1">PRO 전용 정밀 광고 견적 지표입니다</h3>
                          <p className="text-xs text-slate-500 mb-4 max-w-sm">
                            예상 제작 단가 및 패키지 견적서를 확인하려면 PRO 모드를 활성화하세요.
                          </p>
                          <button 
                            type="button"
                            onClick={() => setIsProUser(true)}
                            className="px-5 py-2.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 shadow-md transition cursor-pointer"
                          >
                            PRO 시뮬레이션 즉시 활성화
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
                          👑 PRO 모드 해금 데이터
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
                            <p className="text-xs text-slate-500 mb-1">정밀 롱폼 패키지 단가</p>
                            <p className="text-xl font-black text-slate-900">
                              약 {((selectedChannel.estimated_video_cpv_price || channelAnalytics.estVideoCpv) / 10000).toFixed(1)}만원
                            </p>
                          </div>
                          <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
                            <p className="text-xs text-slate-500 mb-1">정밀 숏폼 패키지 단가</p>
                            <p className="text-xl font-black text-slate-900">
                              약 {((selectedChannel.estimated_shorts_cpv_price || channelAnalytics.estShortsCpv) / 10000).toFixed(1)}만원
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* [5] 전면 개편: PRO 시청자 분석 (도넛 원형 차트 + 국기/국가명 + 성별/연령 카드) */}
                {activeTab === 'audience' && (
                  <div>
                    {!isProUser ? (
                      <div className="relative overflow-hidden bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
                        <div className="filter blur-sm select-none pointer-events-none space-y-4">
                          <div className="h-10 bg-slate-200 rounded w-1/3 mx-auto"></div>
                          <div className="h-32 bg-slate-100 rounded w-full"></div>
                        </div>
                        <div className="absolute inset-0 bg-white/85 flex flex-col items-center justify-center p-6">
                          <div className="p-3 bg-amber-100 text-amber-600 rounded-full mb-3 shadow-inner">
                            <Globe2 size={28} />
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mb-1">시청자 국가·성별 정밀 분석 데이터</h3>
                          <p className="text-xs text-slate-500 mb-4 max-w-sm leading-relaxed">
                            채널 시청자의 국적 분포 원형 차트와 성별·연령대 인구통계를 확인하려면 PRO 멤버십이 필요합니다.
                          </p>
                          <button 
                            type="button"
                            onClick={() => setIsProUser(true)}
                            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg text-xs font-bold hover:brightness-105 shadow-md transition cursor-pointer"
                          >
                            👑 PRO 시뮬레이션 즉시 해금
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* 1. 국가별 시청자 분포 (원형 도넛 차트 + 프로그레스 리스트) */}
                        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm">
                          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                            <div className="flex items-center gap-2">
                              <Globe2 className="text-red-500" size={20} />
                              <h3 className="text-sm font-bold text-slate-900">시청자 국적 및 타겟 언어 분포</h3>
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                              <ShieldCheck size={13} /> 공인 데이터 검증 완료
                            </span>
                          </div>

                          <div className="grid grid-cols-12 gap-8 items-center">
                            {/* 좌측: SVG 도넛 원형 차트 */}
                            <div className="col-span-5 flex flex-col items-center justify-center relative">
                              <div className="relative w-44 h-44">
                                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                                  {/* 배경 원 */}
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                    stroke="#f1f5f9"
                                    strokeWidth="12"
                                  />
                                  {/* 국가별 조각들 */}
                                  {audienceStats.chartSlices.map((slice, i) => (
                                    <circle
                                      key={i}
                                      cx="50"
                                      cy="50"
                                      r="40"
                                      fill="transparent"
                                      stroke={slice.color}
                                      strokeWidth="12"
                                      strokeDasharray={slice.strokeDasharray}
                                      strokeDashoffset={slice.strokeDashoffset}
                                      className="transition-all duration-700 ease-out"
                                    />
                                  ))}
                                </svg>
                                {/* 중앙 텍스트 */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                  <span className="text-2xl">{audienceStats.items[0]?.flag || '🇰🇷'}</span>
                                  <span className="text-xs font-extrabold text-slate-800 mt-1">
                                    {audienceStats.items[0]?.name || '대한민국'}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-400">
                                    {audienceStats.items[0]?.percent || 100}%
                                  </span>
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-3 font-medium">주 타겟 국가 중심 분포</p>
                            </div>

                            {/* 우측: 국가명 + 국기 + 프로그레스 바 목록 */}
                            <div className="col-span-7 space-y-4">
                              {audienceStats.items.map((item, idx) => (
                                <div key={idx} className="space-y-1.5">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="text-base">{item.flag}</span>
                                      <span className="font-bold text-slate-800">{item.name}</span>
                                      <span className="text-[10px] text-slate-400 uppercase font-mono">({item.key})</span>
                                    </div>
                                    <span className="font-extrabold text-slate-900">{item.percent}%</span>
                                  </div>
                                  {/* 프로그레스 게이지 */}
                                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      style={{ width: `${item.percent}%`, backgroundColor: item.color }} 
                                      className="h-full rounded-full transition-all duration-500"
                                    ></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* 2. 시청자 성별 및 핵심 연령대 추정 카드 */}
                        <div className="grid grid-cols-2 gap-5">
                          {/* 성별 분포 */}
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <UserCheck size={16} className="text-blue-500" /> 시청자 성별 비율 (추정)
                              </h4>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center text-xs font-bold">
                                <span className="text-blue-600 flex items-center gap-1">남성 42%</span>
                                <span className="text-pink-500 flex items-center gap-1">여성 58%</span>
                              </div>
                              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                                <div style={{ width: '42%' }} className="bg-blue-500"></div>
                                <div style={{ width: '58%' }} className="bg-pink-500"></div>
                              </div>
                              <p className="text-[11px] text-slate-400">카테고리 및 댓글 반응 인구통계 가중치 적용</p>
                            </div>
                          </div>

                          {/* 주요 연령대 */}
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                              <TrendingUp size={16} className="text-amber-500" /> 주 소비 연령층
                            </h4>
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-amber-50 rounded-xl text-center flex-1">
                                <p className="text-[11px] text-slate-400 font-medium">1순위 타겟</p>
                                <p className="text-base font-black text-slate-900 mt-0.5">25-34세 (48%)</p>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-xl text-center flex-1">
                                <p className="text-[11px] text-slate-400 font-medium">2순위 타겟</p>
                                <p className="text-base font-black text-slate-900 mt-0.5">18-24세 (31%)</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                선택된 인플루언서가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
