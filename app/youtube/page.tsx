'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Search, Tag, ChevronRight, Eye, Lock, Sparkles, Mail, AlertTriangle 
} from 'lucide-react';

const YOUTUBE_CATEGORIES = [
  '전체', '맛집', '먹방', '여행', 'Vlog', 'IT', '뷰티', '패션', '게임', '경제'
];

export default function YoutubeDashboardPage() {
  const router = useRouter();
  const [isProUser, setIsProUser] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('전체');
  
  const [channels, setChannels] = useState<any[]>([]);
  const [postsMap, setPostsMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchYoutubeData = async () => {
      setLoading(true);
      try {
        const { data: cData, error: cErr } = await supabase
          .from('influencers')
          .select('*')
          .eq('platform', 'youtube')
          .limit(300);

        const { data: pData, error: pErr } = await supabase
          .from('influencer_posts')
          .select('*')
          .limit(2000);

        if (cErr) console.error('influencers fetch error:', cErr);
        if (pErr) console.error('influencer_posts fetch error:', pErr);

        if (cData) setChannels(cData);
        
        if (pData) {
          const map: Record<string, any[]> = {};
          pData.forEach((p: any) => {
            const keys = [
              String(p.channel_id || '').trim().toLowerCase(),
              String(p.influencer_id || '').trim().toLowerCase(),
              String(p.id || '').trim().toLowerCase()
            ].filter(Boolean);

            keys.forEach(k => {
              if (!map[k]) map[k] = [];
              map[k].push(p);
            });
          });
          setPostsMap(map);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchYoutubeData();
  }, []);

  const displayedChannels = useMemo(() => {
    const q = search.trim().toLowerCase();
    
    if (!q && selectedTag === '전체') {
      const sorted = [...channels].sort((a, b) => {
        // 실제 스키마의 follwer_count 및 subscriber_count 매칭
        const subA = Number(a.follwer_count ?? a.subscriber_count ?? a.subscribers ?? 0);
        const subB = Number(b.follwer_count ?? b.subscriber_count ?? b.subscribers ?? 0);
        return subB - subA;
      });
      return { list: sorted.slice(0, 5), isDefaultRecommend: true };
    }

    const filtered = channels.filter((item) => {
      const tags = Array.isArray(item.tags) ? item.tags.map((t: string) => t.toLowerCase()) : [];
      const matchesCat = selectedTag === '전체' || 
        tags.some(t => t.includes(selectedTag.toLowerCase())) || 
        (item.name || '').toLowerCase().includes(selectedTag.toLowerCase());

      if (!matchesCat) return false;
      if (!q) return true;

      const keywords = q.split(/\s+/).filter(Boolean);
      const nameRaw = (item.name || '').toLowerCase();
      const handleRaw = (item.handle || item.channel_id || '').toLowerCase();

      return keywords.some(kw => 
        nameRaw.includes(kw) || 
        handleRaw.includes(kw) || 
        tags.some(t => t.includes(kw))
      );
    });

    return { list: filtered, isDefaultRecommend: false };
  }, [channels, search, selectedTag]);

  const handleOpenDetail = (channel: any) => {
    const targetId = channel.channel_id || channel.id;
    router.push(`/youtube/${targetId}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-y-auto">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-20 space-y-4 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="유튜버 이름이나 키워드를 검색하세요 (예: 보검TV, 브이로그...)" 
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

      <div className="max-w-5xl mx-auto w-full p-8 space-y-4">
        {displayedChannels.isDefaultRecommend && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 p-4 rounded-2xl flex items-center justify-between text-xs text-red-900 shadow-2xs">
            <div className="flex items-center gap-2 font-bold">
              <Sparkles size={16} className="text-red-600" />
              <span>실시간 추천 대형 유튜버 파워 채널 베스트 5</span>
            </div>
            <span className="text-[11px] text-red-600 font-semibold">검색창에서 원하는 크리에이터를 검색해 보세요!</span>
          </div>
        )}

        <div className="text-xs text-slate-500 font-semibold px-1">
          <span>검색된 유튜브 크리에이터 ({displayedChannels.list.length}명)</span>
        </div>

        {loading ? (
          <div className="p-20 text-center text-sm text-slate-400">유튜버 데이터를 불러오는 중...</div>
        ) : displayedChannels.list.length === 0 ? (
          <div className="p-20 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">일치하는 유튜버가 없습니다. 검색어를 짧게 입력해 보세요.</div>
        ) : (
          displayedChannels.list.map((channel) => {
            const idKey = String(channel.id || '').trim().toLowerCase();
            const cidKey = String(channel.channel_id || '').trim().toLowerCase();
            const pList = postsMap[cidKey] || postsMap[idKey] || [];

            // ★ 공유해주신 정확한 DB 헤더 스키마 매핑
            const subs = Number(channel.follwer_count ?? channel.subscriber_count ?? channel.subscribers ?? 0);
            const longFormViews = Number(channel.avg_video_views ?? channel.avg_views ?? 0);
            const shortFormViews = Number(channel.avg_shorts_views ?? 0);
            const estPrice = Number(channel.estimated_video_cpv_price ?? channel.ad_price ?? 0);

            const profileImg = channel.profile_img_url || channel.profile_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
            const tagsList = Array.isArray(channel.tags) ? channel.tags : (typeof channel.tags === 'string' ? channel.tags.split(',') : ['크리에이터']);

            return (
              <div 
                key={channel.id || channel.channel_id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-md transition space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <img 
                      src={profileImg} 
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
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {tagsList.map((t: string, idx: number) => (
                          <span key={idx} className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            #{t.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`mailto:${channel.contact_email || 'contact@findlist.co.kr'}?subject=[유튜브 협업문의] ${channel.name} 채널 광고 문의`}
                      className="flex items-center gap-1 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <Mail size={13} /> 광고 문의
                    </a>
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(channel)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                    >
                      채널 상세 분석 <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* ★ 구독자수(follwer_count), 롱폼조회수(avg_video_views), 숏폼조회수(avg_shorts_views), 광고단가(estimated_video_cpv_price) */}
                <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400">구독자 수</span>
                    <p className="text-sm font-black text-slate-900 mt-0.5">{subs > 0 ? `${subs.toLocaleString()}명` : '데이터 없음'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">평균 조회수 (롱폼)</span>
                    <p className="text-sm font-black text-slate-900 mt-0.5">{longFormViews > 0 ? `${longFormViews.toLocaleString()}회` : '데이터 없음'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">평균 조회수 (숏폼)</span>
                    <p className="text-sm font-black text-red-600 mt-0.5">{shortFormViews > 0 ? `${shortFormViews.toLocaleString()}회` : '데이터 없음'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">광고 단가 (PRO)</span>
                    {isProUser ? (
                      <p className="text-sm font-black text-rose-600 mt-0.5">{estPrice > 0 ? `${estPrice.toLocaleString()}원~` : '데이터 없음'}</p>
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

                {/* 최근 발행 영상 콘텐츠 (influencer_posts) */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-400">최근 발행 영상 콘텐츠</p>
                  {pList.length > 0 ? (
                    <div className="grid grid-cols-4 gap-3">
                      {pList.slice(0, 4).map((p: any, i: number) => {
                        const thumb = p.thumbnail_url || p.thumbnail || p.image_url || '';
                        const title = p.title || p.post_title || '영상 제목 없음';
                        const pViews = Number(p.view_count || p.views || 0);

                        return (
                          <div key={i} className="group relative block rounded-xl border border-slate-100 overflow-hidden bg-slate-100 aspect-video">
                            {thumb ? (
                              <img src={thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 bg-slate-200">썸네일 없음</div>
                            )}
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center items-center text-center p-3 text-white space-y-1">
                              <p className="text-[11px] font-bold line-clamp-2 px-1">{title}</p>
                              <span className="text-[10px] text-rose-400 flex items-center gap-1"><Eye size={10} /> {pViews > 0 ? `${pViews.toLocaleString()}회` : '조회수 없음'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-amber-700 font-semibold flex items-center justify-center gap-1.5">
                      <AlertTriangle size={14} /> `influencer_posts` 테이블에 해당 채널의 영상 데이터가 매칭되지 않았습니다.
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {!isProUser && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-xs mt-8">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center font-bold">
              <Lock size={22} />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-sm font-black text-slate-900">더 많은 유튜브 인플루언서 리스트가 기다리고 있습니다</h3>
              <p className="text-xs text-slate-500">
                무료 버전에서는 샘플 채널만 제공됩니다. PRO 플랜으로 업그레이드하고 전체 크리에이터 데이터베이스와 상세 지표를 무제한으로 탐색하세요!
              </p>
            </div>
            <button 
              type="button"
              onClick={() => setIsProUser(true)}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-500 text-white text-xs font-bold rounded-2xl shadow-md hover:opacity-95 transition cursor-pointer"
            >
              👑 PRO 버전 이용하고 전체 리스트 보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
