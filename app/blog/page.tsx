'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFavorites } from '@/lib/favorites';
import { Bookmark, Check, ExternalLink, Search, SlidersHorizontal } from 'lucide-react';

export default function BlogSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [sortBy, setSortBy] = useState('fan');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [favoritesMap, setFavoritesMap] = useState<Record<string, any>>({});

  // 샘플 블로그 데이터 (실제 데이터 소스에 맞게 교체 또는 유지)
  const [channels, setChannels] = useState([
    {
      id: 'binaida',
      blog_id: 'binaida',
      name: 'zzzbina',
      handle: 'binaida',
      category: '질병 치료/예방 전문',
      profile_img_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      fan_count: 196000,
      daily_visitors: 294000,
      neighbor_count: 0,
      estimated_price: 3630000,
      posts: [
        { title: '뇌졸중', img: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=300' },
        { title: '독감', img: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=300' },
        { title: '배란일', img: 'https://images.unsplash.com/photo-1584516150905-cbf41ede6151?w=300' },
        { title: '장염', img: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=300' },
      ]
    },
    {
      id: 'fff1503',
      blog_id: 'fff1503',
      name: 'fff1503',
      handle: 'fff1503',
      category: '생활건강 전문블로거',
      profile_img_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      fan_count: 186000,
      daily_visitors: 26466,
      neighbor_count: 0,
      estimated_price: 920000,
      posts: [
        { title: '식물 테라피', img: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=300' },
        { title: '홈케어', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=300' },
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

  // 개별 즐겨찾기 토글 핸들러
  const handleToggleFavorite = (item: any) => {
    const id = String(item.blog_id || item.id);
    const key = `blog_${id}`;
    const favs = getFavorites();

    if (favs[key]) {
      delete favs[key];
    } else {
      favs[key] = {
        id,
        platform: 'blog',
        name: item.name,
        handle: item.handle,
        profile_img_url: item.profile_img_url,
        tags: [item.category],
        metric1: item.fan_count,
        metric2: item.daily_visitors,
        metric3: item.neighbor_count,
        base_price: item.estimated_price,
        folder: '기본 폴더',
        added_at: new Date().toISOString()
      };
    }
    localStorage.setItem('findlist_favorites', JSON.stringify(favs));
    window.dispatchEvent(new Event('favorites-updated'));
  };

  // 전체 선택 / 해제
  const handleToggleSelectAll = () => {
    if (selectedIds.size === channels.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(channels.map(c => String(c.blog_id || c.id)));
      setSelectedIds(allIds);
    }
  };

  // 개별 체크박스 토글
  const handleToggleCheckbox = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 상단/하단 일괄 즐겨찾기 추가 버튼
  const handleBulkFavorite = () => {
    if (selectedIds.size === 0) {
      alert('선택된 채널이 없습니다.');
      return;
    }

    const favs = getFavorites();
    let count = 0;

    channels.forEach(item => {
      const id = String(item.blog_id || item.id);
      if (selectedIds.has(id)) {
        const key = `blog_${id}`;
        if (!favs[key]) {
          favs[key] = {
            id,
            platform: 'blog',
            name: item.name,
            handle: item.handle,
            profile_img_url: item.profile_img_url,
            tags: [item.category],
            metric1: item.fan_count,
            metric2: item.daily_visitors,
            metric3: item.neighbor_count,
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
              placeholder="찾고 싶은 블로그 키워드나 주제를 입력하세요 (예: 화장품, 맛집, 여행)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => router.push('/favorites')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Bookmark size={14} /> 즐겨찾기 ({Object.keys(favoritesMap).length})
            </button>
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="max-w-6xl mx-auto flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {['전체', '여행', '패션', '뷰티', '푸드', 'IT테크', '자동차', '리빙', '육아', '생활건강', '게임', '동물·펫', '운동·레저', '경제·비즈니스'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              전체 선택 ({selectedIds.size})
            </label>
            <span className="text-xs text-slate-400">| 검색 결과 ({channels.length}명)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkFavorite}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Bookmark size={14} /> 즐겨찾기 추가 ({selectedIds.size})
            </button>
          </div>
        </div>

        {/* 블로그 카드 리스트 */}
        <div className="space-y-4">
          {channels.map((item) => {
            const id = String(item.blog_id || item.id);
            const isChecked = selectedIds.has(id);
            const isFav = Boolean(favoritesMap[`blog_${id}`]);

            return (
              <div 
                key={id}
                className={`bg-white rounded-2xl border transition p-4 md:p-6 space-y-4 shadow-2xs ${
                  isChecked ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200'
                }`}
              >
                {/* 상단 프로필 및 우측 액션 버튼 배치 */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  
                  {/* 좌측: 체크박스 + 프로필 사진 & 이름 */}
                  <div className="flex items-center gap-3 min-w-0">
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCheckbox(id)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                    />
                    <img 
                      src={item.profile_img_url} 
                      alt="" 
                      className="w-12 h-12 rounded-full border border-slate-200 object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm md:text-base font-black text-slate-900 truncate">{item.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 font-extrabold rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                          INFLUENCER
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">@{item.handle}</p>
                      <span className="inline-block mt-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        #{item.category}
                      </span>
                    </div>
                  </div>

                  {/* 우측: [즐겨찾기] / [광고문의] / [채널상세] 버튼 (상단으로 배치) */}
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(item)}
                      className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                        isFav 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                          : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-500 hover:text-emerald-600'
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
                      onClick={() => router.push(`/blog/${id}`)}
                      className="flex-1 md:flex-initial px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      채널상세 <span className="text-xs">&gt;</span>
                    </button>
                  </div>

                </div>

                {/* 중앙: 통계 지표 4칸을 한 줄로 압축 (모바일 좌우 스크롤 지원) */}
                <div className="overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-3 min-w-[650px] bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <div className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">인플루언서 팬</span>
                      <strong className="text-slate-900 font-black">{item.fan_count.toLocaleString()}명</strong>
                    </div>
                    <div className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">일일 평균 방문자</span>
                      <strong className="text-emerald-600 font-black">{item.daily_visitors.toLocaleString()}명</strong>
                    </div>
                    <div className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">이웃 수</span>
                      <strong className="text-slate-900 font-black">{item.neighbor_count.toLocaleString()}명</strong>
                    </div>
                    <div className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">예상 원고료</span>
                      <strong className="text-red-600 font-black">{item.estimated_price.toLocaleString()}원</strong>
                    </div>
                  </div>
                </div>

                {/* 하단: 최근 발행 콘텐츠 썸네일 */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 block">최근 발행 콘텐츠</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {item.posts.map((post, idx) => (
                      <div key={idx} className="group relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                        <img src={post.img} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-4">
                          <p className="text-[11px] text-white font-bold truncate">{post.title}</p>
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
