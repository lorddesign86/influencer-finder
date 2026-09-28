'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Lock, Mail, ExternalLink, Video, Smartphone, 
  BarChart3, DollarSign, Film, Bookmark, AlertCircle, PlayCircle 
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
  id?: string | number;
  channel_id: string;
  title: string;
  post_url: string;
  thumbnail_url: string;
  view_count?: number;
  published_at?: string;
}

export default function VlingStyleDashboard() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Influencer | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'channel' | 'video' | 'audience' | 'revenue' | 'ad_cost'>('channel');
  const [isProUser, setIsProUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 채널 목록 불러오기
  const fetchChannels = async (queryText = '') => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (!supabase) {
        throw new Error('Supabase 클라이언트가 설정되지 않았습니다.');
      }

      let query = supabase.from('influencers').select('*');
      
      const trimmed = queryText.trim();
      if (trimmed !== '') {
        query = query.or(`name.ilike.%${trimmed}%,handle.ilike.%${trimmed}%`);
      }

      const { data, error } = await query;

      if (error) {
        setErrorMessage(error.message);
      } else if (data) {
        setInfluencers(data as Influencer[]);
        if (data.length > 0) {
          handleSelectChannel(data[0] as Influencer);
        } else {
          setSelectedChannel(null);
          setPosts([]);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 선택된 채널의 영상 목록(influencer_posts) 가져오기
  const fetchChannelPosts = async (channelId: string) => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from('influencer_posts')
        .select('*')
        .eq('channel_id', channelId)
        .limit(12);

      if (!error && data) {
        setPosts(data as Post[]);
      } else {
        setPosts([]);
      }
    } catch (e) {
      console.error('Error fetching posts:', e);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleSelectChannel = (channel: Influencer) => {
    setSelectedChannel(channel);
    if (channel.channel_id) {
      fetchChannelPosts(channel.channel_id);
    }
  };

  useEffect(() => {
    fetchChannels('');
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchChannels(search);
  };

  return (
    <div className="flex h-screen bg-[#f8f9fa] text-slate-800 antialiased overflow-hidden font-sans">
      {/* 1. 사이드바 */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-2">
            <span className="text-2xl font-black tracking-tight text-red-500">vling</span>
            <span className="text-xs bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded">PRO</span>
          </div>

          <div className="p-4 space-y-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 px-3 mb-2 tracking-wider">인플루언서 탐색</p>
              <nav className="space-y-1">
                <button 
                  type="button"
                  onClick={() => { setSearch(''); fetchChannels(''); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold bg-red-50 text-red-600 transition"
                >
                  <Search size={18} /> 유튜버 찾기
                </button>
                <button 
                  type="button"
                  onClick={() => alert('영상 라이브러리 기능 준비 중입니다.')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  <Film size={18} /> 영상 라이브러리
                </button>
                <button 
                  type="button"
                  onClick={() => alert('즐겨찾기 목록 준비 중입니다.')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
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
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  <BarChart3 size={18} /> 채널 비교분석
                </button>
                <button 
                  type="button"
                  onClick={() => alert('수익 계산기 준비 중입니다.')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  <DollarSign size={18} /> 수익 계산기
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* PRO 플랜 토글 */}
        <div className="p-4 border-t border-slate-100">
          <button 
            type="button"
            onClick={() => setIsProUser(!isProUser)}
            className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm ${
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
          <form onSubmit={handleSearchSubmit} className="relative w-96 flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <input 
              type="text" 
              placeholder="유튜버 이름 또는 핸들 검색..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-20 py-2 border border-slate-200 rounded-full text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-red-500 text-white rounded-full text-xs font-semibold hover:bg-red-600 transition"
            >
              검색
            </button>
          </form>

          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => alert('월 29,000원부터 시작하는 스타터/비즈니스 플랜입니다.')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 transition"
            >
              요금안내
            </button>
            <button 
              type="button"
              onClick={() => alert('로그인 기능 준비 중입니다.')}
              className="text-xs font-semibold bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 shadow-sm transition"
            >
              로그인 / 가입
            </button>
          </div>
        </header>

        {/* 에러 알림바 */}
        {errorMessage && (
          <div className="bg-red-50 border-b border-red-200 px-8 py-2.5 flex items-center gap-2 text-xs text-red-600">
            <AlertCircle size={16} />
            <span>데이터베이스 연결 오류: {errorMessage}</span>
          </div>
        )}

        {/* 인플루언서 목록 및 세부 패널 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 좌측 채널 목록 */}
          <div className="w-1/3 border-r border-slate-200 overflow-y-auto bg-white">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <span className="text-xs font-bold text-slate-500">채널 목록 ({influencers.length})</span>
              <button 
                type="button" 
                onClick={() => { setSearch(''); fetchChannels(''); }} 
                className="text-xs text-red-500 hover:underline cursor-pointer"
              >
                초기화
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">데이터를 불러오는 중...</div>
            ) : influencers.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                일치하는 인플루언서가 없습니다.
              </div>
            ) : (
              influencers.map((channel) => (
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

          {/* 우측 상세 분석 뷰 */}
          <div className="flex-1 overflow-y-auto p-8 bg-[#f8f9fa]">
            {selectedChannel ? (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* 상단 프로필 헤더 */}
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
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                    >
                      <Mail size={14} /> 문의하기
                    </button>
                  </div>
                </div>

                {/* 탭 네비게이션 */}
                <div className="flex gap-2 border-b border-slate-200 pb-2">
                  {[
                    { id: 'channel', label: '채널 지표' },
                    { id: 'video', label: '영상 분석' },
                    { id: 'ad_cost', label: '광고 단가 (PRO)' },
                    { id: 'audience', label: '시청자 분석 (PRO)' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                        activeTab === tab.id 
                          ? 'bg-slate-900 text-white' 
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* 탭별 내용 */}
                {activeTab === 'channel' && (
                  <div className="space-y-6">
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
                        <p className="text-xs font-medium text-slate-400 mb-1">참여율(Engagement)</p>
                        <p className="text-2xl font-extrabold text-emerald-600">{selectedChannel.engagement_rate || 0}%</p>
                      </div>
                    </div>

                    {/* 최근 수집된 영상 썸네일 그리드 */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <PlayCircle size={18} className="text-red-500" /> 채널 최근 영상
                        </h3>
                        <span className="text-xs text-slate-400">{posts.length}개 수집됨</span>
                      </div>

                      {loadingPosts ? (
                        <p className="text-xs text-slate-400 py-6 text-center">영상 데이터를 불러오는 중...</p>
                      ) : posts.length === 0 ? (
                        <p className="text-xs text-slate-400 py-6 text-center">수집된 영상 데이터가 없습니다.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-4">
                          {posts.map((post, idx) => (
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
                              </div>
                              <div className="p-3">
                                <h4 className="text-xs font-medium text-slate-800 line-clamp-2 leading-relaxed group-hover:text-red-500 transition">
                                  {post.title}
                                </h4>
                                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                                  <span>유튜브 바로가기</span>
                                  <ExternalLink size={12} />
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'video' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-slate-500 text-xs font-semibold">
                          <Video size={16} /> 롱폼 평균 조회수
                        </div>
                        <p className="text-2xl font-black text-slate-900">{(selectedChannel.avg_video_views || 0).toLocaleString()}회</p>
                      </div>
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-slate-500 text-xs font-semibold">
                          <Smartphone size={16} /> 숏폼 평균 조회수
                        </div>
                        <p className="text-2xl font-black text-slate-900">{(selectedChannel.avg_shorts_views || 0).toLocaleString()}회</p>
                      </div>
                    </div>

                    {/* 전체 영상 그리드 */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 mb-4">분석 대상 영상 목록</h3>
                      {posts.length === 0 ? (
                        <p className="text-xs text-slate-400 py-6 text-center">등록된 영상이 없습니다.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-4">
                          {posts.map((post, idx) => (
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
                              </div>
                              <div className="p-3">
                                <h4 className="text-xs font-medium text-slate-800 line-clamp-2 leading-relaxed group-hover:text-red-500 transition">
                                  {post.title}
                                </h4>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(activeTab === 'ad_cost' || activeTab === 'audience') && !isProUser && (
                  <div className="relative overflow-hidden bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <div className="filter blur-sm select-none pointer-events-none space-y-4">
                      <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto"></div>
                      <div className="h-20 bg-slate-100 rounded w-full"></div>
                    </div>
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center p-6">
                      <div className="p-3 bg-red-100 text-red-500 rounded-full mb-3">
                        <Lock size={24} />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-1">PRO 전용 정밀 분석 지표입니다</h3>
                      <p className="text-xs text-slate-500 mb-4 max-w-sm">
                        예상 광고 단가(CPV) 및 시청자 언어 분포 등 상세 데이터를 확인하려면 PRO 플랜을 활성화하세요.
                      </p>
                      <button 
                        type="button"
                        onClick={() => setIsProUser(true)}
                        className="px-5 py-2.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 shadow-md transition"
                      >
                        PRO 시뮬레이션 즉시 활성화
                      </button>
                    </div>
                  </div>
                )}

                {(activeTab === 'ad_cost' || activeTab === 'audience') && isProUser && (
                  <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
                      👑 PRO 모드 해금 데이터
                    </div>
                    {activeTab === 'ad_cost' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
                          <p className="text-xs text-slate-500 mb-1">예상 롱폼 광고 단가</p>
                          <p className="text-xl font-black text-slate-900">
                            약 {((selectedChannel.estimated_video_cpv_price || 0) / 10000).toLocaleString()}만원
                          </p>
                        </div>
                        <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
                          <p className="text-xs text-slate-500 mb-1">예상 숏폼 광고 단가</p>
                          <p className="text-xl font-black text-slate-900">
                            약 {((selectedChannel.estimated_shorts_cpv_price || 0) / 10000).toLocaleString()}만원
                          </p>
                        </div>
                      </div>
                    )}
                    {activeTab === 'audience' && (
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-500 mb-2 font-bold">시청자 언어 분포</p>
                        <pre className="text-xs text-slate-700 bg-white p-3 rounded border border-slate-200">
                          {JSON.stringify(selectedChannel.audience_languages || {}, null, 2)}
                        </pre>
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
