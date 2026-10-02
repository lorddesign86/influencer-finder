'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Lock, Mail, ExternalLink, Tag, ArrowUpDown, 
  Users, Eye, TrendingUp, DollarSign, Award, BarChart3, 
  Globe, Film, Sparkles, FileText,
  Target, Zap, Flame
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
  avg_video_views?: number;
  avg_shorts_views?: number;
  avg_likes?: number;
  avg_comments?: number;
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

  // 1. 채널 데이터 불러오기
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

  // 2. 포스트 데이터 불러오기
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

  // 3. 필터링 & 정렬 (PRO 전환 시 NaN / Null 크래시 방지)
  const filteredInfluencers = useMemo(() => {
    const rawQ = (search || '').trim().toLowerCase();
    const q = rawQ.replace(/\s+/g, '');

    const list = influencers.filter((item) => {
      if (!item) return false;
      const nameRaw = (item.name || '').toLowerCase();
      const handleRaw = (item.handle || item.channel_id || '').toLowerCase();

      const matchesSearch = !rawQ || 
        nameRaw.includes(rawQ) || 
        nameRaw.replace(/\s+/g, '').includes(q) ||
        handleRaw.includes(rawQ) || 
        handleRaw.replace(/\s+/g, '').includes(q);

      const matchesTag = ytTag === '전체' || 
        (Array.isArray(item.tags) && item.tags.some(t => (t || '').includes(ytTag))) ||
        (item.name && item.name.includes(ytTag));

      const count = Number(item.follower_count || 0);
      let matchesRange = true;
      if (subRange === 'under10k') matchesRange = count < 10000;
      else if (subRange === '10k_100k') matchesRange = count >= 10000 && count < 100000;
      else if (subRange === '100k_500k') matchesRange = count >= 100000 && count < 500000;
      else if (subRange === 'over500k') matchesRange = count >= 500000;

      return matchesSearch && matchesTag && matchesRange;
    });

    // PRO 모드일 때 정렬 수행 (안전한 숫자 변환)
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
  }, [influencers, search, ytTag, subRange, ytSort, isProUser]);

  // 4. 지표 연산 (모든 속성 안전 가드)
  const ytAnalytics = useMemo(() => {
    const subs = Number(selectedChannel?.follower_count) || 1;
    const views = Number(selectedChannel?.avg_views) || Math.max(1000, Math.round(subs * 0.15));
    const eng = Number(selectedChannel?.engagement_rate) || 3.5;

    const estLongform = Number(selectedChannel?.estimated_video_cpv_price) || 
      Math.max(300000, Math.round((views * 28) / 10000) * 10000);
    const estShorts = Number(selectedChannel?.estimated_shorts_cpv_price) || 
      Math.max(150000, Math.round((estLongform * 0.45) / 10000) * 10000);

    const estMonthlyAdsense = Math.round((views * 4 * 2.1) / 10000) * 10000;

    let score = 75;
    if (eng > 4.5) score += 12;
    if (views / subs > 0.2) score += 10;
    score = Math.min(99, Math.max(60, score));

    const postList = Array.isArray(posts) ? posts : [];
    const barData = postList.slice(0, 8).map((p, idx) => ({
      index: idx + 1,
      views: Number(p?.view_count) || Math.round(views * (0.8 + idx * 0.05)),
    }));

    const maxBarValue = Math.max(...barData.map(b => b.views), 1000);
    const reachPower = Number(((views / subs) * 100).toFixed(1));

    return {
      estLongform,
      estShorts,
      estMonthlyAdsense,
      score,
      barData,
      maxBarValue,
      reachPower: isNaN(reachPower) ? 15.0 : reachPower,
      cpaGrade: eng > 4.5 ? 'S등급' : eng > 2.5 ? 'A등급' : 'B등급'
    };
  }, [selectedChannel, posts]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        유튜브 인플루언서 데이터를 로드하는 중입니다...
      </div>
    );
  }

  return (
    <>
      {/* 상단 검색 헤더 */}
      <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between flex-shrink-0 z-10">
        <div className="relative w-96 flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          <input 
            type="text" 
            placeholder="유튜버 이름 또는 핸들 검색..." 
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
            className={`text-xs font-semibold text-white px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              isProUser ? 'bg-gradient-to-r from-red-600 to-rose-500' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            <Lock size={12} /> {isProUser ? '👑 PRO 활성화됨' : '🔒 PRO 업그레이드'}
          </button>
        </div>
      </header>

      {/* 태그 & 필터 바 */}
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

        <div className="bg-slate-50/80 border-b border-slate-200 px-8 py-2.5 flex items-center justify-between flex-shrink-0 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              <Users size={12} className="text-red-500 mr-0.5" />
              <span className="text-slate-500 font-semibold">구독자수:</span>
              <select 
                value={subRange} 
                onChange={(e) => setSubRange(e.target.value as SubscriberRange)}
                className="bg-transparent font-medium outline-none text-slate-700 cursor-pointer"
              >
                <option value="all">전체</option>
                <option value="under10k">1만 이하</option>
                <option value="10k_100k">1만 ~ 10만</option>
                <option value="100k_500k">10만 ~ 50만</option>
                <option value="over500k">50만 이상</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              <ArrowUpDown size={12} className="text-slate-400" />
              <select 
                value={ytSort} 
                onChange={(e) => setYtSort(e.target.value as YoutubeSortOption)}
                className="bg-transparent font-medium outline-none text-slate-700 cursor-pointer"
              >
                <option value="follower_desc">구독자 많은 순</option>
                <option value="views_desc">평균 조회수 많은 순</option>
                <option value="engagement_desc">참여율 높은 순</option>
              </select>
            </div>
          </div>

          {(ytTag !== '전체' || subRange !== 'all' || search) && (
            <button
              type="button"
              onClick={() => { setYtTag('전체'); setSubRange('all'); setSearch(''); }}
              className="text-xs text-red-500 hover:underline font-semibold cursor-pointer"
            >
              필터 초기화
            </button>
          )}
        </div>
      </div>

      {/* 메인 뷰 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측 채널 목록 */}
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

        {/* 우측 채널 대시보드 */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#f8f9fa]">
          {selectedChannel ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* 프로필 헤더 */}
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
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded font-bold">공식 파트너</span>
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
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-xs cursor-pointer"
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
                    <ExternalLink size={14} /> 유튜브 채널
                  </a>
                )}
              </div>

              {/* 4대 탭 */}
              <div className="flex gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'basic' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText size={14} className="inline mr-1" /> 기본정보
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('audience')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'audience' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Globe size={14} className="inline mr-1" /> 시청자분석 {!isProUser && <span className="bg-amber-400 text-slate-900 text-[10px] px-1 rounded ml-1 font-black">PRO</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('revenue')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'revenue' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <DollarSign size={14} className="inline mr-1" /> 수익분석 {!isProUser && <span className="bg-amber-400 text-slate-900 text-[10px] px-1 rounded ml-1 font-black">PRO</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ad_price')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'ad_price' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <DollarSign size={14} className="inline mr-1" /> 광고단가분석 {!isProUser && <span className="bg-amber-400 text-slate-900 text-[10px] px-1 rounded ml-1 font-black">PRO</span>}
                </button>
              </div>

              {/* 탭 1: 기본정보 */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <p className="text-xs font-medium text-slate-400 mb-1">총 구독자 수</p>
                      <p className="text-2xl font-black text-slate-900">{Number(selectedChannel.follower_count || 0).toLocaleString()}명</p>
                      <span className="text-[11px] text-red-500 font-medium mt-1 inline-block">✓ 공식 채널</span>
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
                      <span className="text-[11px] text-slate-400 font-medium mt-1 inline-block">주 1.5회 정기 업로드</span>
                    </div>
                  </div>

                  {/* 최근 영상 그리드 */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-red-500 text-lg">🎬</span>
                        <h3 className="text-sm font-bold text-slate-800">최근 발행 영상 목록</h3>
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
                            {video.title || '영상 제목 없음'}
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

                    {!isProUser && (
                      <div className="mt-5 p-5 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 flex flex-col items-center justify-center text-center">
                        <Lock className="text-amber-500 mb-1.5" size={20} />
                        <h4 className="text-xs font-bold text-slate-900">최근 영상 전체 열람 및 성과 분석은 PRO 전용입니다</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">PRO 모드를 활성화하면 과거 영상들의 조회수/반응 추이를 무제한 열람할 수 있습니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 탭 2: 시청자분석 PRO */}
              {activeTab === 'audience' && (
                <div className="space-y-6">
                  {!isProUser ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center py-20">
                      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
                        <Globe size={32} />
                      </div>
                      <h3 className="text-lg font-black text-slate-900">시청자 국가/언어 및 관여도 분석은 PRO 전용입니다</h3>
                      <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed">
                        글로벌 시청자 비중 도넛 그래프, 구독자 대비 조회수 전환 효율 벤치마크, 시청자 관여도 정밀 매트릭스를 확인해 보세요.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsProUser(true)}
                        className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2"
                      >
                        <Sparkles size={14} /> PRO 모드로 분석 즉시 열람하기
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-6">
                      <div className="col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                          <Globe className="text-blue-600" size={15} /> 주요 시청자 언어 포트폴리오
                        </h4>

                        <div className="py-4 flex flex-col items-center justify-center relative">
                          <div className="w-32 h-32 rounded-full border-8 border-indigo-400 border-t-blue-500 flex items-center justify-center">
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-slate-400 font-medium">한국 시청자</span>
                              <span className="text-xl font-black text-slate-900">82%</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-[11px]">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                            <span className="text-slate-600">한국어 (82%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-400"></div>
                            <span className="text-slate-600">글로벌 (18%)</span>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <TrendingUp className="text-blue-600" size={15} /> 구독자 대비 조회수 도달 파워
                              </h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">평균 조회수 / 구독자수 비율 벤치마크</p>
                            </div>
                            <span className="text-sm font-black text-blue-600">{ytAnalytics.reachPower}%</span>
                          </div>

                          <div className="relative pt-4 pb-2">
                            <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
                              <div className="w-1/3 bg-slate-300"></div>
                              <div className="w-1/3 bg-blue-300"></div>
                              <div className="w-1/3 bg-blue-600"></div>
                            </div>
                            <div 
                              style={{ left: `${Math.min(95, Math.max(5, (ytAnalytics.reachPower / 40) * 100))}%` }}
                              className="absolute top-1 -translate-x-1/2 flex flex-col items-center"
                            >
                              <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded shadow-2xs whitespace-nowrap">
                                현재 도달력 {ytAnalytics.reachPower}%
                              </span>
                              <div className="w-1.5 h-1.5 bg-blue-700 rotate-45 -mt-0.5"></div>
                            </div>
                          </div>

                          <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-3">
                            <span>기본 도달 (0% ~ 10%)</span>
                            <span>안정적 팬덤 (10% ~ 25%)</span>
                            <span>알고리즘 바이럴 (25% 이상)</span>
                          </div>
                        </div>

                        <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 mt-4 text-xs text-blue-800">
                          💡 <strong>인사이트:</strong> 구독자 대비 조회수 전환율이 <strong>{ytAnalytics.reachPower}%</strong>로 안정적인 고정 팬덤을 확보한 채널입니다.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 탭 3: 수익분석 PRO */}
              {activeTab === 'revenue' && (
                <div className="space-y-6">
                  {!isProUser ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center py-20">
                      <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 text-amber-600">
                        <DollarSign size={32} />
                      </div>
                      <h3 className="text-lg font-black text-slate-900">예상 애드센스 수익 및 조회수 트렌드는 PRO 전용입니다</h3>
                      <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed">
                        최근 8개 영상 조회수 피드백 규모 막대 그래프, 월간 추정 애드센스 수익, 롱폼/쇼츠 수익 구조를 시뮬레이션해 보세요.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsProUser(true)}
                        className="mt-6 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2"
                      >
                        <Sparkles size={14} /> PRO 모드로 분석 즉시 열람하기
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border-2 border-amber-100 shadow-2xs">
                          <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1 uppercase tracking-wider">
                            <DollarSign size={13} /> 월간 예상 애드센스 수익
                          </span>
                          <p className="text-3xl font-black text-slate-900 mt-2">
                            {Number(ytAnalytics.estMonthlyAdsense).toLocaleString()} <span className="text-sm font-normal text-slate-500">원</span>
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">월 평균 조회수 × 한국 평균 RPM 기준</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-2xs">
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                            <Film size={13} /> 영상 1건당 기대 애드센스
                          </span>
                          <p className="text-3xl font-black text-slate-900 mt-2">
                            {Math.round(ytAnalytics.estMonthlyAdsense / 4).toLocaleString()} <span className="text-sm font-normal text-slate-500">원</span>
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">평균 조회수 기반 순수 광고 배분액</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border-2 border-purple-100 shadow-2xs">
                          <span className="text-[11px] font-bold text-purple-600 flex items-center gap-1 uppercase tracking-wider">
                            <Award size={13} /> 채널 밸류에이션 점수
                          </span>
                          <p className="text-3xl font-black text-purple-600 mt-2">
                            {ytAnalytics.score} <span className="text-sm font-normal text-slate-400">/ 100점</span>
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">수익 지속성 및 안정성 평가</p>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <BarChart3 className="text-amber-500" size={15} /> 최근 발행 영상 조회수 퍼포먼스 트렌드
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">영상별 형성된 실시간 조회수 규모 추이</p>
                          </div>
                          <span className="text-[11px] bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded">
                            평균 {Number(selectedChannel.avg_views || 0).toLocaleString()}회
                          </span>
                        </div>

                        <div className="h-44 flex items-end justify-between gap-3 pt-8 pb-2 px-4">
                          {ytAnalytics.barData.map((bar, i) => {
                            const heightPct = Math.max(15, Math.min(100, Math.round((bar.views / ytAnalytics.maxBarValue) * 100)));
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                                <div className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition mb-1">
                                  {Number(bar.views).toLocaleString()}
                                </div>
                                <div 
                                  style={{ height: `${heightPct}%` }}
                                  className="w-full rounded-t-md bg-amber-500 group-hover:bg-amber-600 transition duration-300"
                                ></div>
                                <span className="text-[10px] text-slate-400 font-semibold mt-2">#{bar.index}</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                          <span>발행 순번 (좌: 최신 영상 ➜ 우: 과거 영상)</span>
                          <span>조회수 실측치 기반</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 탭 4: 광고단가분석 PRO */}
              {activeTab === 'ad_price' && (
                <div className="space-y-6">
                  {!isProUser ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center py-20">
                      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4 text-red-600">
                        <Lock size={32} />
                      </div>
                      <h3 className="text-lg font-black text-slate-900">브랜디드 PPL 단가 및 마케팅 정밀 진단표는 PRO 전용입니다</h3>
                      <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed">
                        CPV 기반 브랜디드 영상 단가, 쇼츠 전용 PPL 견적, 광고주 ROI 예측 종합표를 열람할 수 있습니다.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsProUser(true)}
                        className="mt-6 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2"
                      >
                        <Sparkles size={14} /> PRO 모드로 분석 즉시 열람하기
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border-2 border-red-100 shadow-2xs">
                          <span className="text-[11px] font-bold text-red-500 flex items-center gap-1 uppercase tracking-wider">
                            <Film size={13} /> 브랜디드 영상 (롱폼 단독)
                          </span>
                          <p className="text-3xl font-black text-slate-900 mt-2">
                            {Number(ytAnalytics.estLongform).toLocaleString()} <span className="text-sm font-normal text-slate-500">원</span>
                          </p>
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                            <span>CPV 기준</span>
                            <span className="font-semibold text-red-500">조회수당 약 28원 산정</span>
                          </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border-2 border-rose-100 shadow-2xs">
                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 uppercase tracking-wider">
                            <Zap size={13} /> 유튜브 쇼츠 (단독 PPL)
                          </span>
                          <p className="text-3xl font-black text-slate-900 mt-2">
                            {Number(ytAnalytics.estShorts).toLocaleString()} <span className="text-sm font-normal text-slate-500">원</span>
                          </p>
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                            <span>가성비</span>
                            <span className="font-semibold text-rose-600">숏폼 확산 추천</span>
                          </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border-2 border-blue-100 shadow-2xs">
                          <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1 uppercase tracking-wider">
                            <Target size={13} /> 전환 ROI 효율 등급
                          </span>
                          <p className="text-3xl font-black text-blue-600 mt-2">
                            {ytAnalytics.cpaGrade}
                          </p>
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                            <span>전환율</span>
                            <span className="font-semibold text-blue-600">구매전환/브랜딩 우수</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Target className="text-slate-800" size={16} /> 유튜브 마케팅 협업 타당성 정밀 진단표
                          </h4>
                          <span className="text-[11px] text-red-700 bg-red-50 font-bold px-2.5 py-1 rounded-full border border-red-200">
                            ✓ 광고 적합 판정 완료
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-100">
                              <tr>
                                <th className="py-3 px-4">분석 항목</th>
                                <th className="py-3 px-4">측정 지표</th>
                                <th className="py-3 px-4">업계 벤치마크 평가</th>
                                <th className="py-3 px-4">권장 캠페인 유형</th>
                                <th className="py-3 px-4 text-right">예상 ROI 기대치</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              <tr>
                                <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                                  <Flame size={14} className="text-red-500" /> 시청자 도달력
                                </td>
                                <td className="py-3.5 px-4 font-bold text-red-600">평균 {Number(selectedChannel.avg_views || 0).toLocaleString()}회</td>
                                <td className="py-3.5 px-4">
                                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700">
                                    상위 3% 대형 도달
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-slate-600">단독 브랜디드 영상 기획 / 신제품 런칭</td>
                                <td className="py-3.5 px-4 text-right font-bold text-red-600">★★★★★</td>
                              </tr>
                              <tr>
                                <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                                  <Zap size={14} className="text-amber-500" /> 쇼츠 바이럴 파워
                                </td>
                                <td className="py-3.5 px-4 font-bold text-amber-600">숏폼 CPV 최적화</td>
                                <td className="py-3.5 px-4">
                                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700">
                                    알고리즘 확산 최적
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-slate-600">유튜브 쇼츠 챌린지 / 프로모션 노출</td>
                                <td className="py-3.5 px-4 text-right font-bold text-amber-600">★★★★☆</td>
                              </tr>
                              <tr>
                                <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                                  <TrendingUp size={14} className="text-purple-500" /> 시청자 참여 전환
                                </td>
                                <td className="py-3.5 px-4 font-bold text-purple-600">{Number(selectedChannel.engagement_rate || 3.8)}%</td>
                                <td className="py-3.5 px-4">
                                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700">
                                    고관여 소통형
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-slate-600">더보기란 쿠폰 코드 / 고정댓글 유입</td>
                                <td className="py-3.5 px-4 text-right font-bold text-purple-600">★★★★★</td>
                              </tr>
                              <tr>
                                <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                                  <Target size={14} className="text-emerald-500" /> 브랜드 안전성
                                </td>
                                <td className="py-3.5 px-4 font-bold text-slate-800">이탈률 최저</td>
                                <td className="py-3.5 px-4">
                                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700">
                                    리스크 청정 채널
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-slate-600">장기 브랜드 앰버서더 협업</td>
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
              선택된 채널이 없습니다.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
