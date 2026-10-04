'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Mail, Eye, ThumbsUp, Calendar, Lock, PlaySquare, Users, BarChart2, DollarSign, Activity 
} from 'lucide-react';

export default function YoutubeDetailDashboard() {
  const params = useParams();
  const rawId = params?.id as string;
  const router = useRouter();

  const [channel, setChannel] = useState<any | null>(null);
  const [videos, setVideos] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'channel' | 'video' | 'audience' | 'revenue' | 'pricing'>('channel');
  const [isProUser, setIsProUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rawId) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        // 1. channel_id로 먼저 조회 시도
        let { data: cData } = await supabase
          .from('influencers')
          .select('*')
          .eq('channel_id', rawId)
          .single();

        // 2. 데이터가 없으면 고유 id(숫자 또는 문자열)로 재조회
        if (!cData) {
          const { data: cDataById } = await supabase
            .from('influencers')
            .select('*')
            .eq('id', isNaN(Number(rawId)) ? rawId : Number(rawId))
            .single();
          cData = cDataById;
        }

        if (cData) {
          setChannel(cData);
          const lookupKey = String(cData.channel_id || cData.id).trim().toLowerCase();

          // 관련 포스트/영상 조회
          const { data: vData } = await supabase
            .from('influencer_posts')
            .select('*');

          if (vData) {
            const matchedVideos = vData.filter((v: any) => 
              String(v.channel_id || v.influencer_id || '').trim().toLowerCase() === lookupKey
            );
            setVideos(matchedVideos);
          }
        }
      } catch (err) {
        console.error('Detail fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [rawId]);

  if (loading) return <div className="h-screen flex items-center justify-center text-sm text-slate-400 bg-[#f8f9fa]">유튜브 크리에이터 분석 리포트 로딩 중...</div>;
  if (!channel) return <div className="h-screen flex items-center justify-center text-sm text-slate-400 bg-[#f8f9fa]">해당 채널 정보를 찾을 수 없습니다.</div>;

  const subs = Number(channel.subscriber_count ?? channel.subscribers ?? 50000);
  const totalViews = Number(channel.total_view_count ?? channel.view_count ?? 200000);
  const vCount = Number(channel.video_count ?? channel.videos_count ?? 50);

  const avgViews = vCount > 0 ? Math.round(totalViews / vCount) : 15000;
  const estAdPrice = Math.round((subs * 0.05 + avgViews * 0.002) / 10000) * 10000;
  const monthlyRevenue = Math.round(estAdPrice * 1.5 / 10000) * 10000;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-y-auto text-slate-800">
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
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img 
              src={channel.profile_img_url || channel.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
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
                {(Array.isArray(channel.tags) ? channel.tags : ['크리에이터']).map((t: string, i: number) => (
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

        <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          <button onClick={() => setActiveTab('channel')} className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'channel' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
            <Activity size={14} /> 채널 분석
          </button>
          <button onClick={() => setActiveTab('video')} className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'video' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
            <PlaySquare size={14} /> 영상 피드 ({videos.length})
          </button>
          <button onClick={() => setActiveTab('audience')} className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap relative ${activeTab === 'audience' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
            <Users size={14} /> 시청자 분석 {!isProUser && <Lock size={12} className="text-amber-500 ml-1 inline" />}
          </button>
          <button onClick={() => setActiveTab('revenue')} className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap relative ${activeTab === 'revenue' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
            <BarChart2 size={14} /> 수익 분석 {!isProUser && <Lock size={12} className="text-amber-500 ml-1 inline" />}
          </button>
          <button onClick={() => setActiveTab('pricing')} className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap relative ${activeTab === 'pricing' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
            <DollarSign size={14} /> 광고단가 분석 {!isProUser && <Lock size={12} className="text-amber-500 ml-1 inline" />}
          </button>
        </div>

        {activeTab === 'channel' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-slate-400">구독자 수</span>
                <p className="text-2xl font-black text-slate-900">{subs.toLocaleString()}명</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-slate-400">영상당 평균 조회수</span>
                <p className="text-2xl font-black text-red-600">{avgViews.toLocaleString()}회</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-slate-400">총 조회수</span>
                <p className="text-2xl font-black text-slate-900">{totalViews.toLocaleString()}회</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-slate-400">총 누적 영상 수</span>
                <p className="text-2xl font-black text-slate-900">{vCount.toLocaleString()}개</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'video' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">최근 발행 유튜브 영상 피드</h3>
            <div className="space-y-3">
              {videos.length > 0 ? videos.map((v, i) => (
                <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-4 items-center">
                  <img src={v.thumbnail_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300'} alt="" className="w-32 h-20 rounded-xl object-cover bg-slate-200 flex-shrink-0" referrerPolicy="no-referrer" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-[10px] text-slate-400"><Calendar size={10} className="inline mr-1" />{v.published_at || '2026.10.04'}</span>
                    <h4 className="text-xs font-bold text-slate-900 truncate">{v.title}</h4>
                  </div>
                  <div className="flex items-center gap-4 text-xs px-4 py-3 bg-white rounded-xl border border-slate-100">
                    <span className="text-slate-700 font-bold flex items-center gap-1"><Eye size={14} /> {(Number(v.view_count) || avgViews).toLocaleString()}</span>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-xs text-slate-400">등록된 영상 피드가 없습니다.</div>
              )}
            </div>
          </div>
        )}

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
                    <p className="text-2xl font-black text-slate-900">{estAdPrice.toLocaleString()}원 ~</p>
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
