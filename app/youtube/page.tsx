'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { getFavorites } from '@/lib/favorites';
import { Bookmark, Search, Zap } from 'lucide-react';

export default function YoutubeSearchPage() {
  const router = useRouter();
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [favoritesMap, setFavoritesMap] = useState<Record<string, any>>({});
  const [isProMode, setIsProMode] = useState(true);

  // Supabase influencers 및 influencer_posts 테이블에서 데이터 가져오기
  useEffect(() => {
    fetchYoutubeData();
    loadFavorites();

    window.addEventListener('favorites-updated', loadFavorites);
    return () => window.removeEventListener('favorites-updated', loadFavorites);
  }, [selectedCategory, searchQuery]);

  const loadFavorites = () => {
    setFavoritesMap(getFavorites());
  };

  const fetchYoutubeData = async () => {
    setLoading(true);
    try {
      // 1. influencers 테이블 조회
      let query = supabase.from('influencers').select('*');

      if (selectedCategory !== '전체') {
        query = query.eq('category', selectedCategory);
      }

      if (searchQuery.trim() !== '') {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data: influencerData, error } = await query;

      if (error) {
        console.error('유튜브 데이터 조회 오류:', error);
        setLoading(false);
        return;
      }

      if (!influencerData || influencerData.length === 0) {
        setChannels([]);
        setLoading(false);
        return;
      }

      // 2. 각 유튜버에 맞는 최신 영상 목록(influencer_posts) 가져오기
      const channelsWithPosts = await Promise.all(
        influencerData.map(async (channel) => {
          const channelId = channel.channel_id || channel.id;
          const { data: postsData } = await supabase
            .from('influencer_posts')
            .select('*')
            .eq('channel_id', channelId)
            .limit(4);

          return {
            ...channel,
            id: channelId,
            subscriber_count: channel.subscriber_count || channel.metric1 || 0,
            long_views: channel.long_views || channel.metric2 || 0,
            shorts_views: channel.shorts_views || channel.metric3 || 0,
            estimated_price: channel.estimated_price || channel.base_price || 300000,
            videos: postsData && postsData.length > 0 ? postsData.map(p => ({
              title: p.title || p.post_title || '영상 제목',
              img: p.thumbnail_url || p.img_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300'
            })) : [
              { title: '최신 유튜브 영상 콘텐츠 1', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300' },
              { title: '최신 유튜브 영상 콘텐츠 2', img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300' },
            ]
          };
        })
      );

      setChannels(channelsWithPosts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = (item: any) => {
    const key = `youtube_${item.id}`;
    const favs = getFavorites();

    if (favs[key]) {
      delete favs[key];
    } else {
      favs[key] = {
        id: item.id,
        platform: 'youtube',
        name: item.name,
        handle: item.handle || item.id,
        profile_img_url: item.profile_img_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        tags: [item.category || '유튜브'],
        metric1: item.subscriber_count,
        metric2: item.long_views,
        metric3: item.shorts_views,
        base_price: item.estimated_price,
        folder: '기본 폴더',
        added_at: new Date().toISOString()
      };
    }
    localStorage.setItem('findlist_favorites', JSON.stringify(favs));
    window.dispatchEvent(new Event('favorites-updated'));
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === channels.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(channels.map(c => c.id)));
    }
  };

  const handleToggleCheckbox = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkFavorite = () => {
    if (selectedIds.size === 0) {
      alert('선택된 채널이 없습니다.');
      return;
    }

    const favs = getFavorites();
    let count = 0;

    channels.forEach(item => {
      if (selectedIds.has(item.id)) {
        const key = `youtube_${item.id}`;
        if (!favs[key]) {
          favs[key] = {
            id: item.id,
            platform: 'youtube',
            name: item.name,
            handle: item.handle || item.id,
            profile_img_url: item.profile_img_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            tags: [item.category || '유튜브'],
            metric1: item.subscriber_count,
            metric2: item.long_views,
            metric3: item.shorts_views,
            base_price: item.estimated_price,
            folder: '기본 폴더',
            added_at: new Date().toISOString()
          };
          count++;
        }
      }
    });

    localStorage.setItem('findlist_favorites', JSON.stringify(favs));
    window.dispatchEvent(new Event('favorites-updated'));
    alert(`선택한 채널 중 ${count}개가 즐겨찾기에 추가되었습니다.`);
    setSelectedIds(new Set());
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-y-auto relative pb-24">
      
      {/* 상단 검색 및 필터 영역 */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 sticky top-0 z-20 shadow-2xs space-y-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="유튜버 이름, 키워드 또는 URL 입력"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsProMode(!isProMode)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                isProMode 
                  ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-2xs' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <Zap size={14} className={isProMode ? 'fill-amber-500 text-amber-500' : ''} />
              PRO 모드: {isProMode ? 'ON' : 'OFF'}
            </button>

            <button 
              type="button"
              onClick={() => router.push('/favorites')}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Bookmark size={14} /> 즐겨찾기 ({Object.keys(favoritesMap).length})
            </button>
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="max-w-6xl mx-auto flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {['전체', '엔터테인먼트', '게임', '음악', '키즈', '푸드', 'IT테크', '취미', '스포츠', '패션·뷰티', '경제·뉴스'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full p-4 md:p-8 space-y-4">
        
        {/* 정렬 및 일괄 추가 바 */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input 
                type="checkbox"
                checked={selectedIds.size === channels.length && channels.length > 0}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 rounded text-red-500 focus:ring-red-500 cursor-pointer"
              />
              전체 선택 ({selectedIds.size})
            </label>
            <span className="text-xs text-slate-400">| 검색 결과 ({channels.length}명)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkFavorite}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Bookmark size={14} /> 즐겨찾기 추가 ({selectedIds.size})
            </button>
          </div>
        </div>

        {/* 유튜브 카드 리스트 */}
        {loading ? (
          <div className="p-20 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">
            유튜브 데이터를 불러오는 중입니다...
          </div>
        ) : channels.length === 0 ? (
          <div className="p-20 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">
            등록된 유튜브 채널 데이터가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {channels.map((item) => {
              const isChecked = selectedIds.has(item.id);
              const isFav = Boolean(favoritesMap[`youtube_${item.id}`]);

              return (
                <div 
                  key={item.id}
                  className={`bg-white rounded-2xl border transition p-4 md:p-6 space-y-4 shadow-2xs ${
                    isChecked ? 'border-red-500 bg-red-50/10' : 'border-slate-200'
                  }`}
                >
                  {/* 상단 프로필 및 액션 버튼 */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    
                    <div className="flex items-center gap-3 min-w-0">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleCheckbox(item.id)}
                        className="w-4 h-4 rounded text-red-500 focus:ring-red-500 cursor-pointer flex-shrink-0"
                      />
                      <img 
                        src={item.profile_img_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full border border-slate-200 object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm md:text-base font-black text-slate-900 truncate">{item.name}</h3>
                          <span className="text-[10px] px-2 py-0.5 font-extrabold rounded bg-red-50 text-red-600 border border-red-100 uppercase">
                            YouTube
                          </span>
                          {isProMode && (
                            <span className="text-[10px] px-1.5 py-0.5 font-bold rounded bg-amber-100 text-amber-800">
                              PRO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate">@{item.handle || item.id}</p>
                        <span className="inline-block mt-1 text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md">
                          #{item.category || '유튜브'}
                        </span>
                      </div>
                    </div>

                    {/* 우측 버튼 영역 */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(item)}
                        className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                          isFav 
                            ? 'bg-red-500 text-white border-red-500 shadow-xs' 
                            : 'bg-white text-slate-700 border-slate-300 hover:border-red-500 hover:text-red-500'
                        }`}
                      >
                        <Bookmark size={14} className={isFav ? 'fill-white' : ''} />
                        {isFav ? '저장됨' : '즐겨찾기'}
                      </button>

                      <button
                        type="button"
                        onClick={() => alert('광고문의 기능')}
                        className="flex-1 md:flex-initial px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        광고문의
                      </button>

                      <button
                        type="button"
                        onClick={() => router.push(`/youtube/${item.id}`)}
                        className="flex-1 md:flex-initial px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        채널상세 <span className="text-xs">&gt;</span>
                      </button>
                    </div>

                  </div>

                  {/* 중앙 통계 지표 */}
                  <div className="overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-3 min-w-[650px] bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                      <div className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">구독자 수</span>
                        <strong className="text-slate-900 font-black">{Number(item.subscriber_count || 0).toLocaleString()}명</strong>
                      </div>
                      <div className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">평균 조회수 (롱폼)</span>
                        <strong className="text-red-500 font-black">{Number(item.long_views || 0).toLocaleString()}회</strong>
                      </div>
                      <div className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">평균 조회수 (숏츠)</span>
                        <strong className="text-slate-900 font-black">{Number(item.shorts_views || 0).toLocaleString()}회</strong>
                      </div>
                      <div className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">예상 광고 단가</span>
                        <strong className="text-red-600 font-black">{Number(item.estimated_price || 0).toLocaleString()}원</strong>
                      </div>
                    </div>
                  </div>

                  {/* 하단 최신 콘텐츠 4개 미리보기 */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-500 block">최근 발행 콘텐츠</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {item.videos.map((video: any, idx: number) => (
                        <div key={idx} className="group relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 flex flex-col justify-end">
                          <img 
                            src={video.img} 
                            alt={video.title} 
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                          />
                          <div className="relative z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 pt-6">
                            <p className="text-[11px] text-white font-bold truncate">{video.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
