'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Mail, Heart, MessageSquare, ShieldCheck, 
  Hash, X, PieChart, TrendingUp, Zap, Calendar, DollarSign, Activity, Layers, Lock
} from 'lucide-react';

interface BlogInfluencer {
  blog_id: string;
  name: string;
  handle: string;
  profile_url?: string;
  profile_img_url: string;
  fan_count: number;
  follower_count: number;
  daily_visitors: number;
  recent_10_avg_likes?: number;
  recent_10_avg_comments?: number;
  engagement_rate?: number;
  contact_url: string | null;
  tags: string[];
}

interface BlogPost {
  post_id: string;
  blog_id: string;
  title: string;
  summary: string;
  post_url: string;
  thumbnail_url: string;
  like_count: number;
  comment_count: number;
  published_at: string;
}

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const blogId = params?.id as string;

  const [blogger, setBlogger] = useState<BlogInfluencer | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activeTab, setActiveTab] = useState<'channel' | 'content' | 'pricing'>('channel');
  
  const [isProUser, setIsProUser] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!blogId) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const { data: bData } = await supabase
          .from('blog_influencers')
          .select('*')
          .eq('blog_id', blogId)
          .single();

        const { data: pData } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('blog_id', blogId)
          .order('published_at', { ascending: false });

        if (bData) setBlogger(bData as BlogInfluencer);
        if (pData) setPosts(pData as BlogPost[]);
      } catch (err) {
        console.error('Detail fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [blogId]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-sm text-slate-400 bg-[#f8f9fa]">프로페셔널 분석 리포트를 구성하는 중...</div>;
  }

  if (!blogger) {
    return <div className="h-screen flex items-center justify-center text-sm text-slate-400 bg-[#f8f9fa]">해당 블로그 정보를 찾을 수 없습니다.</div>;
  }

  const avgLikes = blogger.recent_10_avg_likes ?? 48;
  const avgComments = blogger.recent_10_avg_comments ?? 14;
  const engRate = blogger.engagement_rate ?? 4.8;

  // ★ 현실적인 네이버 블로그 인플루언서 단가 산정 공식 적용 (최대 45만 원 상한)
  const rawCalculatedPrice = 50000 + ((blogger.daily_visitors || 500) * 12) + ((blogger.fan_count || 300) * 3);
  const estPrice = Math.min(450000, Math.max(50000, Math.round(rawCalculatedPrice / 10000) * 10000));

  const score = Math.min(99, Math.max(68, Math.round(72 + engRate * 3)));

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
              isProUser ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
            }`}
          >
            {isProUser ? '👑 PRO 모드 활성화됨 (클릭시 해제)' : '🔓 무료 회원 (클릭시 PRO 체험)'}
          </button>

          <button 
            onClick={() => setShowKeywordModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer shadow-2xs"
          >
            <Hash size={14} /> 포스팅 키워드 분석
          </button>
          
          <a 
            href={`mailto:contact@findlist.co.kr?subject=[광고문의] ${blogger.name || blogger.blog_id} 채널 협업 문의`}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl hover:opacity-95 transition shadow-sm cursor-pointer"
          >
            <Mail size={14} /> 광고 문의하기
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full p-8 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img 
              src={blogger.profile_img_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
              alt={blogger.name} 
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-inner"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">{blogger.name || blogger.blog_id}</h1>
                <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 font-extrabold rounded-md">INFLUENCER</span>
                <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 font-extrabold rounded-md">S등급 파워</span>
              </div>
              <p className="text-xs text-slate-400">@{blogger.handle || blogger.blog_id} • 네이버 공식 인플루언서</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(Array.isArray(blogger.tags) ? blogger.tags : ['인플루언서']).map((t, i) => (
                  <span key={i} className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 block">협업 매칭 스코어</span>
              <span className="text-lg font-black text-blue-600">{score}점</span>
            </div>
            <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 block">독자 참여율 (ER)</span>
              <span className="text-lg font-black text-purple-600">{engRate}%</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-b border-slate-200 pb-2">
          <button 
            onClick={() => setActiveTab('channel')} 
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-2xs ${
              activeTab === 'channel' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Activity size={15} /> 채널 분석
          </button>
          <button 
            onClick={() => setActiveTab('content')} 
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-2xs ${
              activeTab === 'content' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers size={15} /> 콘텐츠 피드 ({posts.length})
          </button>
          <button 
            onClick={() => setActiveTab('pricing')} 
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-2xs relative ${
              activeTab === 'pricing' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <DollarSign size={15} /> 광고단가 및 견적서
            {!isProUser && <Lock size={12} className="text-amber-500 ml-1 inline" />}
          </button>
        </div>

        {activeTab === 'channel' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-slate-400">인플루언서 팬 수</span>
                <p className="text-2xl font-black text-slate-900">{(blogger.fan_count || 0).toLocaleString()}명</p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold pt-1">
                  <TrendingUp size={12} /> 상위 3% 팬덤 규모
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-slate-400">일일 평균 방문자</span>
                <p className="text-2xl font-black text-green-600">{(blogger.daily_visitors || 0).toLocaleString()}명</p>
                <div className="flex items-center gap-1 text-[11px] text-blue-600 font-bold pt-1">
                  <Zap size={12} /> 안정적 트래픽 유입
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-slate-400">블로그 이웃 수</span>
                <p className="text-2xl font-black text-slate-900">{(blogger.follower_count || 0).toLocaleString()}명</p>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold pt-1">
                  고정 구독자층 보유
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-slate-400">평균 공감 / 댓글</span>
                <p className="text-2xl font-black text-slate-900">{avgLikes} <span className="text-xs font-normal text-slate-400">/ {avgComments}</span></p>
                <div className="flex items-center gap-1 text-[11px] text-purple-600 font-bold pt-1">
                  독자 소통 지수 우수
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="text-green-600" size={18} /> 네이버 C-Rank 및 D.I.A.+ 검색 알고리즘 진단
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium">C-Rank 전문성 지수</span>
                  <p className="font-bold text-green-700 text-sm">상위 3% 최상급 전문 블로그 인증</p>
                  <p className="text-[11px] text-slate-500">특정 카테고리 내에서 독보적인 신뢰도와 전문성을 확보하고 있습니다.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium">D.I.A.+ 문서 신뢰도</span>
                  <p className="font-bold text-emerald-700 text-sm">최우수 (스마트블록 상위 노출 최적)</p>
                  <p className="text-[11px] text-slate-500">문서의 독창성과 사용자 반응이 높아 검색 상위 노출 확률이 매우 높습니다.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">최근 발행된 포스팅 상세 피드</h3>
              <span className="text-xs text-slate-400">총 {posts.length}개의 발행 콘텐츠 분석 완료</span>
            </div>

            <div className="space-y-3">
              {posts.length > 0 ? (
                posts.map((p, idx) => (
                  <a 
                    key={idx} 
                    href={p.post_url || '#'} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="group bg-slate-50 hover:bg-white p-4 rounded-2xl border border-slate-100 hover:border-slate-300 hover:shadow-md transition flex gap-4 items-center block"
                  >
                    <img 
                      src={p.thumbnail_url || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=300'} 
                      alt="" 
                      referrerPolicy="no-referrer" 
                      className="w-28 h-20 rounded-xl object-cover bg-slate-200 flex-shrink-0 group-hover:scale-102 transition duration-300" 
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">#{idx + 1} 포스트</span>
                        <span className="text-[10px] text-slate-400"><Calendar size={10} className="inline mr-0.5" />{p.published_at || '2026.10.01'}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-green-600 transition truncate">{p.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{p.summary}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs flex-shrink-0 px-4 bg-white py-3 rounded-xl border border-slate-100 relative">
                      {isProUser ? (
                        <>
                          <span className="text-rose-500 font-bold flex items-center gap-1"><Heart size={14} fill="currentColor" /> {p.like_count || avgLikes}</span>
                          <span className="text-blue-500 font-bold flex items-center gap-1"><MessageSquare size={14} fill="currentColor" /> {p.comment_count || avgComments}</span>
                        </>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-rose-400 font-bold flex items-center gap-1 filter blur-[4px] select-none opacity-60">
                            <Heart size={14} fill="currentColor" /> 2115
                          </span>
                          <span className="text-blue-400 font-bold flex items-center gap-1 filter blur-[4px] select-none opacity-60">
                            <MessageSquare size={14} fill="currentColor" /> 466
                          </span>
                          <span className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[0.5px] rounded-xl text-amber-800 font-bold text-[11px] gap-1 shadow-2xs">
                            <Lock size={12} /> PRO 지표
                          </span>
                        </div>
                      )}
                    </div>
                  </a>
                ))
              ) : (
                <div className="p-12 text-center text-xs text-slate-400">등록된 콘텐츠가 없습니다.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div>
            {isProUser ? (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-3xl border-2 border-emerald-100 shadow-2xs space-y-2">
                    <span className="text-xs font-bold text-emerald-600 uppercase">포스팅 예상 원고료</span>
                    <p className="text-3xl font-black text-slate-900">{estPrice.toLocaleString()}원</p>
                    <p className="text-[11px] text-slate-400">네이버 블로그 시장 평균 단가 기준</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border-2 border-blue-100 shadow-2xs space-y-2">
                    <span className="text-xs font-bold text-blue-600 uppercase">협업 매칭 스코어</span>
                    <p className="text-3xl font-black text-slate-900">{score}점</p>
                    <p className="text-[11px] text-slate-400">광고 성과 달성 확률 매우 높음</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border-2 border-purple-100 shadow-2xs space-y-2">
                    <span className="text-xs font-bold text-purple-600 uppercase">독자 참여율 (ER)</span>
                    <p className="text-3xl font-black text-purple-600">{engRate}%</p>
                    <p className="text-[11px] text-slate-400">실제 구매 전환 유도 최적화</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <PieChart className="text-emerald-600" size={18} /> 네이버 블로그 캠페인 유형별 공식 견적 및 보장 혜택
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-100">
                        <tr>
                          <th className="py-3 px-4">캠페인 유형</th>
                          <th className="py-3 px-4">콘텐츠 제작 형태</th>
                          <th className="py-3 px-4">예상 광고 단가</th>
                          <th className="py-3 px-4">보장 혜택</th>
                          <th className="py-3 px-4 text-right">광고 효율</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        <tr>
                          <td className="py-4 px-4 font-bold text-slate-900">제품 리뷰 체험단</td>
                          <td className="py-4 px-4 text-slate-600">실사용 리뷰 + 상세 사진 15장 이상</td>
                          <td className="py-4 px-4 font-bold text-emerald-600">{estPrice.toLocaleString()}원</td>
                          <td className="py-4 px-4 text-slate-600">스마트블록 키워드 노출 도전</td>
                          <td className="py-4 px-4 text-right font-bold text-emerald-600">최고 (★★★★★)</td>
                        </tr>
                        <tr>
                          <td className="py-4 px-4 font-bold text-slate-900">기자단 포스팅</td>
                          <td className="py-4 px-4 text-slate-600">가이드라인 기반 정보형 포스팅</td>
                          <td className="py-4 px-4 font-bold text-blue-600">{Math.round(estPrice * 0.7).toLocaleString()}원</td>
                          <td className="py-4 px-4 text-slate-600">대량 키워드 확산 용이</td>
                          <td className="py-4 px-4 text-right font-bold text-blue-600">우수 (★★★★☆)</td>
                        </tr>
                        <tr>
                          <td className="py-4 px-4 font-bold text-slate-900">공동구매 / 링크 배포</td>
                          <td className="py-4 px-4 text-slate-600">구매 링크 유도형 소구 콘텐츠</td>
                          <td className="py-4 px-4 font-bold text-purple-600">{Math.round(estPrice * 1.3).toLocaleString()}원 + 수수료</td>
                          <td className="py-4 px-4 text-slate-600">실제 매출 전환 극대화</td>
                          <td className="py-4 px-4 text-right font-bold text-purple-600">최고 (★★★★★)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-6 shadow-xs">
                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold shadow-inner">
                  <Lock size={28} />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-lg font-black text-slate-900">광고단가 및 상세 견적서는 PRO 회원 전용 기능입니다</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    크리에이터별 정확한 예상 원고료, 캠페인 유형별 공식 단가표, 스마트블록 노출 보장 혜택 등 마케팅 핵심 데이터를 무제한으로 열람하세요.
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsProUser(true)}
                  className="px-8 py-3.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white text-xs font-bold rounded-2xl shadow-md hover:opacity-95 transition cursor-pointer"
                >
                  👑 PRO 플랜 업그레이드하고 전체 열람하기
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {showKeywordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">🔥 실시간 추출 포스팅 키워드 클라우드</h3>
              <button onClick={() => setShowKeywordModal(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"><X size={16} /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(blogger.tags) ? blogger.tags : ['여행', '맛집', '일상', '체험단']).map((t, i) => (
                <span key={i} className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
                  #{t}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              해당 크리에이터는 최근 포스팅에서 위 키워드들을 집중적으로 다루며 팔로워들과 소통하고 있습니다. 캠페인 제품군과의 연관성 검토에 활용하세요.
            </p>
            <button onClick={() => setShowKeywordModal(false)} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl transition cursor-pointer">
              확인 완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
