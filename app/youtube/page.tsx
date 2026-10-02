'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Lock, Mail, ExternalLink, Tag, ArrowUpDown } from 'lucide-react';

interface Influencer {
  channel_id: string;
  name: string;
  handle: string;
  profile_url?: string;
  profile_img_url: string;
  follower_count: number;
  total_video_count: number;
  avg_views: number;
  engagement_rate: number;
  estimated_video_cpv_price: number;
  contact_email: string | null;
  tags: string[];
}

interface Post {
  title: string;
  post_url: string;
  thumbnail_url: string;
  view_count?: number;
  like_count?: number;
}

const YOUTUBE_TAGS = ['전체', '맛집', '먹방', '여행', 'Vlog', 'IT', '뷰티', '패션', '게임'];

export default function YoutubeDashboardPage() {
  const [search, setSearch] = useState('');
  const [ytTag, setYtTag] = useState('전체');
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Influencer | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('influencers')
        .select('*')
        .order('follower_count', { ascending: false })
        .limit(1000);
      if (data) {
        setInfluencers(data as Influencer[]);
        if (data.length > 0) setSelectedChannel(data[0] as Influencer);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedChannel) return;
    const loadPosts = async () => {
      const { data } = await supabase
        .from('influencer_posts')
        .select('*')
        .eq('channel_id', selectedChannel.channel_id)
        .limit(20);
      if (data) setPosts(data as Post[]);
    };
    loadPosts();
  }, [selectedChannel]);

  const filtered = useMemo(() => {
    return influencers.filter((item) => {
      const q = search.trim().toLowerCase();
      const matchSearch = !q || item.name.toLowerCase().includes(q) || (item.handle && item.handle.toLowerCase().includes(q));
      const matchTag = ytTag === '전체' || (item.tags && item.tags.some(t => t.includes(ytTag)));
      return matchSearch && matchTag;
    });
  }, [influencers, search, ytTag]);

  return (
    <>
      {/* 헤더 */}
      <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between flex-shrink-0 z-10">
        <div className="relative w-96 flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          <input 
            type="text" 
            placeholder="유튜버 이름 또는 핸들 검색..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-full text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition"
          />
        </div>
      </header>

      {/* 태그 바 */}
      <div className="bg-white border-b border-slate-200 px-8 py-2.5 flex items-center gap-2 overflow-x-auto flex-shrink-0">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 flex-shrink-0">
          <Tag size={13} /> 태그:
        </span>
        {YOUTUBE_TAGS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setYtTag(t)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
              ytTag === t ? 'bg-red-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 채널 뷰 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 채널 목록 */}
        <div className="w-1/3 border-r border-slate-200 overflow-y-auto bg-white">
          <div className="p-4 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
            <span className="text-xs font-bold text-slate-500">유튜브 채널 ({filtered.length}개)</span>
          </div>
          {filtered.map((channel) => (
            <div 
              key={channel.channel_id}
              onClick={() => setSelectedChannel(channel)}
              className={`p-4 border-b border-slate-100 flex items-center gap-3 cursor-pointer transition ${
                selectedChannel?.channel_id === channel.channel_id ? 'bg-red-50/70 border-l-4 border-l-red-500' : 'hover:bg-slate-50'
              }`}
            >
              <img 
                src={channel.profile_img_url || 'https://via.placeholder.com/150'} 
                alt={channel.name} 
                className="w-12 h-12 rounded-full border border-slate-200 object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 truncate">{channel.name}</h4>
                <p className="text-xs text-slate-400 truncate">@{channel.handle || channel.channel_id}</p>
                <div className="flex items-center gap-2 mt-1 text-[11px]">
                  <span className="font-semibold text-slate-700">구독자 {(channel.follower_count || 0).toLocaleString()}명</span>
                  <span className="text-slate-400">• 평균조회수 {(channel.avg_views || 0).toLocaleString()}회</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 채널 상세 */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#f8f9fa]">
          {selectedChannel && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between">
                <div className="flex gap-4">
                  <img 
                    src={selectedChannel.profile_img_url || 'https://via.placeholder.com/150'} 
                    alt={selectedChannel.name} 
                    className="w-16 h-16 rounded-full border border-slate-200 object-cover"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedChannel.name}</h2>
                    <p className="text-sm text-slate-400 mt-0.5">@{selectedChannel.handle || selectedChannel.channel_id}</p>
                  </div>
                </div>
                {selectedChannel.contact_email && (
                  <a href={`mailto:${selectedChannel.contact_email}`} className="text-xs font-semibold px-4 py-2 bg-red-500 text-white rounded-lg flex items-center gap-1.5">
                    <Mail size={14} /> 문의하기
                  </a>
                )}
              </div>

              {/* 지표 카드 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <p className="text-xs text-slate-400">구독자 수</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{(selectedChannel.follower_count || 0).toLocaleString()}명</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <p className="text-xs text-slate-400">평균 조회수</p>
                  <p className="text-2xl font-black text-red-500 mt-1">{(selectedChannel.avg_views || 0).toLocaleString()}회</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <p className="text-xs text-slate-400">참여율</p>
                  <p className="text-2xl font-black text-purple-600 mt-1">{selectedChannel.engagement_rate || 3.2}%</p>
                </div>
              </div>

              {/* 포스트 그리드 */}
              <div className="grid grid-cols-2 gap-4">
                {posts.map((video, idx) => (
                  <a key={idx} href={video.post_url} target="_blank" rel="noreferrer" className="bg-white p-3 rounded-xl border border-slate-100 block">
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-200 mb-2">
                      <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 truncate">{video.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">조회수 {(video.view_count || 0).toLocaleString()}회</p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
