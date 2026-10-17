'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  getFavorites, toggleFavoriteItem, FavoriteItem 
} from '@/lib/favorites';
import { 
  Search, ChevronRight, Mail, Bookmark, Check, ArrowUpDown, AlertCircle 
} from 'lucide-react';

const YOUTUBE_CATEGORIES = [
  '전체', '엔터테인먼트', '게임', '음악', '키즈', '푸드', 'IT테크', '취미', '스포츠', '패션·뷰티', '경제·뉴스'
];

type SortOption = 'subscribers' | 'longViews' | 'shortsViews' | 'price';

const cleanId = (val: any): string => {
  if (!val) return '';
  return String(val).trim().replace(/^@+/, '');
};

export default function YoutubeInfluencerPage() {
  const router = useRouter();
  const [isProUser, setIsProUser] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [sortBy, setSortBy] = useState<SortOption>('subscribers');

  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [favoritesMap, setFavoritesMap] = useState<Record<string, FavoriteItem>>({});

  useEffect(() => {
    setFavoritesMap(getFavorites());
    const handleSync = () => setFavoritesMap(getFavorites());
    window.addEventListener('favorites-updated', handleSync);
    return () => window.removeEventListener('favorites-updated', handleSync);
  }, []);

  // Supabase 데이터 로드 (필요시 .from('실제테이블명')으로 변경하세요)
  useEffect(() => {
    const fetchChannels = async () => {
      setLoading(true);
      setDbError(null);
      try {
        let allChannels: any[] = [];
        const step = 1000;
        for (let i = 0; i < 5; i++) {
          const { data, error } = await supabase
            .from('channels') // 💡 에러가 난 'youtube_influencers' 대신 'channels'로 변경함 (필요시 실제 테이블명으로 수정)
            .select('*')
            .range(i * step, (i + 1) * step - 1);

          if (error) {
            console.error('유튜버 로드 에러:', error);
            setDbError(`DB 에러: ${error.message} (코드: ${error.code})`);
            break;
          }
          if (data && data.length > 0) {
            allChannels = allChannels.concat(data);
            if (data.length < step) break;
          } else {
            break;
          }
        }
        setChannels(allChannels);
      } catch (err: any) {
        console.error('네트워크/연결 예외:', err);
        setDbError(`연결 실패: ${err.message || '알 수 없는 오류'}`);
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, []);

  const getMetrics = (item: any) => {
    const subscribers = Number(item.subscriber_count ?? item.subscribers ?? item.follwer_count ?? 0);
    const longViews = Number(item.avg_long_views ?? item.long_views ?? item.daily_visitors ?? item.avg_views ?? 0);
    const shortsViews = Number(item.avg_shorts_views ?? item.shorts_views ?? 0);
    const price = Number(item.estimated_price ?? item.ad_price ?? item.manuscript_fee ?? (subscribers > 0 ? Math.round((subscribers * 3.5) / 10000) * 10000 : 300000));
    return { subscribers, longViews, shortsViews, price };
  };

  const displayedChannels = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = channels.filter((item) => {
      const fullText = [
        item.name, item.channel_name, item.handle, item.category, item.description, item.title
      ].filter(Boolean).join(' ').toLowerCase();

      if (selectedCategory !== '전체' && !fullText.includes(selectedCategory.toLowerCase())) {
        return false;
      }
      if (!q) return true;
      const keywords = q.split(/\s+/).filter(Boolean);
      return keywords.some(kw => fullText.includes(kw));
    });

    const sorted = [...filtered].sort((a, b) => {
      const mA = getMetrics(a);
      const mB = getMetrics(b);
      if (sortBy === 'subscribers') return mB.subscribers - mA.subscribers;
      if (sortBy === 'longViews') return mB.longViews - mA.longViews;
      if (sortBy === 'shortsViews') return mB.shortsViews - mA.shortsViews;
      if (sortBy === 'price') return mB.price - mA.price;
      return 0;
    });

    return {
      list: sorted.slice(0, 50),
      totalCount: sorted.length
    };
  }, [channels, search, selectedCategory, sortBy]);

  const toFavoriteItem = (channel: any): FavoriteItem => {
    const cId = cleanId(channel.channel_id || channel.handle || channel.id);
    const { subscribers, longViews, price } = getMetrics(channel);
    return {
      id: cId,
      platform: 'youtube',
      name: channel.name || channel.channel_name || cId,
      handle: cleanId(channel.handle || cId),
      profile_img_url: channel.profile_img_url || channel.profile_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      tags: [channel.category || '유튜버'],
      metric1: subscribers,
      metric2: longViews,
      metric3: 0,
      base_price: price,
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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-y-auto relative pb-24">
      
      {/* 상단 검색 영역 */}
      <div className="bg-white border-b border-slate-200 px-3 md:px-6 py-2.5 sticky top-0 z-20 space-y-2 shadow-2xs">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="relative w-full flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="유튜버 이름, 키워드 또는 URL 입력" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs md:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
              type="button"
              onClick={() => router.push('/favorites')}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap"
            >
              <Bookmark size={13} className="text-red-500 fill-red-500" />
              즐겨찾기 ({Object.keys(favoritesMap).length})
            </button>
            <button 
              type="button"
              onClick={() => setIsProUser(!isProUser)}
              className="flex-1 md:flex-initial text-xs font-bold text-white bg-[#FF0038] hover:bg-red-600 px-4 py-2.5 rounded-xl transition shadow-xs whitespace-nowrap"
            >
              {isProUser ? '👑 PRO 이용중' : '🔒 PRO 업그레이드'}
            </button>
          </div>
        </div>

        {/* 카테고리 태그 스크롤 */}
        <div className="max-w-5xl mx-auto flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {YOUTUBE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                selectedCategory === cat ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full p-3 md:p-6 space-y-3">
        
        {/* 정렬 바 */}
        <div className="bg-white px-3 py-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-1 text-[11px] overflow-x-auto w-full md:w-auto">
            <span className="font-bold text-slate-400 flex items-center gap-1 mr-1 flex-shrink-0">
              <ArrowUpDown size={12} /> 정렬:
            </span>
            {[
              { key: 'subscribers', label: '구독자 순' },
              { key: 'longViews', label: '롱폼 조회수' },
              { key: 'shortsViews', label: '숏츠 조회수' },
              { key: 'price', label: '광고 단가 순' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSortBy(opt.key as SortOption)}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex-shrink-0 ${
                  sortBy === opt.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-bold text-slate-500">검색 결과: {displayedChannels.totalCount}개</span>
        </div>

        {/* 데이터베이스 에러 발생 시 화면에 안내 표시 */}
        {dbError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <div>
              <p className="font-bold">데이터베이스 연동 오류:</p>
              <p>{dbError}</p>
            </div>
          </div>
        )}

        {/* 유튜버 리스트 카드 영역 */}
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            유튜버 목록을 불러오는 중입니다...
          </div>
        ) : displayedChannels.list.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            {dbError ? '데이터베이스 연결을 확인해주세요.' : '조건에 일치하는 유튜버가 없습니다.'}
          </div>
        ) : (
          displayedChannels.list.map((channel) => {
            const cId = cleanId(channel.channel_id || channel.handle || channel.id);
            const isChecked = selectedIds.has(cId);
            const favKey = `youtube_${cId}`;
            const isFavorited = Boolean(favoritesMap[favKey]);
            const { subscribers, longViews, shortsViews, price } = getMetrics(channel);

            const profileImg = channel.profile_img_url || channel.profile_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

            return (
              <div 
                key={channel.id || cId}
                className={`bg-white rounded-2xl border p-4 md:p-5 shadow-2xs hover:shadow-md transition space-y-3 ${
                  isChecked ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleSelectChannel(cId)}
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition cursor-pointer flex-shrink-0 ${
                      isChecked ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-slate-300 hover:border-red-500'
                    }`}
                  >
                    {isChecked && <Check size={13} strokeWidth={3} />}
                  </button>

                  <img 
                    src={profileImg} 
                    alt="" 
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 md:w-13 md:h-13 rounded-full border border-slate-200 object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs md:text-sm font-bold text-slate-900 truncate">{channel.name || channel.channel_name || cId}</h3>
                    <p className="text-[10px] md:text-xs text-slate-400 truncate">@{cleanId(channel.handle || cId)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => toggleFavoriteItem(toFavoriteItem(channel))}
                    className={`py-2 px-1 border rounded-xl transition flex items-center justify-center gap-1 truncate ${
                      isFavorited ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Bookmark size={12} className={isFavorited ? 'fill-amber-500 text-amber-500' : ''} />
                    {isFavorited ? '저장됨' : '즐겨찾기'}
                  </button>

                  <button
                    type="button"
                    onClick={() => alert('광고 문의 창이 열립니다.')}
                    className="py-2 px-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl transition flex items-center justify-center gap-1 truncate"
                  >
                    <Mail size={12} /> 광고문의
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push(`/youtube/${cId}`)}
                    className="py-2 px-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition shadow-xs flex items-center justify-center gap-1 truncate"
                  >
                    채널상세 <ChevronRight size={12} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">구독자 수</span>
                    <p className="text-xs font-black text-slate-900 mt-0.5">{subscribers.toLocaleString()}명</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">평균 조회수 (롱폼)</span>
                    <p className="text-xs font-black text-red-500 mt-0.5">{longViews.toLocaleString()}회</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">평균 조회수 (숏츠)</span>
                    <p className="text-xs font-black text-slate-800 mt-0.5">{shortsViews.toLocaleString()}회</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">광고 단가</span>
                    <p className="text-xs font-black text-red-600 mt-0.5">{isProUser ? `${price.toLocaleString()}원` : 'PRO 전용'}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
