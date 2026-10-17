'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Bookmark, Search, Zap } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const STORAGE_KEY = 'findlist_favorites';

export default function BlogSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [sortBy, setSortBy] = useState<'fan' | 'visit' | 'neighbor' | 'price'>('fan');
  const [channels, setChannels] = useState<any[]>([]);
  const [postsMap, setPostsMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [favoritesMap, setFavoritesMap] = useState<Record<string, any>>({});
  const [isProMode, setIsProMode] = useState(true);
  const [visibleCount, setVisibleCount] = useState(30);

  const loadFavorites = () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setFavoritesMap(raw ? JSON.parse(raw) : {});
    } catch (e) {
      setFavoritesMap({});
    }
  };

  useEffect(() => {
    loadFavorites();
    window.addEventListener('favorites-updated', loadFavorites);
    return () => window.removeEventListener('favorites-updated', loadFavorites);
  }, []);

  // 1단계: 블로그 인플루언서 전체 목록 고속 로드
  useEffect(() => {
    async function fetchBlogChannels() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: infData, error } = await supabase
          .from('blog_influencers')
          .select('*');

        if (error) throw error;
        setChannels(infData || []);
      } catch (err) {
        console.error('Blog channels fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogChannels();
  }, []);

  const getAvatar = (item: any) => {
    const candidates = [
      item.profile_img_url,
      item.profile_image,
      item.avatar_url,
      item.thumbnail_url,
      item.img_url,
      item.profile_url
    ];
    for (const c of candidates) {
      if (c && typeof c === 'string' && c.startsWith('http') && !c.includes('blog.naver.com/')) {
        return c;
      }
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || item.blog_name || 'B')}&background=d1fae5&color=047857`;
  };

  const getFans = (item: any) =>
    Number(item.fan_count ?? item.follower_count ?? item.subscribers ?? item.metric1 ?? 0);

  const getVisitors = (item: any) =>
    Number(item.daily_visitors ?? item.avg_visitors ?? item.visitor_count ?? item.metric2 ?? 0);

  const getNeighbors = (item: any) =>
    Number(item.neighbor_count ?? item.neighbors ?? item.metric3 ?? 0);

  const getPrice = (item: any) => {
    const raw = Number(item.estimated_price ?? item.ad_price ?? item.price ?? item.base_price ?? 0);
    if (raw > 0) return raw;
    return 300000;
  };

  // 필터 및 정렬된 전체 블로그 목록
  const filteredChannels = useMemo(() => {
    const list = channels.filter((item) => {
      if (selectedCategory !== '전체') {
        const cat = String(item.category || item.specialty || item.tags || '');
        if (!cat.includes(selectedCategory)) return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const nameMatch = String(item.name || item.blog_name || '').toLowerCase().includes(q);
        const handleMatch = String(item.blog_id || item.handle || '').toLowerCase().includes(q);
        const catMatch = String(item.category || '').toLowerCase().includes(q);
        return nameMatch || handleMatch || catMatch;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'fan') return getFans(b) - getFans(a);
      if (sortBy === 'visit') return getVisitors(b) - getVisitors(a);
      if (sortBy === 'neighbor') return getNeighbors(b) - getNeighbors(a);
      if (sortBy === 'price') return getPrice(b) - getPrice(a);
      return 0;
    });
  }, [channels, selectedCategory, searchQuery, sortBy]);

  const displayedChannels = useMemo(() => {
    return filteredChannels.slice(0, visibleCount);
  }, [filteredChannels, visibleCount]);

  // 2단계: 현재 화면에 노출되는 블로그들의 포스팅만 타겟팅하여 고속 로드
  useEffect(() => {
    async function fetchPostsForVisibleBlogs() {
      if (!supabase || displayedChannels.length === 0) return;

      const blogIds = displayedChannels
        .map(c => c.blog_id)
        .filter(Boolean)
        .map(String);

      const numericIds = displayedChannels
        .map(c => c.id)
        .filter(Boolean);

      try {
        const queries: Promise<any>[] = [];

        if (blogIds.length > 0) {
          queries.push(
            supabase
              .from('blog_posts')
              .select('*')
              .in('blog_id', blogIds)
              .limit(300)
          );
        }

        if (numericIds.length > 0) {
          queries.push(
            supabase
              .from('blog_posts')
              .select('*')
              .in('influencer_id', numericIds)
              .limit(300)
          );
        }

        const results = await Promise.allSettled(queries);
        let combinedPosts: any[] = [];

        results.forEach(res => {
          if (res.status === 'fulfilled' && res.value?.data) {
            combinedPosts = combinedPosts.concat(res.value.data);
          }
        });

        if (combinedPosts.length === 0) {
          const { data: fallbackPosts } = await supabase
            .from('blog_posts')
            .select('*')
            .limit(500);
          if (fallbackPosts) combinedPosts = fallbackPosts;
        }

        if (combinedPosts.length > 0) {
          setPostsMap(prev => {
            const next = { ...prev };
            combinedPosts.forEach((p: any) => {
              const keys = [
                p.blog_id,
                p.influencer_id,
                p.channel_id,
                p.handle,
                p.blog_name
              ]
                .filter(Boolean)
                .map(k => String(k).trim());

              keys.forEach(k => {
                if (!next[k]) next[k] = [];
                const postUniqueId = p.id || p.post_id || p.url || p.title;
                if (
                  next[k].length < 4 &&
                  !next[k].some(x => (x.id || x.post_id || x.url || x.title) === postUniqueId)
                ) {
                  next[k].push(p);
                }
              });
            });
            return next;
          });
        }
      } catch (e) {
        console.error('Blog posts fetch error:', e);
      }
    }

    fetchPostsForVisibleBlogs();
  }, [displayedChannels]);

  const getPosts = (item: any) => {
    const mapKeys = [
      String(item.blog_id || '').trim(),
      String(item.id || '').trim(),
      String(item.handle || '').trim(),
      String(item.name || '').trim()
    ].filter(Boolean);

    for (const k of mapKeys) {
      if (postsMap[k] && postsMap[k].length > 0) {
        return postsMap[k].slice(0, 4);
      }
    }

    const embeddedCandidates = [
      item.posts,
      item.recent_posts,
      item.top_posts,
      item.contents,
      item.blog_posts
    ];

    for (const cand of embeddedCandidates) {
      if (!cand) continue;
      if (Array.isArray(cand) && cand.length > 0) return cand.slice(0, 4);
      if (typeof cand === 'string') {
        try {
          const parsed = JSON.parse(cand);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 4);
        } catch {}
      }
    }

    return [];
  };

  const handleToggleFavorite = (item: any) => {
    const rawId = String(item.blog_id ?? item.id);
    const key = `blog_${rawId}`;
    const nextFavs = { ...favoritesMap };

    if (nextFavs[key]) {
      delete nextFavs[key];
    } else {
      nextFavs[key] = {
        id: rawId,
        blog_id: item.blog_id || rawId,
        platform: 'blog',
        name: item.name || item.blog_name || rawId,
        handle: String(item.blog_id || item.handle || rawId).replace(/^@/, ''),
        profile_img_url: getAvatar(item),
        tags: [item.category || '블로그'],
        metric1: getFans(item),
        metric2: getVisitors(item),
        metric3: getNeighbors(item),
        base_price: getPrice(item),
        folder: '기본 폴더',
        custom_memo: '',
        added_at: new Date().toISOString()
      };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFavs));
    setFavoritesMap(nextFavs);
    window.dispatchEvent(new Event('favorites-updated'));
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === displayedChannels.length && displayedChannels.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedChannels.map(c => String(c.blog_id ?? c.id))));
    }
  };

  const handleToggleCheckbox = (rawId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(rawId)) next.delete(rawId);
      else next.add(rawId);
      return next;
    });
  };

  const handleBulkFavorite = () => {
    if (selectedIds.size === 0) {
      alert('선택된 블로그가 없습니다.');
      return;
    }

    const nextFavs = { ...favoritesMap };
    let count = 0;

    filteredChannels.forEach(item => {
      const rawId = String(item.blog_id ?? item.id);
      if (selectedIds.has(rawId)) {
        const key = `blog_${rawId}`;
        if (!nextFavs[key]) {
          nextFavs[key] = {
            id: rawId,
            blog_id: item.blog_id || rawId,
            platform: 'blog',
            name: item.name || item.blog_name || rawId,
            handle: String(item.blog_id || item.handle || rawId).replace(/^@/, ''),
            profile_img_url: getAvatar(item),
            tags: [item.category || '블로그'],
            metric1: getFans(item),
            metric2: getVisitors(item),
            metric3: getNeighbors(item),
            base_price: getPrice(item),
            folder: '기본 폴더',
            custom_memo: '',
            added_at: new Date().toISOString()
          };
          count++;
        }
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFavs));
    setFavoritesMap(nextFavs);
    window.dispatchEvent(new Event('favorites-updated'));
    alert(`선택한 블로그 중 ${count}개가 즐겨찾기에 추가되었습니다.`);
    setSelectedIds(new Set());
  };

  const handleGoDetail = (item: any) => {
    const targetId = item.blog_id ?? item.id;
    router.push(`/blog/${encodeURIComponent(String(targetId))}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-y-auto relative pb-24">
      {/* 상단 고정 검색 바 */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-3.5 sticky top-0 z-20 shadow-2xs space-y-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="찾고 싶은 블로그 키워드나 주제를 입력하세요 (예: 화장품, 맛집, 여행)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(30);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsProMode(!isProMode)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border whitespace-nowrap ${
                isProMode 
                  ? 'bg-amber-50 text-amber-700 border-amber-300' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <Zap size={13} className={isProMode ? 'fill-amber-500 text-amber-500' : ''} />
              PRO 모드: {isProMode ? 'ON' : 'OFF'}
            </button>

            <button 
              type="button"
              onClick={() => router.push('/favorites')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Bookmark size={13} /> 즐겨찾기 ({Object.keys(favoritesMap).length})
            </button>
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="max-w-6xl mx-auto flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
          {['전체', '여행', '패션', '뷰티', '푸드', 'IT테크', '자동차', '리빙', '육아', '생활건강', '게임', '동물·펫', '운동·레저', '경제·비즈니스'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setVisibleCount(30);
              }}
              className={`px-3 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full p-4 md:p-6 space-y-3">
        {/* 정렬 및 일괄 추가 바 */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input 
                type="checkbox"
                checked={selectedIds.size === displayedChannels.length && displayedChannels.length > 0}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              전체 선택 ({selectedIds.size})
            </label>
            <span className="text-xs text-slate-400">| 검색 결과 ({filteredChannels.length}명)</span>

            <div className="flex items-center gap-1 ml-2">
              {[
                { key: 'fan', label: '팬 많은 순' },
                { key: 'visit', label: '일방문자 순' },
                { key: 'neighbor', label: '이웃 순' },
                { key: 'price', label: '예상 광고비 순' },
              ].map(s => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    setSortBy(s.key as any);
                    setVisibleCount(30);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    sortBy === s.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleBulkFavorite}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <Bookmark size={13} /> 즐겨찾기 추가 ({selectedIds.size})
          </button>
        </div>

        {/* 블로그 카드 리스트 */}
        {loading ? (
          <div className="p-16 text-center text-xs font-bold text-slate-400 bg-white rounded-2xl border border-slate-200">
            블로그 인플루언서 데이터를 불러오는 중입니다...
          </div>
        ) : displayedChannels.length === 0 ? (
          <div className="p-16 text-center text-xs font-bold text-slate-400 bg-white rounded-2xl border border-slate-200">
            조건에 맞는 블로그 인플루언서가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {displayedChannels.map((item) => {
              const rawId = String(item.blog_id ?? item.id);
              const isChecked = selectedIds.has(rawId);
              const isFav = Boolean(favoritesMap[`blog_${rawId}`]);
              const posts = getPosts(item);

              return (
                <div 
                  key={rawId}
                  className={`bg-white rounded-2xl border transition p-4 space-y-3 shadow-2xs ${
                    isChecked ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200'
                  }`}
                >
                  {/* 상단 1줄: 프로필 + 우측 컴팩트 액션 버튼 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleCheckbox(rawId)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                      />
                      <img 
                        src={getAvatar(item)} 
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        onClick={() => handleGoDetail(item)}
                        className="w-11 h-11 rounded-full border border-slate-200 object-cover flex-shrink-0 bg-slate-100 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 
                            onClick={() => handleGoDetail(item)}
                            className="text-sm font-black text-slate-900 truncate cursor-pointer hover:text-emerald-600 transition"
                          >
                            {item.name || item.blog_name || rawId}
                          </h3>
                          <span className="text-[10px] px-1.5 py-0.5 font-extrabold rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                            INFLUENCER
                          </span>
                          {item.category && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                              #{item.category}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">@{item.blog_id || item.handle || rawId}</p>
                      </div>
                    </div>

                    {/* 우측 상단 컴팩트 액션 버튼 3개 */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(item)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 border cursor-pointer whitespace-nowrap ${
                          isFav 
                            ? 'bg-emerald-600 text-white border-emerald-600' 
                            : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-500 hover:text-emerald-600'
                        }`}
                      >
                        <Bookmark size={12} className={isFav ? 'fill-white' : ''} />
                        {isFav ? '저장됨' : '즐겨찾기'}
                      </button>

                      <button
                        type="button"
                        onClick={() => alert('광고문의 접수가 가능합니다.')}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
                      >
                        광고문의
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGoDetail(item)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
                      >
                        채널상세 &gt;
                      </button>
                    </div>
                  </div>

                  {/* 중앙 1줄: 4칸 핵심 지표 (모바일 좌우 스크롤 지원) */}
                  <div className="overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-2.5 min-w-[580px] text-xs">
                      <div className="flex-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block">인플루언서 팬</span>
                        <strong className="text-slate-900 font-black">{getFans(item).toLocaleString()}명</strong>
                      </div>
                      <div className="flex-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block">일일 평균 방문자</span>
                        <strong className="text-emerald-600 font-black">{getVisitors(item).toLocaleString()}명</strong>
                      </div>
                      <div className="flex-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block">이웃 수</span>
                        <strong className="text-slate-900 font-black">{getNeighbors(item).toLocaleString()}명</strong>
                      </div>
                      <div className="flex-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block">예상 원고료</span>
                        <strong className="text-red-600 font-black">
                          {isProMode ? `${getPrice(item).toLocaleString()}원` : 'PRO 전용'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* 하단: 최근 발행 콘텐츠 4개 미리보기 */}
                  {posts.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-400 block">최근 발행 콘텐츠</span>
                      <div className="flex sm:grid sm:grid-cols-4 gap-2.5 overflow-x-auto no-scrollbar pb-1">
                        {posts.map((p: any, idx: number) => {
                          const thumb = p.thumbnail_url || p.img_url || p.image_url || p.img || '';
                          const title = p.title || p.post_title || '최신 포스팅';
                          const link = p.url || p.post_url || '';

                          return (
                            <div 
                              key={idx}
                              onClick={() => link && window.open(link, '_blank')}
                              className="group relative min-w-[180px] sm:min-w-0 rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 flex-shrink-0 cursor-pointer"
                            >
                              {thumb ? (
                                <img 
                                  src={thumb} 
                                  alt={title} 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-400">이미지 없음</div>
                              )}
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-5">
                                <p className="text-[11px] text-white font-bold truncate">{title}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 더보기 버튼 */}
            {visibleCount < filteredChannels.length && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount(prev => prev + 30)}
                  className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 shadow-2xs transition cursor-pointer"
                >
                  블로그 더보기 ({visibleCount} / {filteredChannels.length}명)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
