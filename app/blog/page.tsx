'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Lock, Mail, ExternalLink, Tag, Users, ArrowUpDown, 
  Heart, MessageSquare, Eye, UserPlus, ShieldCheck, Sparkles, 
  FileText, BadgeDollarSign, BarChart3, DollarSign, X, Hash, PieChart, ChevronRight
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
  
  // 조회 횟수 카운팅 시스템 (무료 회원 기준 하루 3회 제한)
  const [viewCount, setViewCount] = useState(0);
  const MAX_FREE_VIEWS = 3;

  const [bloggers, setBloggers] = useState<BlogInfluencer[]>([]);
  const [blogPostsMap, setBlogPostsMap] = useState<Record<string, BlogPost[]>>({});
  
  // 선택된 채널 상세 모달 상태
  const [selectedBlogger, setSelectedBlogger] = useState<BlogInfluencer | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'posts' | 'analytics'>('basic');
  const [showLimitModal, setShowLimitModal] = useState(false);
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

  // 검색 및 카테고리 필터
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

  // 채널 상세 열기 (조회 카운팅 체크)
  const handleOpenDetail = (blogger: BlogInfluencer) => {
    if (!isProUser && viewCount >= MAX_FREE_VIEWS) {
      setShowLimitModal(true); // 무료 횟수 초과 시 제한 팝업
      return;
    }

    if (!isProUser) {
      setViewCount(prev => prev + 1); // 무료 조회 카운트 증가
    }

    setSelectedBlogger(blogger);
    setActiveTab('basic');
  };

  const currentPosts = selectedBlogger ? (blogPostsMap[selectedBlogger.blog_id] || []) : [];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-y-auto">
      {/* 상단 검색 및 필터 헤더 (Vling 스타일) */}
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

        {/* 카테고리 탭 바 */}
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
                {/* 카드 상단 정보 */}
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

                  {/* [채널 상세] 진입 버튼 (카운팅 대상) */}
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(blogger)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                  >
                    채널 상세 <ChevronRight size={14} />
                  </button>
                </div>

                {/* 지표 요약 바 */}
                <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400">인플루언서 팬</span>
                    <p className="text-sm font-black text-slate-900 mt-0.5">{(blogger.fan_count || 0).toLocaleString()}명</p>
                  </div>
                  <div>
                    <span className="text-slate-400">일일 평균 방문자</span>
                    <p className="text-sm font-black text-green-600 mt-0.5">{(blogger.daily_visitors || 0).toLocaleString명</p>
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

                {/* 최근 썸네일 카드 미리보기 피드 (Vling 스타일) */}
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

      {/* ---------------- 채널 상세 모달 (상세 분석 뷰) ---------------- */}
      {selectedBlogger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            
            {/* 모달 헤더 */}
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <img src={selectedBlogger.profile_img_url} alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover border" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedBlogger.name} 상세 분석 리포트</h3>
                  <p className="text-xs text-slate-400">@{selectedBlogger.blog_id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedBlogger(null)}
                className="w-9 h-9 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* 모달 탭 */}
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

            {/* 모달 본문 내용 */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f8f9fa]">
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200">
                      <span className="text-xs text-slate-400">인플루언서 팬</span>
                      <p className="text-2xl font-black text-slate-900 mt-1">{(selectedBlogger.fan_count || 0).toLocaleString()}명</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200">
                      <span className="text-xs text-slate-400">일일 방문자수</span>
                      <p className="text-2xl font-black text-green-600 mt-1">{(selectedBlogger.daily_visitors || 0).toLocaleString()}명</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200">
                      <span className="text-xs text-slate-400">이웃 수</span>
                      <p className="text-2xl font-black text-slate-900 mt-1">{(selectedBlogger.follower_count || 0).toLocaleString()}명</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'posts' && (
                <div className="space-y-3">
                  {currentPosts.map((p, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 flex gap-4 items-center">
                      <img src={p.thumbnail_url} alt="" referrerPolicy="no-referrer" className="w-24 h-16 rounded-lg object-cover bg-slate-100 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{p.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{p.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="text-sm font-bold text-slate-900">마케팅 제휴 및 원고료 산정</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      해당 인플루언서의 일일 방문자수와 독자 참여율을 바탕으로 산정한 예상 포스팅 원고료는 약 <strong className="text-green-600">{(selectedBlogger.daily_visitors * 35 + 90000).toLocaleString()}원</strong> 내외입니다.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
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

      {/* ---------------- 무료 조회 한도 초과 팝업 ---------------- */}
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
    </div>
  );
}
