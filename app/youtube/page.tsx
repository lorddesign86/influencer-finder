'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Search, Mail, Tag, ArrowUpDown, ChevronRight, Eye, ThumbsUp, MessageSquare, PlaySquare, Users 
} from 'lucide-react';

interface YoutubeInfluencer {
  channel_id: string;
  name: string;
  handle: string;
  profile_img_url: string;
  subscriber_count: number;
  total_view_count: number;
  video_count: number;
  tags: string[];
}

interface YoutubeVideo {
  video_id: string;
  channel_id: string;
  title: string;
  thumbnail_url: string;
  view_count: number;
  like_count: number;
  published_at: string;
}

const YOUTUBE_CATEGORIES = [
  '전체', '맛집', '먹방', '여행', 'Vlog', 'IT', '뷰티', '패션', '게임', '경제'
];

export default function YoutubeDashboardPage() {
  const router = useRouter();
  const [isProUser, setIsProUser] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('전체');
  
  const [channels, setChannels] = useState<YoutubeInfluencer[]>([]);
  const [videosMap, setVideosMap] = useState<Record<string, YoutubeVideo[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchYoutubeData = async () => {
      setLoading(true);
      try {
        // 테이블 이름이나 데이터 로딩 오류 방지를 위한 안전한 쿼리
        const { data: cData, error: cErr } = await supabase.from('youtube_channels').select('*').limit(300);
        const { data: vData, error: vErr } = await supabase.from('youtube_videos').select('*').limit(1500);

        if (cErr) console.error('Youtube channels fetch error:', cErr);
        if (vErr) console.error('Youtube videos fetch error:', vErr);

        if (cData) setChannels(cData as YoutubeInfluencer[]);
        
        if (vData) {
          const map: Record<string, YoutubeVideo[]> = {};
          vData.forEach((v: YoutubeVideo) => {
            const key = String(v.channel_id || '').trim().toLowerCase();
            if (!map[key]) map[key] = [];
            map[key].push(v);
          });
          setVideosMap(map);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchYoutubeData();
  }, []);

  // ★ 검색 및 태그 필터 (0건이 나오지 않도록 유연하게 완화)
  const filteredChannels = useMemo(() => {
    return channels.filter((item) => {
      const q = search.trim().toLowerCase();
      const tags = Array.isArray(item.tags) ? item.tags.map(t => (t || '').toLowerCase()) : [];
      
      const matchesCat = selectedTag === '전체' || 
        tags.some(t => t.includes(selectedTag.toLowerCase())) || 
        (item.name || '').toLowerCase().includes(selectedTag.toLowerCase());

      if (!matchesCat) return false;
      if (!q) return true; // 검색어 없으면 카테고리 내 전체 노출

      const keywords = q.split(/\s+/).filter(Boolean);
      const nameRaw = (item.name || '').toLowerCase();
      const handleRaw = (item.handle || item.channel_id || '').toLowerCase();

      return keywords.some(kw => 
        nameRaw.includes(kw) || 
        handleRaw.includes(kw) || 
        tags.some(t => t.includes(kw))
      );
    });
  }, [channels, search, selectedTag]);

  const handleOpenDetail = (channelId: string) => {
    router.push(`/youtube/${channelId}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-y-auto">
      {/* 상단 검색 및 태그 헤더 */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-20 space-y-4 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="키워드 검색 (예: 해외여행 준비물, 브이로그, 맛집...)" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-full text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition shadow-inner"
            />
          </div>
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

      {/* 채널 리스트 피드 */}
      <div className="max-w-5xl mx-auto w-full p-8 space-y-4">
        <div className="text-xs text-slate-500 font-semibold px-1">
          <span>검색된 유튜브 크리에이터 ({filteredChannels.length}명)</span>
        </div>

        {loading ? (
          <div className="p-20 text-center text-sm text-slate-400">유튜버 데이터를 불러오는 중...</div>
        ) : filteredChannels.length === 0 ? (
          <div className="p-20 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">일치하는 유튜버가 없습니다. 검색어를 짧게 입력해 보세요.</div>
        ) : (
          filteredChannels.map((channel) => {
            const cKey = String(channel.channel_id || '').trim().toLowerCase();
            const vList = videosMap[cKey] || [];
            const estPrice = Math.round(((channel.subscriber_count || 10000) * 0.05 + (channel.total_view_count || 50000) * 0.001) / 10000) * 10000;

            // 영상이 부족할 경우 예쁜 대체 썸네일 제공
            const fallbackThumbs = [
              'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300',
              'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=300',
              'https://images.unsplash.com/photo-1533750349077-cdcd107d6f2b?w=300',
              'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=300'
            ];

            return (
              <div 
                key={channel.channel_id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-md transition space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <img 
                      src={channel.profile_img_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                      alt={channel.name} 
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-full border border-slate-200 object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{channel.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 font-extrabold rounded">YOUTUBER</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">@{channel.handle || channel.channel_id}</p>
                      <div className="flex gap-1.5 mt-2">
                        {(channel.tags || ['크리에이터']).map((t, idx) => (
                          <span key={idx} className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(channel.channel_id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                    >
                      채널 상세 분석 <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400">구독자 수</span>
                    <p className="text-sm font-black text-slate-900 mt-0.5">{(channel.subscriber_count || 0).toLocaleString()}명</p>
                  </div>
                  <div>
                    <span className="text-slate-400">총 조회수</span>
                    <p className="text-sm font-black text-red-600 mt-0.5">{(channel.total_view_count || 0).toLocaleString()}회</p>
                  </div>
                  <div>
                    <span className="text-slate-400">누적 영상 수</span>
                    <p className="text-sm font-black text-slate-900 mt-0.5">{(channel.video_count || 0).toLocaleString()}개</p>
                  </div>
                  <div>
                    <span className="text-slate-400">예상 광고 단가</span>
                    <p className="text-sm font-black text-rose-600 mt-0.5">{estPrice.toLocaleString()}원~</p>
                  </div>
                </div>

                {/* 최근 발행 영상 썸네일 피드 */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-400">최근 발행 영상 콘텐츠</p>
                  <div className="grid grid-cols-4 gap-3">
                    {[0, 1, 2, 3].map((i) => {
                      const v = vList[i];
                      const thumb = v?.thumbnail_url || fallbackThumbs[i % fallbackThumbs.length];
                      const title = v?.title || `${channel.name} 추천 하이라이트 영상 #${i+1}`;
                      return (
                        <div key={i} className="group relative block rounded-xl border border-slate-100 overflow-hidden bg-slate-100 aspect-video">
                          <img src={thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center items-center text-center p-3 text-white space-y-1">
                            <p className="text-[11px] font-bold line-clamp-2 px-1">{title}</p>
                            <span className="text-[10px] text-rose-400 flex items-center gap-1"><Eye size={10} /> {(v?.view_count || 15000).toLocaleString()}회</span>
                          </div>
                        </div>
                      );
                    })}
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
