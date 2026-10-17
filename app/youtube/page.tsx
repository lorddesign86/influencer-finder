'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getFavorites } from '@/lib/favorites';
import { Bookmark, Search, Zap } from 'lucide-react';

// 프로젝트 환경에 맞는 Supabase 클라이언트 생성 (환경 변수 연동)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function YoutubeSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [favoritesMap, setFavoritesMap] = useState<Record<string, any>>({});
  const [isProMode, setIsProMode] = useState(true);

  // Supabase에서 데이터 불러오기
  useEffect(() => {
    fetchYoutubeFromSupabase();
    loadFavorites();

    window.addEventListener('favorites-updated', loadFavorites);
    return () => window.removeEventListener('favorites-updated', loadFavorites);
  }, [selectedCategory, searchQuery]);

  const loadFavorites = () => {
    setFavoritesMap(getFavorites());
  };

  const fetchYoutubeFromSupabase = async () => {
    setLoading(true);
    try {
      let query = supabase.from('influencers').select('*');

      if (selectedCategory !== '전체') {
        query = query.eq('category', selectedCategory);
      }

      if (searchQuery.trim() !== '') {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase 데이터 조회 실패:', error);
        setChannels([]);
        setLoading(false);
        return;
      }

      if (data) {
        // 데이터베이스의 각 행(row)을 화면 카드 규격에 맞게 매핑
        const formatted = await Promise.all(
          data.map(async (item: any) => {
            const channelId = item.id || item.channel_id;
            
            // influencer_posts 테이블에서 해당 채널의 최신 영상 조회
            const { data: postsData } = await supabase
              .from('influencer_posts')
              .select('*')
              .eq('channel_id', item.channel_id)
              .limit(4);

            return {
              id: channelId,
              channel_id: item.channel_id,
              platform: item.platform || 'youtube',
              name: item.name || '이름 없음',
              handle: item.channel_id || '', // @Hyo_LevelUp 형태
              category: item.category || '엔터테인먼트',
              profile_img_url: item.profile_img_url || item.profile_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              subscriber_count: Number(item.subscriber_count || item.metric1 || 500000),
              long_views: Number(item.long_views || item.metric2 || 300000),
              shorts_views: Number(item.shorts_views || item.metric3 || 1000000),
              estimated_price: Number(item.estimated_price || item.base_price || 3000000),
              videos: postsData && postsData.length > 0 ? postsData.map((p: any) => ({
                title: p.title || p.post_title || '유튜브 영상',
                img: p.thumbnail_url || p.img_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300'
              })) : [
                { title: '인기 급상승 동영상 콘텐츠', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300' },
                { title: '채널 하이라이트 모음', img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300' },
              ]
            };
          })
        );
        setChannels(formatted);
      }
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
        handle: item.handle,
        profile_img_url: item.profile_img_url,
        tags: [item.category],
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
      setSelectedIds(new Set(channels.map(c => String(c.id))));
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
      if (selectedIds.has(String(item.id))) {
        const key = `youtube_${item.id}`;
        if (!favs[key]) {
          favs[key] = {
            id: item.id,
            platform: 'youtube',
            name: item.name,
            handle: item.handle,
            profile_img_url: item.profile_img_url,
            tags: [item.category],
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
            데이터를 불러오는 중입니다...
          </div>
        ) : channels.length === 0 ? (
          <div className="p-20 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">
            검색된 채널이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {channels.map((item) => {
              const isChecked = selectedIds.has(String(item.id));
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
                        onChange={() => handleToggleCheckbox(String(item.id))}
                        className="w-4 h-4 rounded text-red-500 focus:ring-red-500 cursor-pointer flex-shrink-0"
                      />
                      <img 
                        src={item.profile_img_url} 
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
                        <p className="text-xs text-slate-400 truncate">{item.handle}</p>
                        <span className="inline-block mt-1 text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md">
                          #{item.category}
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
                        <strong className="text-slate-900 font-black">{item.subscriber_count.toLocaleString()}명</strong>
                      </div>
                      <div className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">평균 조회수 (롱폼)</span>
                        <strong className="text-red-500 font-black">{item.long_views.toLocaleString()}회</strong>
                      </div>
                      <div className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">평균 조회수 (숏츠)</span>
                        <strong className="text-slate-900 font-black">{item.shorts_views.toLocaleString()}회</strong>
                      </div>
                      <div className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">예상 광고 단가</span>
                        <strong className="text-red-600 font-black">{item.estimated_price.toLocaleString()}원</strong>
                      </div>
                    </div>
                  </div>

                  {/* 하단 최근 발행 콘텐츠 4개 미리보기 */}
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
