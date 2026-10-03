'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Lock, Mail, ExternalLink, Tag, ArrowUpDown, 
  Users, Eye, TrendingUp, DollarSign, Award, BarChart3, 
  Globe, Film, Sparkles, FileText,
  Target, Zap, Flame, Activity, PieChart
} from 'lucide-react';

interface Influencer {
  channel_id: string;
  name?: string;
  handle?: string;
  profile_url?: string;
  profile_img_url?: string;
  follower_count?: number;
  total_video_count?: number;
  avg_views?: number;
  engagement_rate?: number;
  estimated_video_cpv_price?: number;
  estimated_shorts_cpv_price?: number;
  contact_email?: string | null;
  tags?: string[];
}

interface Post {
  video_id?: string;
  channel_id?: string;
  title?: string;
  post_url?: string;
  thumbnail_url?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  published_at?: string;
}

const YOUTUBE_TAGS = ['전체', '맛집', '먹방', '여행', 'Vlog', 'IT', '뷰티', '패션', '게임', '경제'];
type SubscriberRange = 'all' | 'under10k' | '10k_100k' | '100k_500k' | 'over500k';
type YoutubeSortOption = 'follower_desc' | 'views_desc' | 'engagement_desc';

export default function YoutubeDashboardPage() {
  const [isProUser, setIsProUser] = useState(false);
  const [search, setSearch] = useState('');
  const [ytTag, setYtTag] = useState('전체');
  const [subRange, setSubRange] = useState<SubscriberRange>('all');
  const [ytSort, setYtSort] = useState<YoutubeSortOption>('follower_desc');
  
  const [activeTab, setActiveTab] = useState<'basic' | 'audience' | 'revenue' | 'ad_price'>('basic');

  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Influencer | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadChannels = async () => {
      try {
        const { data, error } = await supabase
          .from('influencers')
          .select('*')
          .order('follower_count', { ascending: false })
          .limit(1000);

        if (!error && data && data.length > 0 && isMounted) {
          setInfluencers(data as Influencer[]);
          setSelectedChannel(data[0] as Influencer);
        }
      } catch (err) {
        console.error('채널 로드 에러:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadChannels();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedChannel || !selectedChannel.channel_id) return;
    let isMounted = true;

    const loadPosts = async () => {
      try {
        let cleanId = selectedChannel.channel_id || '';
        if (cleanId.includes('/')) {
          const parts = cleanId.split('/');
          cleanId = parts[parts.length - 1];
        }
        const { data } = await supabase
          .from('influencer_posts')
          .select('*')
          .or(`channel_id.eq.${cleanId},channel_id.eq.${selectedChannel.channel_id}`)
          .limit(20);

        if (data && isMounted) {
          setPosts(data as Post[]);
        }
      } catch (err) {
        console.error('포스트 로드 에러:', err);
      }
    };
    loadPosts();
    return () => { isMounted = false; };
  }, [selectedChannel]);

  // 키워드 토큰화 및 유연한 연관 검색 로직
  const filteredInfluencers = useMemo(() => {
    const rawQ = (search || '').trim().toLowerCase();
    const keywords = rawQ.split(/\s+/).filter(Boolean);

    const list = influencers.filter((item) => {
      if (!item) return false;
      
      const nameRaw = (item.name || '').toLowerCase();
      const handleRaw = (item.handle || item.channel_id || '').toLowerCase();
      const tagsArr = Array.isArray(item.tags) ? item.tags.map(t => (t || '').toLowerCase()) : [];

      if (keywords.length === 0) {
        const matchesTabTag = ytTag === '전체' || 
          tagsArr.some(t => t.includes(ytTag.toLowerCase())) ||
          nameRaw.includes(ytTag.toLowerCase());

        const count = Number(item.follower_count || 0);
        let matchesRange = true;
        if (subRange === 'under10k') matchesRange = count < 10000;
        else if (subRange === '10k_100k') matchesRange = count >= 10000 && count < 100000;
        else if (subRange === '100k_500k') matchesRange = count >= 100000 && count < 500000;
        else if (subRange === 'over500k') matchesRange = count >= 500000;

        return matchesTabTag && matchesRange;
      }

      const matchesChannel = keywords.some(kw => 
        nameRaw.includes(kw) || 
        handleRaw.includes(kw) || 
        tagsArr.some(t => t.includes(kw))
      );

      const matchesPosts = posts.some(p => {
        if (p.channel_id !== item.channel_id) return false;
        const pTitle = (p.title || '').toLowerCase();
        return keywords.some(kw => pTitle.includes(kw));
      });

      const isSearchMatched = matchesChannel || matchesPosts;

      const matchesTabTag = ytTag === '전체' || 
        tagsArr.some(t => t.includes(ytTag.toLowerCase())) ||
        nameRaw.includes(ytTag.toLowerCase());

      const count = Number(item.follower_count || 0);
      let matchesRange = true;
      if (subRange === 'under10k') matchesRange = count < 10000;
      else if (subRange === '10k_100k') matchesRange = count >= 10000 && count < 100000;
      else if (subRange === '100k_500k') matchesRange = count >= 100000 && count < 500000;
      else if (subRange === 'over500k') matchesRange = count >= 500000;

      return isSearchMatched && matchesTabTag && matchesRange;
    });

    if (isProUser) {
      return [...list].sort((a, b) => {
        const aFollowers = Number(a?.follower_count) || 0;
        const bFollowers = Number(b?.follower_count) || 0;
        const aViews = Number(a?.avg_views) || 0;
        const bViews = Number(b?.avg_views) || 0;
        const aEng = Number(a?.engagement_rate) || 0;
        const bEng = Number(b?.engagement_rate) || 0;

        if (ytSort === 'follower_desc') return bFollowers - aFollowers;
        if (ytSort === 'views_desc') return bViews - aViews;
        if (ytSort === 'engagement_desc') return bEng - aEng;
        return 0;
      });
    }

    return list.slice(0, 15);
  }, [influencers, posts, search, ytTag, subRange, ytSort, isProUser]);

  const ytAnalytics = useMemo(() => {
    const subs = Number(selectedChannel?.follower_count) || 1;
    const views = Number(selectedChannel?.avg_views) || Math.max(1000, Math.round(subs * 0.15));
    const eng = Number(selectedChannel?.engagement_rate) || 3.8;

    const estLongform = Number(selectedChannel?.estimated_video_cpv_price) || 
      Math.max(300000, Math.round((views * 28) / 10000) * 10000);
    const estShorts = Number(selectedChannel?.estimated_shorts_cpv_price) || 
      Math.max(150000, Math.round((estLongform * 0.42) / 10000) * 10000);
    const estPpl = Math.round((estLongform * 0.6) / 10000) * 10000;

    const baseMonthlyAd = Math.round((views * 4 * 2.2) / 10000) * 10000;
    const monthlyTrend = [
      { month: '5월 전', rev: Math.round(baseMonthlyAd * 0.82) },
      { month: '4월 전', rev: Math.round(baseMonthlyAd * 0.88) },
      { month: '3월 전', rev: Math.round(baseMonthlyAd * 0.94) },
      { month: '2월 전', rev: Math.round(baseMonthlyAd * 1.05) },
      { month: '지난달', rev: Math.round(baseMonthlyAd * 1.12) },
      { month: '이번달(예상)', rev: baseMonthlyAd }
    ];
    const maxMonthlyRev = Math.max(...monthlyTrend.map(m => m.rev), 10000);

    const postList = Array.isArray(posts) ? posts : [];
    const barData = postList.slice(0, 8).map((p, idx) => ({
      index: idx + 1,
      title: p.title || `영상 #${idx + 1}`,
      views: Number(p?.view_count) || Math.round(views * (0.8 + idx * 0.05)),
      likes: Number(p?.like_count) || Math.round(views * 0.04),
    }));
    const maxBarValue = Math.max(...barData.map(b => b.views), 1000);
    const reachPower = Number(((views / subs) * 100).toFixed(1));

    return {
      estLongform,
      estShorts,
      estPpl,
      baseMonthlyAd,
      monthlyTrend,
      maxMonthlyRev,
      barData,
      maxBarValue,
      reachPower: isNaN(reachPower) ? 18.5 : reachPower,
      score: Math.min(99, Math.max(65, Math.round(75 + (eng > 4.5 ? 12 : 5) + (views / subs > 0.2 ? 10 : 3)))),
      cpaGrade: eng > 4.5 ? 'S등급 (고관여 팬덤)' : eng > 2.5 ? 'A등급 (브랜딩 최적)' : 'B등급 (단순 노출용)'
    };
  }, [selectedChannel, posts]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        유튜브 인플루언서 빅데이터를 분석하는 중입니다...
      </div>
    );
  }

  return (
    <>
      <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between flex-shrink-0 z-10">
        <div className="relative w-96 flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          <input 
            type="text" 
            placeholder="키워드 검색 (예: 해외여행 준비물, 브이로그)..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-full text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">✕</button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setIsProUser(!isProUser)}
            className={`text-xs font-bold text-white px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              isProUser ? 'bg-gradient-to-r from-red-600 to-rose-500' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            <Lock size={12} /> {isProUser ? '👑 PRO 플랜 활성화됨' : '🔒 PRO 업그레이드'}
          </button>
        </div>
      </header>

      <div>
        <div className="bg-white border-b border-slate-200 px-8 py-2.5 flex items-center gap-2 overflow-x-auto flex-shrink-0">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 flex-shrink-0">
            <Tag size={13} /> 태그:
          </span>
          {YOUTUBE_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setYtTag(t)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                ytTag === t ? 'bg-red-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/3 border-r border-slate-200 overflow-y-auto bg-white flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <span className="text-xs font-bold text-slate-500">
                유튜브 채널 ({filteredInfluencers.length}개 {isProUser ? '전체' : '샘플'})
              </span>
              {!isProUser && (
                <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded">
                  🔒 PRO 전용 1,000+개
                </span>
              )}
            </div>

            {filteredInfluencers.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">일치하는 유튜버가 없습니다.</div>
            ) : (
              filteredInfluencers.map((channel) => (
                <div 
                  key={channel.channel_id}
                  onClick={() => setSelectedChannel(channel)}
                  className={`p-4 border-b border-slate-100 flex items-center gap-3 cursor-pointer transition ${
                    selectedChannel?.channel_id === channel.channel_id ? 'bg-red-50/70 border-l-4 border-l-red-500' : 'hover:bg-slate-50'
                  }`}
                >
                  <img 
                    src={channel.profile_img_url || 'https://via.placeholder.com/150'} 
                    alt={channel.name || '채널'} 
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full border border-slate-200 object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{channel.name || '유튜브 크리에이터'}</h4>
                      <span className="text-[9px] px-1.5 py-0.2 bg-red-100 text-red-600 font-bold rounded">YOUTUBER</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">@{channel.handle || channel.channel_id}</p>
                    
                    <div className="flex items-center gap-2 mt-2 text-[11px]">
                      <span className="font-semibold text-slate-700">
                        구독자 {Number(channel.follower_count || 0).toLocaleString()}명
                      </span>
                      {isProUser ? (
                        <span className="text-slate-400">
                          • 평균조회 {Number(channel.avg_views || 0).toLocaleString()}회
                        </span>
                      ) : (
                        <span className="text-slate-300 flex items-center gap-0.5">
                          • 평균조회 <Lock size={10} className="text-amber-500" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-[#f8f9fa]">
          {selectedChannel ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between">
                <div className="flex gap-4">
                  <img 
                    src={selectedChannel.profile_img_url || 'https://via.placeholder.com/150'} 
                    alt={selectedChannel.name || '프로필'} 
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-full border border-slate-200 object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">{selectedChannel.name}</h2>
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded font-bold">공식 인증 크리에이터</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-0.5">@{selectedChannel.handle || selectedChannel.channel_id}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(selectedChannel.tags || ['크리에이터']).map((t, idx) => (
                        <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">#{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedChannel.contact_email ? (
                  <a 
                    href={`mailto:${selectedChannel.contact_email}`}
                    className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-xs cursor-pointer"
                  >
                    <Mail size={14} /> 제휴 문의
                  </a>
                ) : (
                  <a 
                    href={selectedChannel.profile_url || `https://youtube.com/${selectedChannel.handle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition shadow-xs cursor-pointer"
                  >
                    <ExternalLink size={14} /> 채널 바로가기
                  </a>
                )}
              </div>

              <div className="flex gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'basic' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText size={14} className="inline mr-1" /> 기본정보
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('audience')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'audience' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Globe size={14} className="inline mr-1" /> 시청자분석 {!isProUser && <span className="bg-amber-400 text-slate-900 text-[10px] px-1 rounded ml-1 font-black">PRO</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('revenue')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'revenue' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <DollarSign size={14} className="inline mr-1" /> 수익분석 {!isProUser && <span className="bg-amber-400 text-slate-900 text-[10px] px-1 rounded ml-1 font-black">PRO</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ad_price')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'ad_price' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Target size={14} className="inline mr-1" /> 광고단가분석 {!isProUser && <span className="bg-amber-400 text-slate-900 text-[10px] px-1 rounded ml-1 font-black">PRO</span>}
                </button>
              </div>

              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <p className="text-xs font-medium text-slate-400 mb-1">총 구독자 수</p>
                      <p className="text-2xl font-black text-slate-900">{Number(selectedChannel.follower_count || 0).toLocaleString()}명</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
                      <p className="text-xs font-medium text-slate-400 mb-1">영상당 평균 조회수</p>
                      {isProUser ? (
                        <p className="text-2xl font-black text-red-500">{Number(selectedChannel.avg_views || 0).toLocaleString()}회</p>
                      ) : (
                        <div>
                          <p className="text-2xl font-black text-slate-300 blur-[4px] select-none">384,120회</p>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1 mt-1 w-fit">
                            <Lock size={10} /> PRO 전용
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
                      <p className="text-xs font-medium text-slate-400 mb-1">시청자 참여율</p>
                      {isProUser ? (
                        <p className="text-2xl font-black text-purple-600">{Number(selectedChannel.engagement_rate || 3.8)}%</p>
                      ) : (
                        <div>
                          <p className="text-2xl font-black text-slate-300 blur-[4px] select-none">4.82%</p>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1 mt-1 w-fit">
                            <Lock size={10} /> PRO 전용
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <p className="text-xs font-medium text-slate-400 mb-1">총 누적 영상 수</p>
                      <p className="text-2xl font-black text-slate-900">{Number(selectedChannel.total_video_count || posts.length || 120).toLocaleString()}개</p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-red-500 text-lg">🎬</span>
                        <h3 className="text-sm font-bold text-slate-800">최근 발행 영상 콘텐츠</h3>
                        <span className="text-xs text-slate-400 font-normal">({posts.length}개)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {(isProUser ? posts : posts.slice(0, 4)).map((video, idx) => (
                        <a
                          key={idx}
                          href={video.post_url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="group block p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition bg-slate-50/50"
                        >
                          <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-200 relative mb-2">
                            <img 
                              src={video.thumbnail_url || 'https://via.placeholder.com/300x200?text=YouTube+Video'} 
                              alt={video.title || '영상'} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-red-500 transition line-clamp-2">
                            {video.title || '영상 제목'}
                          </h4>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-1.5 border-t border-slate-100">
                            {isProUser ? (
                              <>
                                <span>조회수 {Number(video.view_count || 0).toLocaleString()}회</span>
                                <span>좋아요 {Number(video.like_count || 0).toLocaleString()}</span>
                              </>
                            ) : (
                              <>
                                <span className="blur-[3px] select-none text-slate-300">조회수 128,400회</span>
                                <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5"><Lock size={10} /> PRO 전용</span>
                              </>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'audience' && (
                <div className="space-y-6">
                  {!isProUser ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center py-20">
                      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
                        <Globe size={32} />
                      </div>
                      <h3 className="text-lg font-black text-slate-900">시청자 인구통계 및 타깃 도달 분석은 PRO 전용입니다</h3>
                      <button
                        type="button"
                        onClick={() => setIsProUser(true)}
                        className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                      >
                        <Sparkles size={14} className="inline mr-1" /> PRO 모드로 시청자 빅데이터 열람하기
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-6">
                      <div className="col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                          <Globe className="text-blue-600" size={15} /> 주요 시청 국가 비중
                        </h4>
                        <div className="py-4 flex flex-col items-center justify-center relative">
                          <div className="w-32 h-32 rounded-full border-[10px] border-indigo-400 border-t-blue-600 flex items-center justify-center shadow-inner">
                            <span className="text-xl font-black text-slate-900">84.2%</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <TrendingUp className="text-blue-600" size={15} /> 알고리즘 도달 지수 (Reach Level)
                        </h4>
                        <p className="text-2xl font-black text-blue-600 mt-2">{ytAnalytics.reachPower}%</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'revenue' && (
                <div className="space-y-6">
                  {!isProUser ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center py-20">
                      <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 text-amber-600">
                        <DollarSign size={32} />
                      </div>
                      <h3 className="text-lg font-black text-slate-900">예상 매출 및 채널 밸류에이션은 PRO 전용입니다</h3>
                      <button
                        type="button"
                        onClick={() => setIsProUser(true)}
                        className="mt-6 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                      >
                        <Sparkles size={14} className="inline mr-1" /> PRO 모드로 수익 모델 열람하기
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white p-5 rounded-2xl border-2 border-amber-100 shadow-2xs">
                        <span className="text-[11px] font-bold text-amber-600">월간 예상 애드센스 매출</span>
                        <p className="text-3xl font-black text-slate-900 mt-2">{Number(ytAnalytics.baseMonthlyAd).toLocaleString()}원</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'ad_price' && (
                <div className="space-y-6">
                  {!isProUser ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center py-20">
                      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4 text-red-600">
                        <Lock size={32} />
                      </div>
                      <h3 className="text-lg font-black text-slate-900">브랜디드 PPL 단가 및 마케팅 정밀 진단표는 PRO 전용입니다</h3>
                      <button
                        type="button"
                        onClick={() => setIsProUser(true)}
                        className="mt-6 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                      >
                        <Sparkles size={14} className="inline mr-1" /> PRO 모드로 분석 즉시 열람하기
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white p-5 rounded-2xl border-2 border-red-100 shadow-2xs">
                        <span className="text-[11px] font-bold text-red-500">브랜디드 영상 단가</span>
                        <p className="text-3xl font-black text-slate-900 mt-2">{Number(ytAnalytics.estLongform).toLocaleString()}원</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">
              선택된 채널이 없습니다.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
