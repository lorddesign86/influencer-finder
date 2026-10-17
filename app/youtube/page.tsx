'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFavorites } from '@/lib/favorites';
import { Bookmark, Search, Zap } from 'lucide-react';

export default function YoutubeSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [favoritesMap, setFavoritesMap] = useState<Record<string, any>>({});
  const [isProMode, setIsProMode] = useState(true);

  // 각 채널에 맞는 정확한 프로필, 지표, 최신 콘텐츠 데이터 구축
  const [channels, setChannels] = useState([
    {
      id: 'hyojin',
      name: '효연의 레벨업 Hyo\'s Level Up',
      handle: 'Hyo_LevelUp',
      category: '엔터테인먼트',
      profile_img_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      subscriber_count: 520000,
      long_views: 450000,
      shorts_views: 1200000,
      estimated_price: 5000000,
      videos: [
        { title: '드디어 만난 레전드 게스트!', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300' },
        { title: '요즘 핫한 토크쇼 비하인드', img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300' },
        { title: '매운맛 게스트와 역대급 콜라보', img: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300' },
        { title: '촬영장 최초 공개합니다!', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300' },
      ]
    },
    {
      id: 'onlyoneseoui',
      name: '온리원서의',
      handle: 'onlyoneseoui',
      category: '푸드',
      profile_img_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      subscriber_count: 310000,
      long_views: 280000,
      shorts_views: 890000,
      estimated_price: 3200000,
      videos: [
        { title: '자취생 간단 10분 요리 레시피', img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300' },
        { title: '전국 맛집 다 털어왔습니다', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300' },
        { title: '길거리 간식 끝판왕 먹방', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300' },
        { title: '편의점 신상 조합 리뷰', img: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=300' },
      ]
    },
    {
      id: 'awesomelee',
      name: 'Awesome Lee',
      handle: 'awesomelee',
      category: 'IT테크',
      profile_img_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      subscriber_count: 850000,
      long_views: 620000,
      shorts_views: 2100000,
      estimated_price: 8500000,
      videos: [
        { title: '신제품 언박싱 및 솔직 리뷰', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300' },
        { title: '절대 사지 마세요 테크 기기', img: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=300' },
        { title: '개발자의 일상 브이로그', img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=300' },
        { title: '미래형 스마트홈 구축기', img: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=300' },
      ]
    },
    {
      id: 'kimchef',
      name: '김셰프의 킵쿡',
      handle: 'kimchef_cook',
      category: '푸드',
      profile_img_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      subscriber_count: 420000,
      long_views: 350000,
      shorts_views: 950000,
      estimated_price: 4000000,
      videos: [
        { title: '레스토랑 스테이크 집에서 굽기', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300' },
        { title: '파스타 면 종류별 완벽 정리', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300' },
        { title: '초간단 수제 소스 만들기', img: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=300' },
        { title: '냉장고 파먹기 챌린지', img: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=300' },
      ]
    }
  ]);

  const loadFavorites = () => {
    setFavoritesMap(getFavorites());
  };

  useEffect(() => {
    loadFavorites();
    window.addEventListener('favorites-updated', loadFavorites);
    return () => window.removeEventListener('favorites-updated', loadFavorites);
  }, []);

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
                      <p className="text-xs text-slate-400 truncate">@{item.handle}</p>
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

                    {/* 채널 상세 페이지 정상 라우팅 연결 */}
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
                    {item.videos.map((video, idx) => (
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

      </div>
    </div>
  );
}
