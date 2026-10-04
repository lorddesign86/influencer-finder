'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Mail, Eye, ThumbsUp, Calendar, Lock, PlaySquare, Users, BarChart2, DollarSign, Activity 
} from 'lucide-react';

interface YoutubeChannel {
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
  comment_count: number;
  published_at: string;
}

export default function YoutubeDetailDashboard() {
  const params = useParams();
  const router = useRouter();
  const channelId = params?.id as string;

  const [channel, setChannel] = useState<YoutubeChannel | null>(null);
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  
  // 5대 탭 구조: channel | video | audience | revenue | pricing
  const [activeTab, setActiveTab] = useState<'channel' | 'video' | 'audience' | 'revenue' | 'pricing'>('channel');
  const [isProUser, setIsProUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelId) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const { data: cData } = await supabase.from('youtube_channels').select('*').eq('channel_id', channelId).single();
        const { data: vData } = await supabase.from('youtube_videos').select('*').eq('channel_id', channelId).order('published_at', { ascending: false });

        if (cData) setChannel(cData as YoutubeChannel);
        if (vData) setVideos(vData as YoutubeVideo[]);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [channelId]);

  if (loading) return <div className="h-screen flex items-center justify-center text-sm text-slate-400 bg-[#f8f9fa]">유튜브 크리에이터 분석 리포트 로딩 중...</div>;
  if (!channel) return <div className="h-screen flex items-center justify-center text-sm text-slate-400 bg-[#f8f9fa]">채널 정보를 찾을 수 없습니다.</div>;

  const avgViews = Math.round((channel.total_view_count || 100000) / Math.max(1, channel.video_count || 50));
  const estAdPrice = Math.round(((channel.subscriber_count || 50000) * 0.08 + avgViews * 0.05) / 10000) * 10000;
  const monthlyRevenue = Math.round(estAdPrice * 1.5 / 10000) * 10000;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-y-auto text-slate-800">
      
      {/* 상단 네비게이션 */}
      <div className="bg-white border-b border-slate-200 px-8 py-3 sticky top-0 z-30 flex items-center justify-between shadow-2xs">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl"
        >
          <ArrowLeft size={14} /> 탐색 리스트로
        </button>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setIsProUser(!isProUser)}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-xs ${
              isProUser ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
            }`}
          >
            {isProUser ? '👑 PRO 모드 활성화됨' : '🔓 무료 회원 (PRO 체험하기)'}
          </button>
          <a 
            href={`mailto:contact@findlist.co.kr?subject=[유튜브 협업문의] ${channel.name}`}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow-sm cursor-pointer"
          >
            <Mail size={14} /> 채널 협업 문의
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full p-8 space-y-6">
        
        {/* 채널 요약 프로필 카드 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img 
              src={channel.profile_img_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
              alt={channel.name} 
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-inner"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">{channel.name}</h1>
                <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 font-extrabold rounded-md">YOUTUBE OFFICIAL</span>
              </div>
              <p className="text-xs text-slate-400">@{channel.handle || channel.channel_id} • 공식 인증 크리에이터</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(channel.tags || ['크리에이터']).map((t, i) => (
                  <span key={i} className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 block">구독자 순위</span>
              <span className="text-lg font-black text-red-600">상위 1%</span>
            </div>
            <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 block">채널 성장 지수</span>
              <span className="text-lg font-black text-purple-600">98.4점</span>
            </div>
          </div>
        </div>

        {/* 5대 탭 네비게이션: 채널 / 영상 / 시청자분석 / 수익분석 / 광고단가분석 */}
        <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('channel')} 
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'channel' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Activity size={14} /> 채널 분석
          </button>
          <button 
            onClick={() => setActiveTab('video')} 
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'video' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <PlaySquare size={14} /> 영상 피드 ({videos.length})
          </button>
          <button 
            onClick={() => setActiveTab('audience')} 
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap relative ${
              activeTab === 'audience' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users size={14} /> 시청자 분석 {!isProUser && <Lock size={12} className="text-amber-500 ml-1 inline" />}
          </button>
          <button 
            onClick={() => setActiveTab('revenue')} 
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap relative ${
              activeTab === 'revenue' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BarChart2 size={14} /> 수익 분석 {!isProUser && <Lock size={12} className="text-amber-500 ml-1 inline" />}
          </button>
          <button 
            onClick={() => setActiveTab('pricing')} 
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap relative ${
              activeTab === 'pricing' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <DollarSign size={14} /> 광고단가 분석 {!isProUser && <Lock size={12} className="text-amber-500 ml-1 inline" />}
          </button>
        </div>

        {/* TAB 1: 채널 분석 */}
        {activeTab === 'channel' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-slate-400">구독자 수</span>
                <p className="text-2xl font-black text-slate-900">{(channel.subscriber_count || 0).toLocaleString()}명</p>
                <div className="text-[11px] text-red-600 font-bold pt-1">대형 크리에이터 채널</div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-slate-400">영상당 평균 조회수</span>
                <p className="text-2xl font-black text-red-600">{avgViews.toLocaleString()}회</p>
                <div className="text-[11px] text-blue-600 font-bold pt-1">높은 화제성 보유</div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-slate-400">총 조회수</span>
                <p className="text-2xl font-black text-slate-900">{(channel.total_view_count || 0).toLocaleString()}회</p>
                <div className="text-[11px] text-slate-500 font-bold pt-1">누적 트래픽 우수</div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-slate-400">총 누적 영상 수</span>
                <p className="text-2xl font-black text-slate-900">{(channel.video_count || 0).toLocaleString()}개</p>
                <div className="text-[11px] text-purple-600 font-bold pt-1">꾸준한 업로드 주기</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 영상 피드 */}
        {activeTab === 'video' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">최근 발행 유튜브 영상 피드</h3>
            <div className="space-y-3">
              {videos.map((v, i) => (
                <a key={i} href={`https://youtube.com/watch?v=${v.video_id}`} target="_blank" rel="noreferrer" className="group bg-slate-50 hover:bg-white p-4 rounded-2xl border border-slate-100 flex gap-4 items-center block transition">
                  <img src={v.thumbnail_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300'} alt="" className="w-32 h-20 rounded-xl object-cover bg-slate-200 flex-shrink-0" referrerPolicy="no-referrer" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-[10px] text-slate-400"><Calendar size={10} className="inline mr-1" />{v.published_at || '2026.10.04'}</span>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition truncate">{v.title}</h4>
                  </div>
                  <div className="flex items-center gap-4 text-xs px-4 py-3 bg-white rounded-xl border border-slate-100 relative">
                    {isProUser ? (
                      <>
                        <span className="text-slate-700 font-bold flex items-center gap-1"><Eye size={14} /> {(v.view_count || avgViews).toLocaleString()}</span>
                        <span className="text-rose-500 font-bold flex items-center gap-1"><ThumbsUp size={14} /> {(v.like_count || 1200).toLocaleString()}</span>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-800 font-bold text-[11px] bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                        <Lock size={12} /> PRO 지표 잠김
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: 시청자 분석 (PRO 전용) */}
        {activeTab === 'audience' && (
          <div>
            {isProUser ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-6">
                <h3 className="text-base font-black text-slate-900">👥 유튜브 채널 시청자 인구통계 및 성향 분석</h3>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <span className="font-bold text-slate-400">주요 연령대 분포</span>
                    <p className="text-base font-black text-slate-900">20대 (42%) / 30대 (31%)</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <span className="font-bold text-slate-400">성별 비율</span>
                    <p className="text-base font-black text-slate-900">여성 58% / 남성 42%</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <span className="font-bold text-slate-400">구독자 충성도</span>
                    <p className="text-base font-black text-red-600">매우 높음 (재시청률 65%)</p>
                  </div>
                </div>
              </div>
            ) : (
              <PaywallCard onUpgrade={() => setIsProUser(true)} title="시청자 분석 데이터는 PRO 회원 전용입니다" />
            )}
          </div>
        )}

        {/* TAB 4: 수익 분석 (PRO 전용) */}
        {activeTab === 'revenue' && (
          <div>
            {isProUser ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-6">
                <h3 className="text-base font-black text-slate-900">📊 유튜브 채널 예상 월간 광고 수익 (AdSense 추정)</h3>
                <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-rose-600">추정 월간 조회수 기반 애드센스 수익</span>
                    <p className="text-3xl font-black text-slate-900 mt-1">{monthlyRevenue.toLocaleString()}원 / 월</p>
                  </div>
                  <span className="text-xs text-rose-700 font-bold bg-white px-4 py-2 rounded-xl border border-rose-200">상위 크리에이터 수익군</span>
                </div>
              </div>
            ) : (
              <PaywallCard onUpgrade={() => setIsProUser(true)} title="채널 예상 수익 분석은 PRO 회원 전용입니다" />
            )}
          </div>
        )}

        {/* TAB 5: 광고단가 분석 (PRO 전용) */}
        {activeTab === 'pricing' && (
          <div>
            {isProUser ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-6">
                <h3 className="text-base font-black text-slate-900">💰 유튜브 협업 광고 단가표 및 견적 가이드</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <span className="text-xs font-bold text-slate-400">브랜디드 영상 제작 단가</span>
                    <p className="text-2xl font-black text-red-600">{(estAdPrice * 3).toLocaleString()}원 ~</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <span className="text-xs font-bold text-slate-400">유튜브 쇼츠 / PPL 단가</span>
                    <p className="text-2xl font-black text-slate-900">{(estAdPrice).toLocaleString()}원 ~</p>
                  </div>
                </div>
              </div>
            ) : (
              <PaywallCard onUpgrade={() => setIsProUser(true)} title="유튜브 광고 단가 및 섭외 견적서는 PRO 회원 전용입니다" />
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function PaywallCard({ title, onUpgrade }: { title: string; onUpgrade: () => void }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-6 shadow-xs">
      <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold shadow-inner">
        <Lock size={28} />
      </div>
      <div className="space-y-2 max-w-md mx-auto">
        <h3 className="text-lg font-black text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          프로페셔널 마케팅을 위한 상세 인사이트와 정확한 섭외 단가 데이터를 무제한으로 열람하세요.
        </p>
      </div>
      <button 
        type="button"
        onClick={onUpgrade}
        className="px-8 py-3.5 bg-gradient-to-r from-red-600 to-rose-500 text-white text-xs font-bold rounded-2xl shadow-md hover:opacity-95 transition cursor-pointer"
      >
        👑 PRO 플랜 업그레이드하고 전체 열람하기
      </button>
    </div>
  );
}
