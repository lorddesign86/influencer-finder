'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Search, Mail, Tag, ArrowUpDown, ChevronRight, Heart, MessageSquare, Calendar 
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

type BlogSortOption = 'fan_desc' | 'visitors_desc' | 'follower_desc' | 'price_desc';

export default function BlogDashboardPage() {
  const router = useRouter();
  const [isProUser, setIsProUser] = useState(false);
  const [search, setSearch] = useState('');
  const [blogCat, setBlogCat] = useState('전체');
  const [blogSort, setBlogSort] = useState<BlogSortOption>('fan_desc');
  
  const [viewCount, setViewCount] = useState(0);
  const MAX_FREE_VIEWS = 3;

  const [bloggers, setBloggers] = useState<BlogInfluencer[]>([]);
  const [blogPostsMap, setBlogPostsMap] = useState<Record<string, BlogPost[]>>({});
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // 채널 상세 페이지와 완전히 동일하게 모든 포스트 데이터를 미리 맵핑
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: bData } = await supabase.from('blog_influencers').select('*').limit(300);
        const { data: pData } = await supabase.from('blog_posts').select('*');

        if (bData) setBloggers(bData as BlogInfluencer[]);
        
        if (pData) {
          const map: Record<string, BlogPost[]> = {};
          pData.forEach((p: BlogPost) => {
            const bId = String(p.blog_id || '').trim().toLowerCase();
            if (!map[bId]) map[bId] = [];
            map[bId].push(p);
          });
          setBlogPostsMap(map);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 유연하고 강력한 통합 검색 시스템 (이름, 핸들, 태그, 포스트 내용 포함)
  const filteredBloggers = useMemo(() => {
    return bloggers
      .filter((item) => {
        const rawQ = (search || '').trim().toLowerCase();
        const tagsArr = Array.isArray(item.tags) ? item.tags.map(t => (t || '').toLowerCase()) : [];
        
        const matchesCat = blogCat === '전체' || tagsArr.some(t => t.includes(blogCat.toLowerCase())) || (item.name || '').toLowerCase().includes(blogCat.toLowerCase());

        if (!matchesCat) return false;
        if (!rawQ) return true;

        const keywords = rawQ.split(/\s+/).filter(Boolean);
        const nameRaw = (item.name || '').toLowerCase();
        const handleRaw = (item.handle || item.blog_id || '').toLowerCase();
        
        const bKey = String(item.blog_id || '').trim().toLowerCase();
        const hKey = String(item.handle || '').trim().toLowerCase();
        const bPosts = blogPostsMap[bKey] || blogPostsMap[hKey] || [];
        const postsText = bPosts.map(p => `${p.title || ''} ${p.summary || ''}`).join(' ').toLowerCase();

        return keywords.some(kw => 
          nameRaw.includes(kw) || 
          handleRaw.includes(kw) || 
          tagsArr.some(t => t.includes(kw)) ||
          postsText.includes(kw)
        );
      })
      .sort((a, b) => {
        const aPrice = Math.round(((a.daily_visitors || 0) * 25 + (a.fan_count || 0) * 20));
        const bPrice = Math.round(((b.daily_visitors || 0) * 25 + (b.fan_count || 0) * 20));

        if (blogSort === 'fan_desc') return (b.fan_count || 0) - (a.fan_count || 0);
        if (blogSort === 'visitors_desc') return (b.daily_visitors || 0) - (a.daily_visitors || 0);
        if (blogSort === 'follower_desc') return (b.follower_count || 0) - (a.follower_count || 0);
        if (blogSort === 'price_desc') return bPrice - aPrice;
        return 0;
      });
  }, [bloggers, blogPostsMap, search, blogCat, blogSort]);

  const handleOpenDetail = (blogId: string) => {
    if (!isProUser && viewCount >= MAX_FREE_VIEWS) {
      setShowLimitModal(true);
      return;
    }

    if (!isProUser) {
      setViewCount(prev => prev + 1);
    }

    router.push(`/blog/${blogId}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-y-auto">
      {/* 상단 검색 및 카테고리 헤더 */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-20 space-y-4 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="찾고 싶은 블로그 키워드나 주제를 입력하세요 (예: 맛집, 일본여행, 육아)" 
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
        
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
              <ArrowUpDown size={13} /> 정렬:
            </span>
            <button
              type="button"
              onClick={() => setBlogSort('fan_desc')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                blogSort === 'fan_desc' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              팬 많은 순
            </button>
            <button
              type="button"
              onClick={() => setBlogSort('visitors_desc')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                blogSort === 'visitors_desc' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              일방문자 순
            </button>
            <button
              type="button"
              onClick={() => setBlogSort('follower_desc')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                blogSort === 'follower_desc' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              이웃 순
            </button>
            <button
              type="button"
              onClick={() => setBlogSort('price_desc')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                blogSort === 'price_desc' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              예상 광고비 순
            </button>
          </div>

          {!isProUser && (
            <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 font-semibold whitespace-nowrap">
              💡 무료 상세 열람 잔여: <strong className="text-slate-900">{Math.max(0, MAX_FREE_VIEWS - viewCount)}회</strong> / {MAX_FREE_VIEWS}회
            </span>
          )}
        </div>

        <div className="text-xs text-slate-500 font-semibold px-1">
          <span>검색된 인플루언서 리스트 ({filteredBloggers.length}명)</span>
        </div>

        {loading ? (
          <div className="p-20 text-center text-sm text-slate-400">인플루언서 데이터를 불러오는 중...</div>
        ) : filteredBloggers.length === 0 ? (
          <div className="p-20 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">일치하는 블로거가 없습니다. 검색어를 조금 더 짧게 입력해 보세요.</div>
        ) : (
          filteredBloggers.map((blogger) => {
            const bKey = String(blogger.blog_id || '').trim().toLowerCase();
            const hKey = String(blogger.handle || '').trim().toLowerCase();
            const posts = blogPostsMap[bKey] || blogPostsMap[hKey] || [];
            const estPrice = Math.round(((blogger.daily_visitors || 0) * 25 + (blogger.fan_count || 0) * 20) / 10000) * 10000;

            return (
              <div 
                key={blogger.blog_id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-md transition space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <img 
                      src={blogger.profile_img_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                      alt={blogger.name} 
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-full border border-slate-200 object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{blogger.name || blogger.blog_id}</h3>
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

                  <div className="flex items-center gap-2">
                    <a
                      href={`mailto:contact@findlist.co.kr?subject=[광고문의] ${blogger.name} 채널 협업 문의`}
                      className="flex items-center gap-1 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <Mail size={13} /> 광고 문의
                    </a>
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(blogger.blog_id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                    >
                      채널 상세 <ChevronRight size={14} />
                    </button>
                  </div>
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
                    <span className="text-slate-400">예상 원고료</span>
                    <p className="text-sm font-black text-emerald-600 mt-0.5">{estPrice.toLocaleString()}원</p>
                  </div>
                </div>

                {/* 채널 상세 페이지와 완전히 동일한 포스트 데이터 맵핑 */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-400">최근 발행 콘텐츠</p>
                  <div className="grid grid-cols-4 gap-3">
                    {posts.length > 0 ? (
                      posts.slice(0, 4).map((p, idx) => (
                        <a 
                          key={idx}
                          href={p.post_url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="group relative block rounded-xl border border-slate-100 overflow-hidden bg-slate-100 hover:shadow-md transition aspect-video"
                        >
                          <img 
                            src={p.thumbnail_url || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=300'} 
                            alt={p.title} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />

                          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center items-center text-center p-3 text-white space-y-1.5">
                            <p className="text-[11px] font-bold line-clamp-2 px-1">{p.title}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-300 pt-1">
                              <span className="flex items-center gap-0.5"><Calendar size={10} /> {p.published_at || '2026.10.02'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] font-semibold pt-1">
                              <span className="text-rose-400 flex items-center gap-1"><Heart size={12} fill="currentColor" /> {p.like_count || 30}</span>
                              <span className="text-blue-400 flex items-center gap-1"><MessageSquare size={12} fill="currentColor" /> {p.comment_count || 5}</span>
                            </div>
                          </div>
                        </a>
                      ))
                    ) : (
                      <div className="col-span-4 p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        최근 발행된 콘텐츠가 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

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
    </div>
  );
}
