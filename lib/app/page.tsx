'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Lock, Mail, ExternalLink, Video, Smartphone, 
  BarChart3, DollarSign, Film,
  Bookmark, Share2
} from 'lucide-react';

interface Influencer {
  channel_id: string;
  name: string;
  handle: string;
  profile_url: string;
  profile_img_url: string;
  follower_count: number;
  total_video_count: number;
  avg_views: number;
  avg_video_views: number;
  avg_shorts_views: number;
  avg_likes: number;
  avg_comments: number;
  engagement_rate: number;
  estimated_video_cpv_price: number;
  estimated_shorts_cpv_price: number;
  sponsored_video_ratio: number;
  audience_languages: Record<string, number>;
  primary_language: string;
  contact_email: string | null;
  external_links: Record<string, string>;
  tags: string[];
}

export default function VlingStyleDashboard() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Influencer | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'channel' | 'video' | 'audience' | 'revenue' | 'ad_cost'>('channel');
  const [isProUser, setIsProUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('influencers')
      .select('*')
      .order('follower_count', { ascending: false });

    if (!error && data && data.length > 0) {
      setInfluencers(data);
      setSelectedChannel(data[0]); // 첫 번째 채널 기본 선택
    }
    setLoading(false);
  };

  const filteredList = influencers.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen bg-[#f8f9fc] text-[#2c3e50]">
      {/* 1. 좌측 사이드바 (블링 스타일) */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between hidden md:flex sticky top-0 h-screen">
        <div>
          {/* 로고 */}
          <div className="p-5 border-b flex items-center gap-2">
            <span className="text-2xl font-black text-rose-500 tracking-tight">vling</span>
            <span className="text-[10px] bg-rose-50 text-rose-600 font-bold px-1.5 py-0.5 rounded">PRO</span>
          </div>

          {/* 사이드바 메뉴 */}
          <nav className="p-4 space-y-1 text-sm font-medium">
            <div className="text-xs font-semibold text-gray-400 px-3 py-2">인플루언서 탐색</div>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-rose-50 text-rose-600 font-bold">
              <Search className="w-4 h-4" /> 유튜버 찾기
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100">
              <Film className="w-4 h-4" /> 영상 라이브러리
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100">
              <Bookmark className="w-4 h-4" /> 즐겨찾기
            </a>

            <div className="pt-4 text-xs font-semibold text-gray-400 px-3 py-2">분석 도구</div>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100">
              <BarChart3 className="w-4 h-4" /> 채널 비교분석
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100">
              <DollarSign className="w-4 h-4" /> 수익 계산기
            </a>
          </nav>
        </div>

        {/* 플랜 전환 시뮬레이션 토글 */}
        <div className="p-4 border-t bg-gray-50">
          <div className="text-xs text-gray-500 mb-2 font-medium">플랜 모드 시뮬레이션</div>
          <button
            onClick={() => setIsProUser(!isProUser)}
            className={`w-full py-2 text-xs font-bold rounded-lg transition ${
              isProUser ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {isProUser ? '👑 유료(스탠다드) 모드 ON' : '🔒 무료(베이직) 모드 ON'}
          </button>
        </div>
      </aside>

      {/* 2. 중앙 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 상단 검색바 */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="relative w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="채널명 또는 키워드 입력..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-full border border-gray-200 focus:outline-none focus:border-rose-500 bg-gray-50"
            />
          </div>
          <div className="flex items-center gap-4 text-sm">
            <button className="text-gray-600 hover:text-black">요금안내</button>
            <button className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-2 rounded-lg text-xs">
              로그인 / 가입
            </button>
          </div>
        </header>

        {/* 메인 상세 페이지 */}
        {selectedChannel ? (
          <main className="p-8 max-w-6xl mx-auto w-full space-y-6">
            {/* 프로필 헤더 카드 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-5">
                  <img
                    src={selectedChannel.profile_img_url || '/placeholder.png'}
                    alt={selectedChannel.name}
                    className="w-20 h-20 rounded-full border border-gray-100 object-cover shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-extrabold text-gray-900">{selectedChannel.name}</h1>
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Macro
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                      <span>{selectedChannel.handle}</span>
                      <span>•</span>
                      <span>국가: 대한민국</span>
                    </p>
                    <div className="flex gap-2 mt-2">
                      {selectedChannel.tags?.slice(0, 4).map((t, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <button className="p-2.5 border rounded-lg hover:bg-gray-50 text-gray-600">
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <button className="p-2.5 border rounded-lg hover:bg-gray-50 text-gray-600">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <a
                    href={`mailto:${isProUser ? selectedChannel.contact_email : ''}`}
                    className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"
                  >
                    <Mail className="w-4 h-4" /> 광고 문의
                  </a>
                </div>
              </div>

              {/* 통계 요약 4단 그리드 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t text-sm">
                <div>
                  <span className="text-xs text-gray-400">구독자 수</span>
                  <p className="text-lg font-bold text-gray-900">{selectedChannel.follower_count.toLocaleString()}명</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">총 영상 수</span>
                  <p className="text-lg font-bold text-gray-900">{selectedChannel.total_video_count.toLocaleString()}개</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">전체 평균 조회수</span>
                  <p className="text-lg font-bold text-gray-900">{selectedChannel.avg_views.toLocaleString()}회</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">시청자 참여율(ER)</span>
                  <p className="text-lg font-bold text-rose-500">{selectedChannel.engagement_rate}%</p>
                </div>
              </div>
            </div>

            {/* 탭 네비게이션 */}
            <div className="flex border-b border-gray-200 bg-white px-4 rounded-t-xl font-bold text-sm text-gray-500">
              <button
                onClick={() => setActiveTab('channel')}
                className={`py-4 px-5 border-b-2 transition ${
                  activeTab === 'channel' ? 'border-rose-500 text-rose-500' : 'border-transparent hover:text-gray-900'
                }`}
              >
                채널 분석
              </button>
              <button
                onClick={() => setActiveTab('video')}
                className={`py-4 px-5 border-b-2 transition ${
                  activeTab === 'video' ? 'border-rose-500 text-rose-500' : 'border-transparent hover:text-gray-900'
                }`}
              >
                영상 분석
              </button>
              <button
                onClick={() => setActiveTab('audience')}
                className={`py-4 px-5 border-b-2 flex items-center gap-1.5 transition ${
                  activeTab === 'audience' ? 'border-rose-500 text-rose-500' : 'border-transparent hover:text-gray-900'
                }`}
              >
                시청자 분석 {!isProUser && <Lock className="w-3 h-3 text-gray-400" />}
              </button>
              <button
                onClick={() => setActiveTab('revenue')}
                className={`py-4 px-5 border-b-2 flex items-center gap-1.5 transition ${
                  activeTab === 'revenue' ? 'border-rose-500 text-rose-500' : 'border-transparent hover:text-gray-900'
                }`}
              >
                수익 분석 {!isProUser && <Lock className="w-3 h-3 text-gray-400" />}
              </button>
              <button
                onClick={() => setActiveTab('ad_cost')}
                className={`py-4 px-5 border-b-2 flex items-center gap-1.5 transition ${
                  activeTab === 'ad_cost' ? 'border-rose-500 text-rose-500' : 'border-transparent hover:text-gray-900'
                }`}
              >
                광고 단가 {!isProUser && <Lock className="w-3 h-3 text-gray-400" />}
              </button>
            </div>

            {/* 탭 1: 채널 분석 (기본 공개) */}
            {activeTab === 'channel' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4 shadow-sm">
                  <h3 className="font-bold text-gray-900 text-sm">퍼포먼스 요약</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <span className="text-xs text-gray-400">영상별 평균(쇼츠)</span>
                      <p className="text-base font-bold text-gray-800 mt-1">
                        {selectedChannel.avg_shorts_views ? `${(selectedChannel.avg_shorts_views / 10000).toFixed(1)}만` : '-'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <span className="text-xs text-gray-400">영상별 평균(롱폼)</span>
                      <p className="text-base font-bold text-gray-800 mt-1">
                        {selectedChannel.avg_video_views ? `${(selectedChannel.avg_video_views / 10000).toFixed(1)}만` : '-'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <span className="text-xs text-gray-400">평균 좋아요 수</span>
                      <p className="text-base font-bold text-gray-800 mt-1">{selectedChannel.avg_likes.toLocaleString()}개</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <span className="text-xs text-gray-400">유료광고 진행 비중</span>
                      <p className="text-base font-bold text-rose-500 mt-1">{selectedChannel.sponsored_video_ratio}%</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col items-center text-center shadow-sm">
                    <span className="text-xs text-gray-500 font-medium">채널 알고리즘 스코어</span>
                    <div className="w-20 h-20 rounded-full border-4 border-emerald-500 flex flex-col items-center justify-center mt-4">
                      <span className="text-xl font-black text-gray-800">82</span>
                      <span className="text-[10px] text-emerald-600 font-bold">높음</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-3">채널 내 모든 영상 알고리즘 반응의 평균</p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col items-center text-center shadow-sm">
                    <span className="text-xs text-gray-500 font-medium">시청자 참여도</span>
                    <div className="w-20 h-20 rounded-full border-4 border-emerald-500 flex flex-col items-center justify-center mt-4">
                      <span className="text-sm font-black text-emerald-600">높음</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-3">조회수 대비 좋아요 및 댓글 수 종합</p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col items-center text-center shadow-sm">
                    <span className="text-xs text-gray-500 font-medium">구독자 활성도</span>
                    <div className="w-20 h-20 rounded-full border-4 border-emerald-500 flex flex-col items-center justify-center mt-4">
                      <span className="text-sm font-black text-emerald-600">매우 높음</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-3">구독자 수 대비 최근 영상들의 조회수 전환율</p>
                  </div>
                </div>
              </div>
            )}

            {/* 탭 2: 영상 분석 */}
            {activeTab === 'video' && (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm">수집된 영상 라이브러리</h3>
                  <div className="flex gap-2 text-xs">
                    <button className="px-3 py-1 bg-gray-900 text-white rounded-md font-medium">전체</button>
                    <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md font-medium">롱폼만</button>
                    <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md font-medium">쇼츠만</button>
                    <button className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-md font-bold">
                      광고 영상만
                    </button>
                  </div>
                </div>
                <div className="text-center py-12 text-gray-400 text-xs">
                  `influencer_posts` 테이블에서 최신 영상을 로드하는 그리드가 렌더링됩니다.
                </div>
              </div>
            )}

            {/* 탭 3: 시청자 분석 (유료 잠금) */}
            {activeTab === 'audience' && (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 relative overflow-hidden">
                {!isProUser && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                    <Lock className="w-8 h-8 text-rose-500 mb-3" />
                    <h4 className="text-lg font-bold text-gray-900">시청자 분석 데이터 잠김</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm">
                      스탠다드 요금제 이상을 구독하시면 댓글 언어 기반 타깃 국가, 추정 성별/연령대 분석을 확인하실 수 있습니다.
                    </p>
                    <button className="mt-4 bg-rose-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm">
                      스탠다드 플랜 시작하기
                    </button>
                  </div>
                )}
                <h3 className="font-bold text-sm mb-4">주 시청자 댓글 언어 점유율</h3>
                <div className="space-y-3">
                  {selectedChannel.audience_languages &&
                    Object.entries(selectedChannel.audience_languages).map(([lang, pct]) => (
                      <div key={lang} className="text-xs space-y-1">
                        <div className="flex justify-between font-semibold">
                          <span>{lang === 'ko' ? '한국어 (KR)' : lang === 'en' ? '영어 (EN)' : lang}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 탭 4: 광고 단가 (유료 잠금) */}
            {activeTab === 'ad_cost' && (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 relative overflow-hidden">
                {!isProUser && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                    <Lock className="w-8 h-8 text-rose-500 mb-3" />
                    <h4 className="text-lg font-bold text-gray-900">광고 집행 단가 분석 잠김</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm">
                      롱폼 및 쇼츠 CPV 기반 예상 광고 견적과 실제 PPL 진행 추천 단가를 확인하려면 플랜을 업그레이드하세요.
                    </p>
                    <button className="mt-4 bg-rose-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm">
                      광고 단가 기능 잠금 해제
                    </button>
                  </div>
                )}
                <h3 className="font-bold text-sm mb-4">예상 PPL 및 브랜디드 콘텐츠 견적</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <span className="text-xs text-gray-500">롱폼 영상 추천 집행가</span>
                    <p className="text-xl font-bold text-emerald-600 mt-1">
                      약 {selectedChannel.estimated_video_cpv_price.toLocaleString()} 원
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <span className="text-xs text-gray-500">쇼츠 영상 추천 집행가</span>
                    <p className="text-xl font-bold text-emerald-600 mt-1">
                      약 {selectedChannel.estimated_shorts_cpv_price.toLocaleString()} 원
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 탭 5: 수익 분석 (유료 잠금) */}
            {activeTab === 'revenue' && (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 relative overflow-hidden">
                {!isProUser && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                    <Lock className="w-8 h-8 text-rose-500 mb-3" />
                    <h4 className="text-lg font-bold text-gray-900">유튜브 수익 분석 잠김</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm">
                      채널의 월간/연간 예상 애드센스 수익 추정치는 유료 회원 전용 기능입니다.
                    </p>
                    <button className="mt-4 bg-rose-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm">
                      수익 분석 열람하기
                    </button>
                  </div>
                )}
                <h3 className="font-bold text-sm mb-4">예상 애드센스 월 매출</h3>
                <p className="text-2xl font-bold text-gray-900">
                  약 {((selectedChannel.avg_views * 15 * 2.5) / 10000).toFixed(0)}만 원 / 월
                </p>
              </div>
            )}
          </main>
        ) : (
          <div className="text-center py-20 text-gray-400">데이터가 없습니다.</div>
        )}
      </div>
    </div>
  );
}
