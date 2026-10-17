'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Bookmark, Search, Zap, ExternalLink } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const STORAGE_KEY = 'findlist_favorites';

export default function YoutubeSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [sortBy, setSortBy] = useState<'sub' | 'long' | 'shorts' | 'price'>('sub');
  const [channels, setChannels] = useState<any[]>([]);
  const [postsMap, setPostsMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [favoritesMap, setFavoritesMap] = useState<Record<string, any>>({});
  const [isProMode, setIsProMode] = useState(true);

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

  useEffect(() => {
    async function fetchYoutubeDB() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [infRes, postRes] = await Promise.all([
          supabase.from('influencers').select('*').order('id', { ascending: true }),
          supabase.from('influencer_posts').select('*')
        ]);

        const infData = infRes.data || [];
        const postData = postRes.data || [];

        const grouped: Record<string, any[]> = {};
        postData.forEach((p: any) => {
          const keys = [
            p.channel_id,
            p.influencer_id,
            p.handle,
            p.id
          ].filter(Boolean).map(k => String(k).trim());

          keys.forEach(k => {
            if (!grouped[k]) grouped[k] = [];
            if (grouped[k].length < 4 && !grouped[k].some(x => x.id === p.id)) {
              grouped[k].push(p);
            }
          });
        });

        setPostsMap(grouped);
        setChannels(infData);
      } catch (err) {
        console.error('Youtube DB fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchYoutubeDB();
  }, []);

  // DB 컬럼 자동 추출 헬퍼 (실제 DB 컬럼명 완벽 대응)
  const getAvatar = (item: any) => {
    const candidates = [
      item.profile_img_url,
      item.profile_image,
      item.avatar_url,
      item.thumbnail_url,
      item.img_url,
      item.profile_img
    ];
    for (const c of candidates) {
      if (c && typeof c === 'string' && c.startsWith('http') && !c.includes('youtube.com/@') && !c.includes('youtube.com/channel/')) {
        return c;
      }
    }
    if (item.profile_url && typeof item.profile_url === 'string' && item.profile_url.startsWith('http') && !item.profile_url.includes('youtube.com/')) {
      return item.profile_url;
    }
    const handleClean = String(item.channel_id || item.name || 'YT').replace(/^@/, '');
    return `https://unavatar.io/youtube/${encodeURIComponent(handleClean)}?fallback=https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'YT')}&background=fee2e2&color=dc2626`;
  };

  const getSubscribers = (item: any) =>
    Number(item.subscriber_count ?? item.subscribers ?? item.follower_count ?? item.fan_count ?? item.metric1 ?? 0);

  const getLongViews = (item: any) =>
    Number(item.avg_views ?? item.average_views ?? item.long_views ?? item.avg_long_views ?? item.view_count ?? item.daily_visitors ?? item.metric2 ?? 0);

  const getShortsViews = (item: any) =>
    Number(item.shorts_views ?? item.avg_shorts_views ?? item.short_views ?? item.neighbor_count ?? item.metric3 ?? 0);

  const getPrice = (item: any) => {
    const raw = Number(item.estimated_price ?? item.ad_price ?? item.price ?? item.base_price ?? 0);
    if (raw > 0) return raw;
    const subs = getSubscribers(item);
    return subs > 0 ? Math.round((subs * 15) / 10000) * 10000 : 300000;
  };

  const getVideos = (item: any) => {
    const candidates = [
      postsMap[String(item.channel_id || '').trim()],
      postsMap[String(item.id || '').trim()],
      postsMap[String(item.channel_id || '').replace(/^@/, '').trim()],
      Array.isArray(item.videos) ? item.videos : null,
      Array.isArray(item.recent_videos) ? item.recent_videos : null,
      Array.isArray(item.posts) ? item.posts : null,
    ];
    for (const list of candidates) {
      if (list && list.length > 0) return list.slice(0, 4);
    }
    return [];
  };

  const filteredChannels = useMemo(() => {
    const list = channels.filter((item) => {
      if (selectedCategory !== '전체') {
        const cat = String(item.category || item.tags || '');
        if (!cat.includes(selectedCategory)) return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const nameMatch = String(item.name || '').toLowerCase().includes(q);
        const handleMatch = String(item.channel_id || item.handle || '').toLowerCase().includes(q);
        const catMatch = String(item.category || '').toLowerCase().includes(q);
        return nameMatch || handleMatch || catMatch;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'sub') return getSubscribers(b) - getSubscribers(a);
      if (sortBy === 'long') return getLongViews(b) - getLongViews(a);
      if (sortBy === 'shorts') return getShortsViews(b) - getShortsViews(a);
      if (sortBy === 'price') return getPrice(b) - getPrice(a);
      return 0;
    });
  }, [channels, selectedCategory, searchQuery, sortBy]);

  const handleToggleFavorite = (item: any) => {
    const rawId = String(item.id ?? item.channel_id);
    const key = `youtube_${rawId}`;
    const nextFavs = { ...favoritesMap };

    if (nextFavs[key]) {
      delete nextFavs[key];
    } else {
      nextFavs[key] = {
        id: rawId,
        channel_id: item.channel_id || rawId,
        platform: 'youtube',
        name: item.name || '이름 없음',
        handle: String(item.channel_id || item.handle || rawId).replace(/^@/, ''),
        profile_img_url: getAvatar(item),
        tags: [item.category || '유튜브'],
        metric1: getSubscribers(item),
        metric2: getLongViews(item),
        metric3: getShortsViews(item),
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
    if (selectedIds.size === filteredChannels.length && filteredChannels.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredChannels.map(c => String(c.id ?? c.channel_id))));
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
      alert('선택된 채널이 없습니다.');
      return;
    }

    const nextFavs = { ...favoritesMap };
    let count = 0;

    filteredChannels.forEach(item => {
      const rawId = String(item.id ?? item.channel_id);
      if (selectedIds.has(rawId)) {
        const key = `youtube_${rawId}`;
        if (!nextFavs[key]) {
          nextFavs[key] = {
            id: rawId,
            channel_id: item.channel_id || rawId,
            platform: 'youtube',
            name: item.name || '이름 없음',
            handle: String(item.channel_id || item.handle || rawId).replace(/^@/, ''),
            profile_img_url: getAvatar(item),
            tags: [item.category || '유튜브'],
            metric1: getSubscribers(item),
            metric2: getLongViews(item),
            metric3: getShortsViews(item),
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
    alert(`선택한 채널 중 ${count}개가 즐겨찾기에 추가되었습니다.`);
    setSelectedIds(new Set());
  };

  const handleGoDetail = (item: any) => {
    // DB의 id 또는 channel_id로 상세 페이지 이동
    const targetId = item.id ?? item.channel_id;
    router.push(`/youtube/${encodeURIComponent(String(targetId))}`);
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
              placeholder="유튜버 이름, 핸들(@), 키워드 입력"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Bookmark size={13} /> 즐겨찾기 ({Object.keys(favoritesMap).length})
            </button>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="max-w-6xl mx-auto flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
          {['전체', '엔터테인먼트', '게임', '음악', '키즈', '푸드', 'IT테크', '취미', '스포츠', '패션·뷰티', '경제·뉴스'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full p-4 md:p-6 space-y-3">
        {/* 정렬 및 전체 선택 액션 바 */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input 
                type="checkbox"
                checked={selectedIds.size === filteredChannels.length && filteredChannels.length > 0}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 rounded text-red-500 focus:ring-red-500 cursor-pointer"
              />
              전체 선택 ({selectedIds.size})
            </label>
            <span className="text-xs text-slate-400">| 검색 결과 ({filteredChannels.length}명)</span>

            <div className="flex items-center gap-1 ml-2">
              {[
                { key: 'sub', label: '구독자 순' },
                { key: 'long', label: '롱폼 조회수 순' },
                { key: 'shorts', label: '숏츠 조회수 순' },
                { key: 'price', label: '예상 광고비 순' },
              ].map(s => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSortBy(s.key as any)}
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
            className="px-3.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <Bookmark size={13} /> 즐겨찾기 추가 ({selectedIds.size})
          </button>
        </div>

        {/* 채널 리스트 */}
        {loading ? (
          <div className="p-16 text-center text-xs font-bold text-slate-400 bg-white rounded-2xl border border-slate-200">
            유튜브 채널 데이터를 불러오는 중입니다...
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="p-16 text-center text-xs font-bold text-slate-400 bg-white rounded-2xl border border-slate-200">
            조건에 맞는 유튜버가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChannels.map((item) => {
              const rawId = String(item.id ?? item.channel_id);
              const isChecked = selectedIds.has(rawId);
              const isFav = Boolean(favoritesMap[`youtube_${rawId}`]);
              const videos = getVideos(item);

              return (
                <div 
                  key={rawId}
                  className={`bg-white rounded-2xl border transition p-4 space-y-3 shadow-2xs ${
                    isChecked ? 'border-red-500 bg-red-50/10' : 'border-slate-200'
                  }`}
                >
                  {/* 상단 1줄: 좌측 프로필 정보 + 우측 컴팩트 버튼 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleCheckbox(rawId)}
                        className="w-4 h-4 rounded text-red-500 focus:ring-red-500 cursor-pointer flex-shrink-0"
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
                            className="text-sm font-black text-slate-900 truncate cursor-pointer hover:text-red-600 transition"
                          >
                            {item.name}
                          </h3>
                          <span className="text-[10px] px-1.5 py-0.5 font-extrabold rounded bg-red-50 text-red-600 border border-red-100 uppercase">
                            YOUTUBE
                          </span>
                          {item.category && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              #{item.category}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {String(item.channel_id || item.handle || '').startsWith('@') 
                            ? (item.channel_id || item.handle) 
                            : `@${item.channel_id || item.handle || item.id}`}
                        </p>
                      </div>
                    </div>

                    {/* 우측 상단 컴팩트 액션 버튼 3개 */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(item)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 border cursor-pointer whitespace-nowrap ${
                          isFav 
                            ? 'bg-red-500 text-white border-red-500' 
                            : 'bg-white text-slate-700 border-slate-300 hover:border-red-500 hover:text-red-500'
                        }`}
                      >
                        <Bookmark size={12} className={isFav ? 'fill-white' : ''} />
                        {isFav ? '저장됨' : '즐겨찾기'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (item.profile_url && String(item.profile_url).startsWith('http')) {
                            window.open(item.profile_url, '_blank');
                          } else {
                            alert('광고문의 접수가 가능합니다.');
                          }
                        }}
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
                        <span className="text-[10px] text-slate-400 block">구독자 수</span>
                        <strong className="text-slate-900 font-black">{getSubscribers(item).toLocaleString()}명</strong>
                      </div>
                      <div className="flex-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block">평균 조회수 (롱폼)</span>
                        <strong className="text-red-500 font-black">{getLongViews(item).toLocaleString()}회</strong>
                      </div>
                      <div className="flex-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block">평균 조회수 (숏츠)</span>
                        <strong className="text-slate-900 font-black">{getShortsViews(item).toLocaleString()}회</strong>
                      </div>
                      <div className="flex-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block">예상 광고 단가</span>
                        <strong className="text-red-600 font-black">
                          {isProMode ? `${getPrice(item).toLocaleString()}원` : 'PRO 전용'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* 하단: 최신 발행 콘텐츠 4개 미리보기 (모바일 좌우 스크롤 / 데스크톱 4열 그리드) */}
                  {videos.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-400 block">최근 발행 콘텐츠</span>
                      <div className="flex sm:grid sm:grid-cols-4 gap-2.5 overflow-x-auto no-scrollbar pb-1">
                        {videos.map((v: any, idx: number) => {
                          const thumb = v.thumbnail_url || v.img_url || v.thumbnail || v.image_url || v.img || '';
                          const title = v.title || v.post_title || v.video_title || '최신 콘텐츠';
                          const link = v.url || v.post_url || v.video_url || '';

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
                                <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-400">썸네일 없음</div>
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
          </div>
        )}
      </div>
    </div>
  );
}
