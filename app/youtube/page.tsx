'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  getFavorites, toggleFavoriteItem, addBulkFavorites, FavoriteItem 
} from '@/lib/favorites';
import { 
  Search, Tag, ChevronRight, Eye, Lock, Sparkles, Mail, Bookmark, CheckSquare, Square, Check 
} from 'lucide-react';

const YOUTUBE_CATEGORIES = [
  '전체', '맛집', '먹방', '여행', 'Vlog', 'IT', '뷰티', '패션', '게임', '경제'
];

const cleanId = (val: any): string => {
  if (!val) return '';
  return String(val).trim().replace(/^@+/, '');
};

export default function YoutubeDashboardPage() {
  const router = useRouter();
  const [isProUser, setIsProUser] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('전체');
  
  const [channels, setChannels] = useState<any[]>([]);
  const [postsMap, setPostsMap] = useState<Record<string, any[]>>({});
  const [matchedPostChannelIds, setMatchedPostChannelIds] = useState<Set<string>>(new Set());
  
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

  // 1. 초기 채널 전체 로드
  useEffect(() => {
    const fetchAllChannels = async () => {
      setLoading(true);
      try {
        let allChannels: any[] = [];
        const step = 1000;
        for (let i = 0; i < 5; i++) {
          const { data, error } = await supabase
            .from('influencers')
            .select('*')
            .range(i * step, (i + 1) * step - 1);

          if (error) break;
          if (data && data.length > 0) {
            allChannels = allChannels.concat(data);
            if (data.length < step) break;
          } else {
            break;
          }
        }
        setChannels(allChannels);
      } finally {
        setLoading(false);
      }
    };
    fetchAllChannels();
  }, []);

  // 2. 검색어/태그 입력 시 영상 제목(title) 역추적
  useEffect(() => {
    const keyword = search.trim() || (selectedTag !== '전체' ? selectedTag : '');
    if (!keyword) {
      setMatchedPostChannelIds(new Set());
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const mainKw = keyword.split(/\s+/).filter(Boolean)[0];
        const { data: matchedPosts } = await supabase
          .from('influencer_posts')
          .select('channel_id')
          .ilike('title', `%${mainKw}%`)
          .limit(300);

        if (matchedPosts && matchedPosts.length > 0) {
          const cidSet = new Set<string>();
          matchedPosts.forEach((p: any) => {
            const cid = cleanId(p.channel_id).toLowerCase();
            if (cid) cidSet.add(cid);
          });
          setMatchedPostChannelIds(cidSet);
        } else {
          setMatchedPostChannelIds(new Set());
        }
      } catch (err) {
        console.error(err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [search, selectedTag]);

  // 3. 채널 필터링
  const displayedChannels = useMemo(() => {
    const q = search.trim().toLowerCase();
    
    const youtubeChannels = channels.filter(c => {
      const p = String(c.platform || '').toLowerCase();
      return p === 'youtube' || p.includes('tube') || !c.platform;
    });

    const targetList = youtubeChannels.length > 0 ? youtubeChannels : channels;

    if (!q && selectedTag === '전체') {
      const sorted = [...targetList].sort((a, b) => {
        const subA = Number(a.follower_count ?? a.follwer_count ?? a.subscriber_count ?? a.subscribers ?? 0);
        const subB = Number(b.follower_count ?? b.follwer_count ?? b.subscriber_count ?? b.subscribers ?? 0);
        return subB - subA;
      });
      return { list: sorted.slice(0, 5), totalCount: sorted.length, isDefaultRecommend: true };
    }

    const filtered = targetList.filter((item) => {
      const cIdLower = cleanId(item.channel_id).toLowerCase();
      const handleLower = cleanId(item.handle).toLowerCase();
      const tagsStr = Array.isArray(item.tags) ? item.tags.join(' ') : String(item.tags || '');
      
      const fullChannelText = [
        item.name, item.handle, item.channel_id, item.category, item.description, item.bio, tagsStr
      ].filter(Boolean).join(' ').toLowerCase();

      const isMatchedFromPosts = matchedPostChannelIds.has(cIdLower) || matchedPostChannelIds.has(handleLower);

      if (selectedTag !== '전체') {
        const catLower = selectedTag.toLowerCase();
        if (!fullChannelText.includes(catLower) && !isMatchedFromPosts) return false;
      }

      if (!q) return true;
      const keywords = q.split(/\s+/).filter(Boolean);
      return keywords.some(kw => fullChannelText.includes(kw)) || isMatchedFromPosts;
    });

    const sortedFiltered = [...filtered].sort((a, b) => {
      const subA = Number(a.follower_count ?? a.follwer_count ?? a.subscriber_count ?? a.subscribers ?? 0);
      const subB = Number(b.follower_count ?? b.follwer_count ?? b.subscriber_count ?? b.subscribers ?? 0);
      return subB - subA;
    });

    return { list: sortedFiltered.slice(0, 50), totalCount: sortedFiltered.length, isDefaultRecommend: false };
  }, [channels, search, selectedTag, matchedPostChannelIds]);

  // 4. 노출된 채널의 최신 영상 4개 개별 병렬 조회
  useEffect(() => {
    const fetchPostsForDisplayed = async () => {
      const targetChannels = displayedChannels.list.filter(c => {
        const key = cleanId(c.channel_id).toLowerCase();
        return key && !postsMap[key];
      });

      if (targetChannels.length === 0) return;

      setPostsLoading(true);
      try {
        const newEntries: Record<string, any[]> = {};
        await Promise.all(
          targetChannels.map(async (channel) => {
            const rawCid = String(channel.channel_id || '').trim();
            const cleanedCid = cleanId(rawCid);
            const mapKey = cleanedCid.toLowerCase();
            if (!mapKey) return;

            const candidateIds = Array.from(new Set([rawCid, cleanedCid, `@${cleanedCid}`])).filter(Boolean);

            const { data: pData } = await supabase
              .from('influencer_posts')
              .select('*')
              .in('channel_id', candidateIds)
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
  }, [displayedChannels.list]);

  const toFavoriteItem = (channel: any): FavoriteItem => {
    const cId = cleanId(channel.channel_id || channel.id);
    const subs = Number(channel.follower_count ?? channel.follwer_count ?? channel.subscriber_count ?? channel.subscribers ?? 0);
    const longFormViews = Number(channel.avg_video_views ?? channel.avg_views ?? 0);
    const shortFormViews = Number(channel.avg_shorts_views ?? 0);
    const estPrice = Number(channel.estimated_video_cpv_price ?? channel.ad_price ?? 0);
    const tagsList = Array.isArray(channel.tags) ? channel.tags : (typeof channel.tags === 'string' && channel.tags.trim() !== '' ? channel.tags.split(',') : ['크리에이터']);

    return {
      id: cId,
      platform: 'youtube',
      name: channel.name || '이름 없음',
      handle: cleanId(channel.handle || channel.channel_id),
      profile_img_url: channel.profile_img_url || channel.profile_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      tags: tagsList.map((t: string) => String(t).trim().replace(/^#+/, '')),
      metric1: subs,
      metric2: longFormViews,
      metric3: shortFormViews,
      base_price: estPrice,
      added_at: new Date().toISOString()
    };
  };

  const toggleSelectChannel = (cId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(cId)) next.delete(cId);
      else next.add(cId);
      return next;
    });
  };

  const toggleSelectAllDisplayed = () => {
    const currentIds = displayedChannels.list.map(c => cleanId(c.channel_id || c.id));
    const allSelected = currentIds.length > 0 && currentIds.every(id => selectedIds.has(id));

    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentIds));
    }
  };

  const handleBulkAddFavorites = () => {
    const selectedChannels = channels.filter(c => selectedIds.has(cleanId(c.channel_id || c.id)));
    const items = selectedChannels.map(toFavoriteItem);
    addBulkFavorites(items);
    setSelectedIds(new Set());
    alert(`${items.length}개의 채널이 즐겨찾기에 추가되었습니다!`);
  };

  const handleOpenDetail = (channel: any) => {
    const targetId = cleanId(channel.channel_id) || channel.id;
    router.push(`/youtube/${targetId}`);
  };

  const allDisplayedSelected = displayedChannels.list.length > 0 && 
    displayedChannels.list.every(c => selectedIds.has(cleanId(c.channel_id || c.id)));

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-y-auto relative pb-24">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-20 space-y-4 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="유튜버 이름, 태그, 또는 영상 제목 키워드(예: 맛, 여행)를 검색하세요..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-full text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition shadow-inner"
            />
          </div>
          <button 
            type="button"
            onClick={() => router.push('/favorites')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-3 rounded-full transition cursor-pointer whitespace-nowrap"
          >
            <Bookmark size={14} className="text-red-600 fill-red-600" />
            즐겨찾기 ({Object.keys(favoritesMap).length})
          </button>
          <button 
            type="button"
            onClick={() => setIsProUser(!isProUser)}
            className={`text-xs font-bold text-white px-5 py-3 rounded-full transition cursor-pointer shadow-md whitespace-nowrap ${
              isProUser ? 'bg-gradient-to-r from-red-600 to-rose-500' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isProUser ? '👑 PRO 플랜 이용중' : '🔒 PRO 업그레이드'}
          </button>
        </div>

        <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 flex-shrink-0 mr-2">
            <Tag size={13} /> 태그:
          </span>
          {YOUTUBE_CATEGORIES.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                selectedTag === tag ? 'bg-red-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full p-8 space-y-4">
        {displayedChannels.isDefaultRecommend && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 p-4 rounded-2xl flex items-center justify-between text-xs text-red-900 shadow-2xs">
            <div className="flex items-center gap-2 font-bold">
              <Sparkles size={16} className="text-red-600" />
              <span>실시간 추천 대형 유튜버 파워 채널 베스트 5 (총 로드된 채널: {channels.length}개)</span>
            </div>
            <span className="text-[11px] text-red-600 font-semibold">체크박스를 선택해 원하는 채널을 즐겨찾기에 한 번에 담아보세요!</span>
          </div>
        )}

        <div className="text-xs text-slate-500 font-semibold px-2 flex items-center justify-between bg-white py-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAllDisplayed}
              className="flex items-center gap-2 text-slate-700 hover:text-red-600 font-bold cursor-pointer"
            >
              {allDisplayedSelected ? (
                <CheckSquare size={18} className="text-red-600" />
              ) : (
                <Square size={18} className="text-slate-400" />
              )}
              <span>전체 선택 ({selectedIds.size}개 선택됨)</span>
            </button>
            <span className="text-slate-300">|</span>
            <span>검색된 크리에이터 ({displayedChannels.totalCount}명 중 {displayedChannels.list.length}명 표시)</span>
          </div>

          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={handleBulkAddFavorites}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
            >
              <Bookmark size={13} /> 선택 채널 즐겨찾기 추가 ({selectedIds.size})
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-20 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">
            채널 목록을 불러오는 중입니다...
          </div>
        ) : displayedChannels.list.length === 0 ? (
          <div className="p-20 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">
            데이터베이스에 일치하는 크리에이터가 없습니다.
          </div>
        ) : (
          displayedChannels.list.map((channel) => {
            const cId = cleanId(channel.channel_id || channel.id);
            const cIdKey = cId.toLowerCase();
            const pList = postsMap[cIdKey] || [];
            const isChannelPostLoaded = cIdKey in postsMap;

            const isChecked = selectedIds.has(cId);
            const favKey = `youtube_${cId}`;
            const isFavorited = Boolean(favoritesMap[favKey]);

            const subs = Number(channel.follower_count ?? channel.follwer_count ?? channel.subscriber_count ?? channel.subscribers ?? 0);
            const longFormViews = Number(channel.avg_video_views ?? channel.avg_views ?? 0);
            const shortFormViews = Number(channel.avg_shorts_views ?? 0);
            const estPrice = Number(channel.estimated_video_cpv_price ?? channel.ad_price ?? 0);
            const customPrice = favoritesMap[favKey]?.custom_price;

            const profileImg = channel.profile_img_url || channel.profile_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
            const tagsList = Array.isArray(channel.tags) ? channel.tags : (typeof channel.tags === 'string' && channel.tags.trim() !== '' ? channel.tags.split(',') : ['크리에이터']);

            return (
              <div 
                key={channel.id || channel.channel_id}
                className={`bg-white rounded-2xl border p-6 shadow-2xs hover:shadow-md transition space-y-4 ${
                  isChecked ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleSelectChannel(cId)}
                      className={`mt-4 w-5 h-5 rounded-md flex items-center justify-center border transition cursor-pointer flex-shrink-0 ${
                        isChecked 
                          ? 'bg-red-600 border-red-600 text-white' 
                          : 'bg-white border-slate-300 hover:border-red-500'
                      }`}
                    >
                      {isChecked && <Check size={14} strokeWidth={3} />}
                    </button>

                    <img 
                      src={profileImg} 
                      alt={channel.name} 
                      referrerPolicy="no-referrer"
                      onClick={() => toggleSelectChannel(cId)}
                      className="w-14 h-14 rounded-full border border-slate-200 object-cover flex-shrink-0 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 truncate">{channel.name || '이름 없음'}</h3>
                        <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 font-extrabold rounded flex-shrink-0">
                          {channel.platform || 'YOUTUBE'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">@{cleanId(channel.handle || channel.channel_id)}</p>
                      
                      <div className="flex flex-wrap gap-1.5 mt-2 max-h-20 overflow-y-auto">
                        {tagsList.map((t: string, i: number) => (
                          <span key={i} className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 whitespace-nowrap">
                            #{String(t).trim().replace(/^#+/, '')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleFavoriteItem(toFavoriteItem(channel))}
                      className={`flex items-center gap-1 px-3 py-2 border text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${
                        isFavorited
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                      title="즐겨찾기 추가/해제"
                    >
                      <Bookmark size={13} className={isFavorited ? 'fill-amber-500 text-amber-500' : ''} />
                      {isFavorited ? '저장됨' : '즐겨찾기'}
                    </button>

                    <a
                      href={`mailto:${channel.contact_email || 'contact@findlist.co.kr'}?subject=[유튜브 협업문의] ${channel.name} 채널 광고 문의`}
                      className="flex items-center gap-1 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap"
                    >
                      <Mail size={13} /> 광고 문의
                    </a>
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(channel)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      채널 상세 분석 <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400">구독자 수</span>
                    <p className="text-sm font-black text-slate-900 mt-0.5">{subs > 0 ? `${subs.toLocaleString()}명` : '0명'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">평균 조회수 (롱폼)</span>
                    <p className="text-sm font-black text-slate-900 mt-0.5">{longFormViews > 0 ? `${longFormViews.toLocaleString()}회` : '0회'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">평균 조회수 (숏폼)</span>
                    <p className="text-sm font-black text-red-600 mt-0.5">{shortFormViews > 0 ? `${shortFormViews.toLocaleString()}회` : '0회'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">광고 단가 (회원 설정 가능)</span>
                    {isProUser ? (
                      <p className="text-sm font-black text-rose-600 mt-0.5">
                        {customPrice != null 
                          ? `${Number(customPrice).toLocaleString()}원 (내 설정가)` 
                          : estPrice > 0 ? `${estPrice.toLocaleString()}원~` : '0원'}
                      </p>
                    ) : (
                      <div className="relative mt-0.5">
                        <span className="filter blur-[4px] select-none text-slate-400 font-bold">1,500,000원</span>
                        <span className="absolute inset-0 flex items-center text-[10px] text-amber-800 font-bold bg-amber-50/90 px-2 rounded border border-amber-200">
                          <Lock size={10} className="mr-0.5" /> PRO 전용
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-400">최근 발행 영상 콘텐츠</p>
                  {pList.length > 0 ? (
                    <div className="grid grid-cols-4 gap-3">
                      {pList.map((p: any, i: number) => {
                        const thumb = p.thumbnail_url || p.thumbnail || p.image_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300';
                        const title = p.title || p.post_title || '영상 제목 없음';
                        const pViews = Number(p.view_count || p.views || 0);

                        return (
                          <a 
                            key={i} 
                            href={p.post_url || (p.video_id ? `https://www.youtube.com/watch?v=${p.video_id}` : '#')}
                            target="_blank"
                            rel="noreferrer"
                            className="group relative block rounded-xl border border-slate-100 overflow-hidden bg-slate-100 aspect-video"
                          >
                            <img src={thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center items-center text-center p-3 text-white space-y-1">
                              <p className="text-[11px] font-bold line-clamp-2 px-1">{title}</p>
                              <span className="text-[10px] text-rose-400 flex items-center gap-1"><Eye size={10} /> {pViews > 0 ? `${pViews.toLocaleString()}회` : '조회수 집계중'}</span>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  ) : !isChannelPostLoaded && postsLoading ? (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-slate-400">
                      최신 영상을 불러오는 중...
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-amber-700 font-semibold">
                      DB(`influencer_posts`)에 해당 채널({cId})의 영상이 아직 수집되지 않았습니다.
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-6 border border-slate-700">
          <span className="text-xs font-bold">
            총 <strong className="text-rose-400 text-sm">{selectedIds.size}개</strong> 채널 선택됨
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkAddFavorites}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <Bookmark size={14} className="fill-white" /> 선택 항목 즐겨찾기 일괄 추가
            </button>
            <button
              type="button"
              onClick={() => router.push('/favorites')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              즐겨찾기 폴더 보기
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              선택 해제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
