'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  getFavorites, toggleFavoriteItem, addBulkFavorites, FavoriteItem 
} from '@/lib/favorites';
import { 
  Search, ChevronRight, Eye, Mail, Bookmark, CheckSquare, Square, Check, Zap, ArrowUpDown 
} from 'lucide-react';

const BLOG_CATEGORIES = [
  '전체', '여행', '패션', '뷰티', '푸드', 'IT테크', '자동차', '리빙', '육아', '생활건강', '게임', '동물·펫', '운동·레저', '경제·비즈니스'
];

type SortOption = 'fans' | 'visitors' | 'neighbors' | 'price';

const cleanId = (val: any): string => {
  if (!val) return '';
  return String(val).trim().replace(/^@+/, '');
};

export default function BlogInfluencerPage() {
  const router = useRouter();
  const [isProUser, setIsProUser] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [sortBy, setSortBy] = useState<SortOption>('fans');

  const [blogs, setBlogs] = useState<any[]>([]);
  const [postsMap, setPostsMap] = useState<Record<string, any[]>>({});
  const [matchedPostBlogIds, setMatchedPostBlogIds] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);

  // 체크박스 다중 선택 및 즐겨찾기 상태
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [favoritesMap, setFavoritesMap] = useState<Record<string, FavoriteItem>>({});

  useEffect(() => {
    setFavoritesMap(getFavorites());
    const handleSync = () => setFavoritesMap(getFavorites());
    window.addEventListener('favorites-updated', handleSync);
    return () => window.removeEventListener('favorites-updated', handleSync);
  }, []);

  // 1. 초기 블로그 인플루언서 전체 로드
  useEffect(() => {
    const fetchAllBlogs = async () => {
      setLoading(true);
      try {
        let allBlogs: any[] = [];
        const step = 1000;
        for (let i = 0; i < 5; i++) {
          const { data, error } = await supabase
            .from('blog_influencers')
            .select('*')
            .range(i * step, (i + 1) * step - 1);

          if (error) {
            console.error('블로거 로드 에러:', error);
            break;
          }
          if (data && data.length > 0) {
            allBlogs = allBlogs.concat(data);
            if (data.length < step) break;
          } else {
            break;
          }
        }
        setBlogs(allBlogs);
      } finally {
        setLoading(false);
      }
    };
    fetchAllBlogs();
  }, []);

  // 2. 검색어/카테고리 변경 시 blog_posts 최신글 제목(title)까지 역추적
  useEffect(() => {
    const keyword = search.trim() || (selectedCategory !== '전체' ? selectedCategory : '');
    if (!keyword) {
      setMatchedPostBlogIds(new Set());
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const mainKw = keyword.split(/\s+/).filter(Boolean)[0];
        const { data: matchedPosts } = await supabase
          .from('blog_posts')
          .select('blog_id, influencer_id')
          .ilike('title', `%${mainKw}%`)
          .limit(300);

        if (matchedPosts && matchedPosts.length > 0) {
          const bidSet = new Set<string>();
          matchedPosts.forEach((p: any) => {
            const bid = cleanId(p.blog_id || p.influencer_id).toLowerCase();
            if (bid) bidSet.add(bid);
          });
          setMatchedPostBlogIds(bidSet);
        } else {
          setMatchedPostBlogIds(new Set());
        }
      } catch (err) {
        console.error(err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  // 3. 블로거 수치 추출 헬퍼
  const getBlogMetrics = (item: any) => {
    const fans = Number(item.fan_count ?? item.follower_count ?? item.follwer_count ?? item.fans ?? 0);
    const visitors = Number(item.daily_visitors ?? item.avg_visitors ?? item.visitor_count ?? item.avg_views ?? 0);
    const neighbors = Number(item.neighbor_count ?? item.neighbors ?? item.subscriber_count ?? 0);
    const price = Number(item.estimated_price ?? item.ad_price ?? item.manuscript_fee ?? (fans > 0 ? Math.round((fans * 3.5 + visitors * 10) / 10000) * 10000 : 300000));
    return { fans, visitors, neighbors, price };
  };

  // 4. 필터링 및 정렬
  const displayedBlogs = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = blogs.filter((item) => {
      const bIdLower = cleanId(item.blog_id || item.handle || item.id).toLowerCase();
      const tagsStr = Array.isArray(item.tags) ? item.tags.join(' ') : String(item.tags || '');

      const fullBlogText = [
        item.name, item.nickname, item.blog_id, item.handle, item.category, item.specialty, item.description, item.bio, tagsStr
      ].filter(Boolean).join(' ').toLowerCase();

      const isMatchedFromPosts = matchedPostBlogIds.has(bIdLower);

      if (selectedCategory !== '전체') {
        const catLower = selectedCategory.toLowerCase();
        const subCats = catLower.split(/[·/]/).filter(Boolean);
        const catMatch = subCats.some(sc => fullBlogText.includes(sc)) || isMatchedFromPosts;
        if (!catMatch) return false;
      }

      if (!q) return true;
      const keywords = q.split(/\s+/).filter(Boolean);
      return keywords.some(kw => fullBlogText.includes(kw)) || isMatchedFromPosts;
    });

    const sorted = [...filtered].sort((a, b) => {
      const mA = getBlogMetrics(a);
      const mB = getBlogMetrics(b);
      if (sortBy === 'fans') return mB.fans - mA.fans;
      if (sortBy === 'visitors') return mB.visitors - mA.visitors;
      if (sortBy === 'neighbors') return mB.neighbors - mA.neighbors;
      if (sortBy === 'price') return mB.price - mA.price;
      return 0;
    });

    return {
      list: sorted.slice(0, 50),
      totalCount: sorted.length
    };
  }, [blogs, search, selectedCategory, sortBy, matchedPostBlogIds]);

  // 5. 현재 화면에 노출된 블로거들의 최신 포스팅 4개씩 개별 병렬 조회
  useEffect(() => {
    const fetchPostsForDisplayed = async () => {
      const targetBlogs = displayedBlogs.list.filter(b => {
        const key = cleanId(b.blog_id || b.handle || b.id).toLowerCase();
        return key && !postsMap[key];
      });

      if (targetBlogs.length === 0) return;

      setPostsLoading(true);
      try {
        const newEntries: Record<string, any[]> = {};

        await Promise.all(
          targetBlogs.map(async (blog) => {
            const rawBid = cleanId(blog.blog_id || blog.handle || blog.id);
            const mapKey = rawBid.toLowerCase();
            if (!mapKey) return;

            const { data: pData } = await supabase
              .from('blog_posts')
              .select('*')
              .eq('blog_id', rawBid)
              .order('published_at', { ascending: false })
              .limit(4);

            newEntries[mapKey] = pData && pData.length > 0 ? pData : [];
          })
        );

        setPostsMap(prev => ({ ...prev, ...newEntries }));
      } finally {
        setPostsLoading(false);
      }
    };

    fetchPostsForDisplayed();
  }, [displayedBlogs.list]);

  const toFavoriteItem = (blog: any): FavoriteItem => {
    const bId = cleanId(blog.blog_id || blog.handle || blog.id);
    const { fans, visitors, neighbors, price } = getBlogMetrics(blog);
    const rawTags = Array.isArray(blog.tags) 
      ? blog.tags 
      : (typeof blog.tags === 'string' && blog.tags.trim() !== '' ? blog.tags.split(',') : [blog.category || '전문블로거']);

    return {
      id: bId,
      platform: 'blog',
      name: blog.name || blog.nickname || bId,
      handle: cleanId(blog.handle || blog.blog_id || bId),
      profile_img_url: blog.profile_img_url || blog.profile_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      tags: rawTags.map((t: string) => String(t).trim().replace(/^#+/, '')),
      metric1: fans,
      metric2: visitors,
      metric3: neighbors,
      base_price: price,
      added_at: new Date().toISOString()
    };
  };

  const toggleSelectBlog = (bId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(bId)) next.delete(bId);
      else next.add(bId);
      return next;
    });
  };

  const toggleSelectAllDisplayed = () => {
    const currentIds = displayedBlogs.list.map(b => cleanId(b.blog_id || b.handle || b.id));
    const allSelected = currentIds.length > 0 && currentIds.every(id => selectedIds.has(id));

    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentIds));
    }
  };

  const handleBulkAddFavorites = () => {
    const selectedBlogs = blogs.filter(b => selectedIds.has(cleanId(b.blog_id || b.handle || b.id)));
    const items = selectedBlogs.map(toFavoriteItem);
    addBulkFavorites(items);
    setSelectedIds(new Set());
    alert(`${items.length}명의 블로거가 즐겨찾기에 추가되었습니다!`);
  };

  const allDisplayedSelected = displayedBlogs.list.length > 0 && 
    displayedBlogs.list.every(b => selectedIds.has(cleanId(b.blog_id || b.handle || b.id)));

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-y-auto relative pb-24">
      {/* 상단 검색 및 카테고리 영역 (모바일 여백 축소 및 검색창 확대) */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 sticky top-0 z-20 space-y-2.5 shadow-2xs">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="찾고 싶은 블로그 키워드나 주제를 입력하세요 (예: 화장품, 맛집, 여행)" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-xs md:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition shadow-inner"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
              type="button"
              onClick={() => router.push('/favorites')}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap"
            >
              <Bookmark size={14} className="text-emerald-600 fill-emerald-600" />
              즐겨찾기 ({Object.keys(favoritesMap).length})
            </button>
            <button 
              type="button"
              onClick={() => setIsProUser(!isProUser)}
              className={`flex-1 md:flex-initial text-xs font-bold text-white px-4 py-2.5 rounded-xl transition cursor-pointer shadow-md whitespace-nowrap ${
                isProUser ? 'bg-gradient-to-r from-emerald-600 to-teal-500' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isProUser ? '👑 PRO 이용중' : '🔒 PRO 업그레이드'}
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 flex-shrink-0 mr-1">
            카테고리:
          </span>
          {BLOG_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                selectedCategory === cat ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full p-4 md:p-8 space-y-4">
        {/* 정렬 탭 & 안내 바 */}
        <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs overflow-x-auto w-full md:w-auto">
            <span className="font-bold text-slate-400 flex items-center gap-1 mr-1 flex-shrink-0">
              <ArrowUpDown size={12} /> 정렬:
            </span>
            {[
              { key: 'fans', label: '팬 많은 순' },
              { key: 'visitors', label: '일방문자 순' },
              { key: 'neighbors', label: '이웃 순' },
              { key: 'price', label: '예상 광고비 순' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSortBy(opt.key as SortOption)}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex-shrink-0 ${
                  sortBy === opt.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            <Zap size={12} className="fill-amber-500 text-amber-500" />
            <span>{isProUser ? 'PRO 무제한 열람 중' : '무료 열람 잔여: 3회'}</span>
          </div>
        </div>

        {/* 전체 선택 & 카운트 바 */}
        <div className="text-xs text-slate-500 font-semibold px-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAllDisplayed}
              className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 font-bold cursor-pointer"
            >
              {allDisplayedSelected ? (
                <CheckSquare size={16} className="text-emerald-600" />
              ) : (
                <Square size={16} className="text-slate-400" />
              )}
              <span>전체 선택 ({selectedIds.size}명)</span>
            </button>
            <span className="text-slate-300">|</span>
            <span>검색 결과 ({displayedBlogs.totalCount}명)</span>
          </div>

          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={handleBulkAddFavorites}
              className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <Bookmark size={12} /> 즐겨찾기 추가 ({selectedIds.size})
            </button>
          )}
        </div>

        {/* 블로그 리스트 렌더링 (모바일 최적화 세로형/그리드 배치) */}
        {loading ? (
          <div className="p-16 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">
            블로그 인플루언서 목록을 불러오는 중입니다...
          </div>
        ) : displayedBlogs.list.length === 0 ? (
          <div className="p-16 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">
            조건에 일치하는 블로그 인플루언서가 없습니다.
          </div>
        ) : (
          displayedBlogs.list.map((blog) => {
            const bId = cleanId(blog.blog_id || blog.handle || blog.id);
            const bIdKey = bId.toLowerCase();
            const pList = postsMap[bIdKey] || [];
            const isBlogPostLoaded = bIdKey in postsMap;

            const isChecked = selectedIds.has(bId);
            const favKey = `blog_${bId}`;
            const isFavorited = Boolean(favoritesMap[favKey]);

            const { fans, visitors, neighbors, price } = getBlogMetrics(blog);
            const customPrice = favoritesMap[favKey]?.custom_price;

            const profileImg = blog.profile_img_url || blog.profile_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
            const rawTags = Array.isArray(blog.tags) 
              ? blog.tags 
              : (typeof blog.tags === 'string' && blog.tags.trim() !== '' ? blog.tags.split(',') : [`${blog.category || '생활건강'} 전문블로거`]);

            return (
              <div 
                key={blog.id || bId}
                className={`bg-white rounded-2xl border p-4 md:p-6 shadow-2xs hover:shadow-md transition space-y-3.5 ${
                  isChecked ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-slate-200'
                }`}
              >
                {/* 프로필 정보 영역 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleSelectBlog(bId)}
                      className={`mt-3 w-5 h-5 rounded-md flex items-center justify-center border transition cursor-pointer flex-shrink-0 ${
                        isChecked 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : 'bg-white border-slate-300 hover:border-emerald-600'
                      }`}
                    >
                      {isChecked && <Check size={13} strokeWidth={3} />}
                    </button>

                    <img 
                      src={profileImg} 
                      alt={blog.name || bId} 
                      referrerPolicy="no-referrer"
                      onClick={() => toggleSelectBlog(bId)}
                      className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-slate-200 object-cover flex-shrink-0 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm md:text-base font-bold text-slate-900 truncate">{blog.name || blog.nickname || bId}</h3>
                        <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold rounded">
                          INFLUENCER
                        </span>
                      </div>
                      <p className="text-[11px] md:text-xs text-slate-400 mt-0.5 truncate">@{cleanId(blog.handle || blog.blog_id || bId)}</p>
                      
                      <div className="flex flex-wrap gap-1 mt-1.5 max-h-16 overflow-y-auto">
                        {rawTags.map((t: string, i: number) => (
                          <span key={i} className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 whitespace-nowrap">
                            #{String(t).trim().replace(/^#+/, '')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 모바일에서 깨지지 않는 3분할 액션 버튼 */}
                <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => toggleFavoriteItem(toFavoriteItem(blog))}
                    className={`py-2 px-1 border rounded-xl transition flex items-center justify-center gap-1 truncate ${
                      isFavorited ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Bookmark size={12} className={isFavorited ? 'fill-amber-500 text-amber-500' : ''} />
                    {isFavorited ? '저장됨' : '즐겨찾기'}
                  </button>

                  <a
                    href={`mailto:${blog.contact_email || `${bId}@naver.com`}?subject=[블로그 원고/협업문의] ${blog.name || bId} 인플루언서님께`}
                    className="py-2 px-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl transition flex items-center justify-center gap-1 truncate"
                  >
                    <Mail size={12} /> 광고문의
                  </a>

                  <button
                    type="button"
                    onClick={() => router.push(`/blog/${bId}`)}
                    className="py-2 px-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition shadow-xs flex items-center justify-center gap-1 truncate"
                  >
                    채널상세 <ChevronRight size={12} />
                  </button>
                </div>

                {/* 블로그 핵심 지표 2x2 그리드 */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">인플루언서 팬</span>
                    <p className="text-xs font-black text-slate-900 mt-0.5">{fans.toLocaleString()}명</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">일일 평균 방문자</span>
                    <p className="text-xs font-black text-emerald-600 mt-0.5">{visitors.toLocaleString()}명</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">이웃 수</span>
                    <p className="text-xs font-black text-slate-900 mt-0.5">{neighbors.toLocaleString()}명</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">예상 원고료</span>
                    <p className="text-xs font-black text-emerald-600 mt-0.5">
                      {customPrice != null ? `${Number(customPrice).toLocaleString()}원` : `${price.toLocaleString()}원`}
                    </p>
                  </div>
                </div>

                {/* 최근 발행 콘텐츠 (썸네일 그리드) */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-400">최근 발행 콘텐츠</p>
                  {pList.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {pList.map((p: any, i: number) => {
                        const thumb = p.thumbnail_url || p.thumbnail || p.image_url || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=300';
                        const title = p.title || p.post_title || '블로그 포스팅';

                        return (
                          <a 
                            key={i} 
                            href={p.post_url || p.url || `https://blog.naver.com/${bId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="group relative block rounded-xl border border-slate-100 overflow-hidden bg-slate-100 aspect-video"
                          >
                            <img src={thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/75 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center items-center text-center p-2 text-white space-y-1">
                              <p className="text-[10px] font-bold line-clamp-2 px-1">{title}</p>
                              <span className="text-[9px] text-emerald-300 flex items-center gap-0.5"><Eye size={9} /> 보러가기</span>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  ) : !isBlogPostLoaded && postsLoading ? (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-slate-400">
                      최근 발행 포스팅 불러오는 중...
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-slate-400">
                      등록된 포스팅 썸네일이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 하단 플로팅 다중 선택 액션 바 */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 md:px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 md:gap-6 border border-slate-700 text-xs">
          <span className="font-bold">
            선택 <strong className="text-emerald-400">{selectedIds.size}명</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleBulkAddFavorites}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition cursor-pointer"
            >
              즐겨찾기 추가
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-2 text-slate-400 hover:text-white cursor-pointer"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
