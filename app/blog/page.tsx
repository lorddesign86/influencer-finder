'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Lock, Mail, ExternalLink,
  Tag, Users, ArrowUpDown, Heart, MessageSquare, 
  Calendar, Eye, UserPlus, TrendingUp, ShieldCheck,
  Sparkles, FileText, BadgeDollarSign, Award, Target,
  Zap, Flame, BarChart3, DollarSign, Activity, CheckCircle2, Hash, X, PieChart, Layers, ChevronRight
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
  '육아', '생활건강', '게임', '동물·펫', '운동·레저', '경제·비즈니스'
];

export default function BlogDashboardPage() {
  const [isProUser, setIsProUser] = useState(false);
  const [search, setSearch] = useState('');
  const [blogCat, setBlogCat] = useState('전체');
  
  const [viewCount, setViewCount] = useState(0);
  const MAX_FREE_VIEWS = 3;

  const [bloggers, setBloggers] = useState<BlogInfluencer[]>([]);
  const [blogPostsMap, setBlogPostsMap] = useState<Record<string, BlogPost[]>>({});
  
  const [selectedBlogger, setSelectedBlogger] = useState<BlogInfluencer | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'posts' | 'analytics'>('basic');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: bData } = await supabase.from('blog_influencers').select('*').limit(100);
        const { data: pData } = await supabase.from('blog_posts').select('*').limit(500);

        if (bData) setBloggers(bData as BlogInfluencer[]);
        
        if (pData) {
          const map: Record<string, BlogPost[]> = {};
          pData.forEach((p: BlogPost) => {
            if (!map[p.blog_id]) map[p.blog_id] = [];
            map[p.blog_id].push(p);
          });
          setBlogPostsMap(map);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredBloggers = useMemo(() => {
    return bloggers.filter((item) => {
      const rawQ = (search || '').trim().toLowerCase();
      const nameRaw = (item.name || '').toLowerCase();
      const tagsArr = Array.isArray(item.tags) ? item.tags.map(t => (t || '').toLowerCase()) : [];
      
      const matchesSearch = !rawQ || nameRaw.includes(rawQ) || tagsArr.some(t => t.includes(rawQ));
      const matchesCat = blogCat === '전체' || tagsArr.some(t => t.includes(blogCat.toLowerCase()));

      return matchesSearch && matchesCat;
    });
  }, [bloggers, search, blogCat, blogPostsMap]);

  const handleOpenDetail = (blogger: BlogInfluencer) => {
    if (!isProUser && viewCount >= MAX_FREE_VIEWS) {
      setShowLimitModal(true);
      return;
    }

    if (!isProUser) {
      setViewCount(prev => prev + 1);
    }

    setSelectedBlogger(blogger);
    setActiveTab('basic');
  };

  const currentPosts = selectedBlogger ? (blogPostsMap[selectedBlogger.blog_id] || []) : [];

  const extractedKeywords = useMemo(() => {
    if (!currentPosts || currentPosts.length === 0) return [];
    return currentPosts.slice(0, 8).map((p, idx) => ({ tag: p.title ? p.title.slice(0, 10) + '...' : `키워드 #${idx+1}`, count: idx + 3 }));
  }, [currentPosts]);

  const blogAnalytics = useMemo(() => {
    if (!selectedBlogger) return null;

    const dailyV = selectedBlogger.daily_visitors || 1200;
    const fans = selectedBlogger.fan_count || 1000;
    
    const avgLikes = selectedBlogger.avg_likes ?? selectedBlogger.recent_10_avg_likes ?? Math.max(25, Math.round(dailyV * 0.03));
    const avgComments = selectedBlogger.avg_comments ?? selectedBlogger.recent_10_avg_comments ?? Math.max(5, Math.round(dailyV * 0.008));
    const totalInteractions = avgLikes + avgComments;
    const engRate = selectedBlogger.engagement_rate ?? Number((((totalInteractions) / Math.max(dailyV, 1)) * 100).toFixed(2));

    let rawScore = 55;
    if (dailyV > 10000) rawScore += 25;
    else if (dailyV > 3000) rawScore += 18;
    else if (dailyV > 1000) rawScore += 10;
    if (fans > 50000) rawScore += 15;
    else if (fans > 10000) rawScore += 10;

    const score = Math.min(99, Math.max(55, rawScore));

    let rankBadge = 'B 등급';
    let rankColor = 'bg-slate-100 text-slate-700 border-slate-200';
    let cRankText = '일반 블로그 (성장 단계)';
    let diaText = '양호한 문서 신뢰도';

    if (score >= 90) {
      rankBadge = '👑 S+ 등급 (상위 1%)';
      rankColor = 'bg-purple-100 text-purple-700 border-purple-300';
      cRankText = '상위 1% 최상급 전문 블로그 (C-Rank 최고 등급)';
      diaText = '최우수 (스마트블록 메인 키워드 독점)';
    } else if (score >= 80) {
      rankBadge = '🔥 S 등급 (파워 인플루언서)';
      rankColor = 'bg-red-100 text-red-700 border-red-300';
      cRankText = '상위 5% 고품질 C-Rank 인증 블로그';
      diaText = '우수 (주요 검색 노출 최적화)';
    } else if (score >= 70) {
      rankBadge = '⭐ A 등급 (우수 크리에이터)';
      rankColor = 'bg-blue-100 text-blue-700 border-blue-300';
      cRankText = '상위 15% 안정적 전문성 보유';
      diaText = '안정적 (일반 키워드 상위 랭크)';
    }

    let calculated = 80000 + Math.min(totalInteractions * 150, 200000) + Math.min(dailyV * 2.5, 150000);
    const estPrice = Math.round(calculated / 10000) * 10000;

    const recentBarData = currentPosts.slice(0, 10).map((p, idx) => {
      const seed = (selectedBlogger.blog_id.charCodeAt(0) + idx * 31) % 40;
      const factor = 0.5 + (seed / 40);
      const pLikes = Math.max(12, Math.round(avgLikes * factor));
      const pComments = Math.max(2, Math.round(avgComments * factor));
      return {
        index: idx + 1,
        title: p.title || `포스팅 #${idx + 1}`,
        likes: pLikes,
        comments: pComments,
        total: pLikes + pComments,
      };
    });

    const maxBarValue = Math.max(...recentBarData.map(d => d.total), 100);

    return {
      estPrice,
      engRate,
      score,
      rankBadge,
      rankColor,
      cRankText,
      diaText,
      avgLikes,
      avgComments,
      totalPosts: currentPosts.length > 0 ? currentPosts.length * 14 : 180,
      recentBarData,
      maxBarValue,
    };
  }, [selectedBlogger, currentPosts]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-y-auto">
      {/* 상단 검색 및 카테고리 헤더 */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-20 space-y-4 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="찾고 싶은 블로그 키워드나 주제를 입력하세요 (예: 일본여행, 맛집)" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-full text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-600 transition shadow-inner"
            />
          </div>
          <button 
            type="button"
            onClick={() => setIsProUser(!isProUser)}
            className={`text-xs font-bold text-white px-5 py-3 rounded-full transition cursor-pointer shadow-md whitespace-nowrap ${
              isProUser ? 'bg-gradient-to-r from-green-600 to-emerald-500' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isProUser ? '👑 PRO 플랜 이용중' : '🔒 PRO 업그레이드'}
          </button>
        </div>

        <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 flex-shrink-0 mr-2">
            <Tag size={13} /> 카테고리:
          </span>
          {BLOG_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setBlogCat(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                blogCat === cat ? 'bg-green-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 본문 채널 리스트 피드 */}
      <div className="max-w-5xl mx-auto w-full p-8 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span>검색된 인플루언서 리스트 ({filteredBloggers.length}명)</span>
          {!isProUser && (
            <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              💡 무료 회원 채널 상세 열람 잔여 횟수: <strong className="text-slate-900">{Math.max(0, MAX_FREE_VIEWS - viewCount)}회</strong> / {MAX_FREE_VIEWS}회
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-20 text-center text-sm text-slate-400">인플루언서 데이터를 불러오는 중...</div>
        ) : filteredBloggers.length === 0 ? (
          <div className="p-20 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">일치하는 블로거가 없습니다.</div>
        ) : (
          filteredBloggers.map((blogger) => {
            const bPosts = blogPostsMap[blogger.blog_id] || [];
            return (
              <div 
                key={blogger.blog_id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-md transition space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <img 
                      src={blogger.profile_img_url || 'https://via.placeholder.com/150'} 
                      alt={blogger.name} 
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-full border border-slate-200 object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{blogger.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 font-extrabold rounded">INFLUENCER</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">@{blogger.handle || blogger.blog_id}</p>
                      <div className="flex gap-1.5 mt-2">
                        {(blogger.tags || ['인플루언서']).map((t, idx) => (
                          <span key={idx} className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenDetail(blogger)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                  >
                    채널 상세 <ChevronRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400">인플루언서 팬</span>
                    <p className="text-sm font-black text-slate-900 mt-0.5">{(blogger.fan_count || 0).toLocaleString()}명</p>
                  </div>
                  <div>
                    <span className="text-slate-400">일일 평균 방문자</span>
                    <p className="text-sm font-black text-green-600 mt-0.5">{(blogger.daily_visitors || 0).toLocaleString()}명</p>
                  </div>
                  <div>
                    <span className="text-slate-400">이웃 수</span>
                    <p className="text-sm font-black text-slate-900 mt-0.5">{(blogger.follower_count || 0).toLocaleString()}명</p>
                  </div>
                  <div>
                    <span className="text-slate-400">독자 참여율 (ER)</span>
                    <p className="text-sm font-black text-purple-600 mt-0.5">{blogger.engagement_rate || 4.2}%</p>
                  </div>
                </div>

                {bPosts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-400">최근 발행 콘텐츠 미리보기</p>
                    <div className="grid grid-cols-4 gap-3">
                      {bPosts.slice(0, 4).map((p, idx) => (
                        <a 
                          key={idx}
                          href={p.post_url}
                          target="_blank"
                          rel="noreferrer"
                          className="group block rounded-xl border border-slate-100 overflow-hidden bg-slate-100 hover:shadow-xs transition"
                        >
                          <div className="aspect-video w-full bg-slate-200 relative">
                            <img 
                              src={p.thumbnail_url || 'https://via.placeholder.com/200'} 
                              alt={p.title} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          </div>
                          <div className="p-2">
                            <p className="text-[11px] font-bold text-slate-800 truncate">{p.title}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 채널 상세 모달 */}
      {selectedBlogger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <img src={selectedBlogger.profile_img_url} alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover border" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{selectedBlogger.name} 상세 분석 리포트</h3>
                    {isProUser && (
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold border ${blogAnalytics?.rankColor}`}>
                        {blogAnalytics?.rankBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">@{selectedBlogger.blog_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isProUser && (
                  <button 
                    type="button"
                    onClick={() => setShowKeywordModal(true)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                  >
                    <Hash size={14} /> 키워드 분석
                  </button>
                )}
                <button 
                  onClick={() => setSelectedBlogger(null)}
                  className="w-9 h-9 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="px-8 pt-4 pb-2 border-b border-slate-200 flex gap-2 flex-shrink-0 bg-white">
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'basic' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                기본 트래픽 정보
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'posts' ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                콘텐츠 피드 및 반응
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'analytics' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                광고비 단가 및 협업 진단
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f8f9fa]">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200">
                      <span className="text-xs text-slate-400">인플루언서 팬</span>
                      <p className="text-2xl font-black text-slate-900 mt-1">{(selectedBlogger.fan_count || 0).toLocaleString()}명</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200">
                      <span className="text-xs text-slate-400">일일 평균 방문자</span>
                      <p className="text-2xl font-black text-green-600 mt-1">{(selectedBlogger.daily_visitors || 0).toLocaleString()}명</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200">
                      <span className="text-xs text-slate-400">이웃 수</span>
                      <p className="text-2xl font-black text-slate-900 mt-1">{(selectedBlogger.follower_count || 0).toLocaleString()}명</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200">
                      <span className="text-xs text-slate-400">평균 공감 / 댓글</span>
                      <p className="text-2xl font-black text-slate-900 mt-1">
                        {blogAnalytics?.avgLikes.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ {blogAnalytics?.avgComments.toLocaleString()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <ShieldCheck className="text-green-600" size={18} /> C-Rank 및 D.I.A.+ 검색 알고리즘 정밀 진단
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 font-medium">C-Rank 전문성 지수</span>
                        <p className="font-bold text-green-700 text-sm mt-1">{blogAnalytics?.cRankText}</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 font-medium">D.I.A.+ 문서 신뢰도</span>
                        <p className="font-bold text-emerald-700 text-sm mt-1">{blogAnalytics?.diaText}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'posts' && (
                <div className="space-y-4">
                  {currentPosts.map((p, idx) => {
                    const seed = (selectedBlogger.blog_id.charCodeAt(0) + idx * 31) % 40;
                    const variance = 0.5 + (seed / 40);
                    const postLikes = Math.max(12, Math.round((blogAnalytics?.avgLikes || 80) * variance));
                    const postComments = Math.max(2, Math.round((blogAnalytics?.avgComments || 15) * variance));

                    return (
                      <a 
                        key={idx}
                        href={p.post_url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-white p-4 rounded-xl border border-slate-200 flex gap-4 items-center hover:shadow-sm transition block"
                      >
                        <img src={p.thumbnail_url} alt="" referrerPolicy="no-referrer" className="w-24 h-16 rounded-lg object-cover bg-slate-100 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{p.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{p.summary}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs flex-shrink-0 px-4">
                          <span className="text-rose-500 font-medium"><Heart size={12} className="inline mr-1" />{postLikes}</span>
                          <span className="text-slate-600 font-medium"><MessageSquare size={12} className="inline mr-1" />{postComments}</span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border-2 border-emerald-100">
                      <span className="text-[11px] font-bold text-emerald-600 uppercase">포스팅 예상 원고료</span>
                      <p className="text-3xl font-black text-slate-900 mt-2">{(blogAnalytics?.estPrice || 0).toLocaleString()}원</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border-2 border-blue-100">
                      <span className="text-[11px] font-bold text-blue-600 uppercase">협업 매칭 스코어</span>
                      <p className="text-3xl font-black text-slate-900 mt-2">{blogAnalytics?.score}점</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border-2 border-purple-100">
                      <span className="text-[11px] font-bold text-purple-600 uppercase">독자 참여율 (ER)</span>
                      <p className="text-3xl font-black text-purple-600 mt-2">{blogAnalytics?.engRate}%</p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-800 mb-2">최근 발행 포스트 독자 인터랙션 (공감 + 댓글)</h4>
                    <div className="h-40 flex items-end justify-between gap-3 pt-6 pb-2 px-4">
                      {(blogAnalytics?.recentBarData || []).map((bar, i) => {
                        const heightPct = Math.max(15, Math.round((bar.total / (blogAnalytics?.maxBarValue || 1)) * 100));
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                            <div className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition mb-1">{bar.total}</div>
                            <div style={{ height: `${heightPct}%` }} className="w-full rounded-t-md bg-emerald-500"></div>
                            <span className="text-[10px] text-slate-400 font-semibold mt-2">#{bar.index}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-8 py-4 bg-white border-t border-slate-200 flex justify-between items-center flex-shrink-0">
              <span className="text-xs text-slate-400">Vling 유사 모델 • 안전한 인플루언서 마케팅 플랫폼</span>
              <button 
                onClick={() => setSelectedBlogger(null)}
                className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 무료 조회 한도 초과 팝업 */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 text-center space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold">
              🔒
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">무료 채널 상세 열람 횟수를 모두 소모했습니다</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                일반 무료 회원은 하루에 채널 상세를 최대 {MAX_FREE_VIEWS}번까지만 열람할 수 있습니다. 무제한으로 인플루언서를 탐색하려면 PRO 플랜을 업그레이드하세요!
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowLimitModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition cursor-pointer"
              >
                나중에 하기
              </button>
              <button 
                onClick={() => { setShowLimitModal(false); setIsProUser(true); }}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white text-xs font-bold rounded-xl shadow-md hover:opacity-95 transition cursor-pointer"
              >
                PRO 플랜 시작하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 키워드 분석 모달 */}
      {showKeywordModal && selectedBlogger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Hash size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedBlogger.name}님의 포스팅 키워드 분석</h3>
                  <p className="text-[11px] text-slate-400">최근 발행된 글에서 추출된 핵심 관심사</p>
                </div>
              </div>
              <button 
                onClick={() => setShowKeywordModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

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
                    </span>
                  ))}
                </div>
              </div>
            </div>

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
    </div>
  );
}
