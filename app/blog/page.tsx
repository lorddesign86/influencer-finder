'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { usePro } from '../ClientLayout';
import { 
  Lock, Mail, ExternalLink, Heart, MessageSquare, 
  Calendar, ArrowUpDown, Tag, AlertCircle, BookOpen,
  Users, Eye
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
  avg_likes: number;
  avg_comments: number;
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

const BLOG_CATEGORIES = [
  '전체', '여행', '패션', '뷰티', '푸드', 'IT테크', '자동차', '리빙',
  '육아', '생활건강', '게임', '동물·펫', '운동·레저', '프로스포츠',
  '방송·연예', '대중음악', '영화', '공연·전시', '도서', '경제·비즈니스', '어학·교육'
];

type FanRange = 'all' | 'under1k' | 'over3k' | 'over5k' | 'over10k';
type BlogSortOption = 'fan_desc' | 'visitors_desc' | 'follower_desc' | 'likes_desc' | 'comments_desc';

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

export default function BlogFinderPage() {
  const { isProUser, togglePro } = usePro();
  const searchParams = useSearchParams();
  const search = searchParams.get('q') || ''; // 상단 공통 검색바 값 연동

  const [bloggers, setBloggers] = useState<BlogInfluencer[]>([]);
  const [selectedBlogger, setSelectedBlogger] = useState<BlogInfluencer | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // 블로그 전용 필터
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [fanRange, setFanRange] = useState<FanRange>('all');
  const [minVisitors, setMinVisitors] = useState<string>(''); 
  const [maxVisitors, setMaxVisitors] = useState<string>(''); 
  const [sortBy, setSortBy] = useState<BlogSortOption>('fan_desc');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchBloggers = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (!supabase) throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
      const { data, error } = await supabase
        .from('blog_influencers')
        .select('*')
        .order('fan_count', { ascending: false })
        .limit(2000);

      if (error) {
        setErrorMessage(error.message);
      } else if (data) {
        setBloggers(data as BlogInfluencer[]);
        if (data.length > 0 && !selectedBlogger) {
          handleSelectBlogger(data[0] as BlogInfluencer);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBloggerPosts = async (blogger: BlogInfluencer) => {
    if (!blogger) return;
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('blog_id', blogger.blog_id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        setPosts([]);
      } else if (data) {
        setPosts(data as BlogPost[]);
      }
    } catch (e) {
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleSelectBlogger = (blogger: BlogInfluencer) => {
    setSelectedBlogger(blogger);
    if (blogger) {
      fetchBloggerPosts(blogger);
    }
  };

  useEffect(() => {
    fetchBloggers();
  }, []);

  const filteredBloggers = useMemo(() => {
    const list = bloggers
      .filter((item) => {
        const q = search.trim().toLowerCase();
        const matchesSearch = !q || 
          (item.name && item.name.toLowerCase().includes(q)) || 
          (item.handle && item.handle.toLowerCase().includes(q));

        const matchesCategory = selectedCategory === '전체' || 
          (item.tags && item.tags.some(t => t.includes(selectedCategory))) ||
          (item.name && item.name.includes(selectedCategory));

        const fans = item.fan_count || 0;
        let matchesFan = true;
        if (fanRange === 'under1k') matchesFan = fans <= 1000;
        else if (fanRange === 'over3k') matchesFan = fans >= 3000;
        else if (fanRange === 'over5k') matchesFan = fans >= 5000;
        else if (fanRange === 'over10k') matchesFan = fans >= 10000;

        const visitors = item.daily_visitors || 0;
        let matchesVisitors = true;
        const minV = minVisitors ? parseInt(minVisitors, 10) : null;
        const maxV = maxVisitors ? parseInt(maxVisitors, 10) : null;
        if (minV !== null && !isNaN(minV) && visitors < minV) matchesVisitors = false;
        if (maxV !== null && !isNaN(maxV) && visitors > maxV) matchesVisitors = false;

        return matchesSearch && matchesCategory && matchesFan && matchesVisitors;
      })
      .sort((a, b) => {
        if (!isProUser) return 0;
        if (sortBy === 'fan_desc') return (b.fan_count || 0) - (a.fan_count || 0);
        if (sortBy === 'visitors_desc') return (b.daily_visitors || 0) - (a.daily_visitors || 0);
        if (sortBy === 'follower_desc') return (b.follower_count || 0) - (a.follower_count || 0);
        if (sortBy === 'likes_desc') return (b.avg_likes || 0) - (a.avg_likes || 0);
        if (sortBy === 'comments_desc') return (b.avg_comments || 0) - (a.avg_comments || 0);
        return 0;
      });

    if (!isProUser) {
      return shuffleArray(list).slice(0, 20);
    }
    return list.slice(0, 1000);
  }, [bloggers, search, selectedCategory, fanRange, minVisitors, maxVisitors, sortBy, isProUser]);

  const resetFilters = () => {
    setSelectedCategory('전체');
    setFanRange('all');
    setMinVisitors('');
    setMaxVisitors('');
    setSortBy('fan_desc');
  };

  const handleProFilterClick = () => {
    if (!isProUser) {
      alert('🔒 상세 수치 및 정렬 필터는 PRO 멤버십 전용 기능입니다.');
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#f8f9fa]">
      {/* 1. 상단 21개 카테고리 태그 */}
      <div className="bg-white border-b border-slate-200 px-8 py-2.5 flex items-center gap-2 overflow-x-auto flex-shrink-0">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 flex-shrink-0">
          <Tag size={13} /> 분류:
        </span>
        {BLOG_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
              selectedCategory === cat 
                ? 'bg-green-600 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 2. 블로그 전용 다중 수치 필터 바 */}
      <div className="bg-slate-50/80 border-b border-slate-200 px-8 py-2.5 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* 팬 수 구간 선택 */}
          <div className="relative">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition ${
              isProUser ? 'bg-white border-slate-200' : 'bg-slate-100 border-dashed border-amber-300'
            }`}>
              {isProUser ? <Users size={14} className="text-slate-400" /> : <Lock size={14} className="text-amber-500" />}
              <select
                disabled={!isProUser}
                value={fanRange}
                onChange={(e) => setFanRange(e.target.value as FanRange)}
                className={`bg-transparent font-medium outline-none ${
                  isProUser ? 'text-slate-700 cursor-pointer' : 'text-slate-400 pointer-events-none'
                }`}
              >
                <option value="all">팬 수 전체 {!isProUser && '(PRO)'}</option>
                <option value="under1k">1,000명 이하</option>
                <option value="over3k">3,000명 이상</option>
                <option value="over5k">5,000명 이상</option>
                <option value="over10k">1만명 이상</option>
              </select>
            </div>
            {!isProUser && (
              <button
                type="button"
                onClick={handleProFilterClick}
                className="absolute inset-0 w-full h-full cursor-pointer z-10 bg-transparent"
              />
            )}
          </div>

          {/* 일일 방문자 직접 입력 범위 */}
          <div className="relative flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            <Eye size={13} className="text-slate-400 mr-1" />
            <span className="text-slate-500 font-medium">일방문자:</span>
            <input
              type="number"
              disabled={!isProUser}
              placeholder="최소(명)"
              value={minVisitors}
              onChange={(e) => setMinVisitors(e.target.value)}
              className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-center outline-none focus:border-green-500 text-slate-700"
            />
            <span className="text-slate-400">~</span>
            <input
              type="number"
              disabled={!isProUser}
              placeholder="최대(명)"
              value={maxVisitors}
              onChange={(e) => setMaxVisitors(e.target.value)}
              className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-center outline-none focus:border-green-500 text-slate-700"
            />
            {!isProUser && (
              <button
                type="button"
                onClick={handleProFilterClick}
                className="absolute inset-0 w-full h-full cursor-pointer z-10 bg-transparent"
              />
            )}
          </div>

          {/* 정렬 옵션 */}
          <div className="relative">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition ${
              isProUser ? 'bg-white border-slate-200' : 'bg-slate-100 border-dashed border-amber-300'
            }`}>
              {isProUser ? <ArrowUpDown size={14} className="text-slate-400" /> : <Lock size={14} className="text-amber-500" />}
              <select
                disabled={!isProUser}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as BlogSortOption)}
                className={`bg-transparent font-medium outline-none ${
                  isProUser ? 'text-slate-700 cursor-pointer' : 'text-slate-400 pointer-events-none'
                }`}
              >
                <option value="fan_desc">인플루언서 팬 많은 순 {!isProUser && '(PRO)'}</option>
                <option value="visitors_desc">일일 방문자 많은 순</option>
                <option value="follower_desc">이웃(팔로워) 많은 순</option>
                <option value="likes_desc">평균 공감 많은 순</option>
                <option value="comments_desc">평균 댓글 많은 순</option>
              </select>
            </div>
            {!isProUser && (
              <button
                type="button"
                onClick={handleProFilterClick}
                className="absolute inset-0 w-full h-full cursor-pointer z-10 bg-transparent"
              />
            )}
          </div>
        </div>

        {(selectedCategory !== '전체' || fanRange !== 'all' || minVisitors !== '' || maxVisitors !== '' || sortBy !== 'fan_desc') && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-green-600 hover:underline font-semibold cursor-pointer"
          >
            필터 초기화
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="bg-red-50 border-b border-red-200 px-8 py-2 flex items-center gap-2 text-xs text-red-600">
          <AlertCircle size={15} />
          <span>데이터베이스 연결 오류: {errorMessage}</span>
        </div>
      )}

      {/* 3. 본문: 블로거 목록 & 우측 대시보드 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 블로거 목록 */}
        <div className="w-1/3 border-r border-slate-200 overflow-y-auto bg-white flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <span className="text-xs font-bold text-slate-500">
                블로그 인플루언서 ({filteredBloggers.length}명 {isProUser ? '전체' : '샘플'})
              </span>
              {!isProUser && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  무료 샘플 20명
                </span>
              )}
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">데이터를 불러오는 중...</div>
            ) : filteredBloggers.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">일치하는 블로그 인플루언서가 없습니다.</div>
            ) : (
              filteredBloggers.map((blogger) => (
                <div 
                  key={blogger.blog_id}
                  onClick={() => handleSelectBlogger(blogger)}
                  className={`p-4 border-b border-slate-100 flex items-center gap-3 cursor-pointer transition ${
                    selectedBlogger?.blog_id === blogger.blog_id ? 'bg-green-50/70 border-l-4 border-l-green-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <img 
                    src={blogger.profile_img_url || 'https://via.placeholder.com/150'} 
                    alt={blogger.name} 
                    className="w-12 h-12 rounded-full border border-slate-200 object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{blogger.name}</h4>
                      <span className="text-[9px] px-1.5 py-0.2 bg-green-100 text-green-700 font-bold rounded">INFLUENCER</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">@{blogger.handle || blogger.blog_id}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px]">
                      <span className="font-semibold text-slate-700">팬 {(blogger.fan_count || 0).toLocaleString()}명</span>
                      <span className="text-slate-400">• 일방문 {(blogger.daily_visitors || 0).toLocaleString()}명</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {!isProUser && (
            <div className="p-4 bg-gradient-to-t from-slate-50 to-white border-t border-slate-200 text-center sticky bottom-0">
              <p className="text-xs text-slate-500 mb-2 font-medium">현재 무료 모드로 <strong>20명</strong>만 표시 중입니다.</p>
              <button
                type="button"
                onClick={togglePro}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:brightness-105 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Lock size={13} /> PRO 결제하고 전체 블로거 확인하기 →
              </button>
            </div>
          )}
        </div>

        {/* 우측 블로거 상세 분석 대시보드 */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#f8f9fa]">
          {selectedBlogger ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* 상단 프로필 카드 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                <div className="flex gap-4">
                  <img 
                    src={selectedBlogger.profile_img_url || 'https://via.placeholder.com/150'} 
                    alt={selectedBlogger.name} 
                    className="w-16 h-16 rounded-full border border-slate-200 object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">{selectedBlogger.name}</h2>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-bold">네이버 공식 인플루언서</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-0.5">@{selectedBlogger.handle || selectedBlogger.blog_id}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(selectedBlogger.tags || []).map((t, idx) => (
                        <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">#{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a 
                    href={selectedBlogger.contact_url || selectedBlogger.profile_url || `https://blog.naver.com/${selectedBlogger.blog_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm cursor-pointer"
                  >
                    <Mail size={14} /> 문의하기
                  </a>
                </div>
              </div>

              {/* 블로그 4대 핵심 지표 */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-medium text-slate-400 mb-1">인플루언서 팬 수</p>
                  <p className="text-xl font-extrabold text-slate-900">{(selectedBlogger.fan_count || 0).toLocaleString()}명</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-medium text-slate-400 mb-1">일일 평균 방문자</p>
                  <p className="text-xl font-extrabold text-green-600">{(selectedBlogger.daily_visitors || 0).toLocaleString()}명</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-medium text-slate-400 mb-1">이웃(팔로워) 수</p>
                  <p className="text-xl font-extrabold text-slate-900">{(selectedBlogger.follower_count || 0).toLocaleString()}명</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-medium text-slate-400 mb-1">평균 공감 / 댓글</p>
                  <p className="text-xl font-extrabold text-slate-900">
                    {(selectedBlogger.avg_likes || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">/ {(selectedBlogger.avg_comments || 0).toLocaleString()}</span>
                  </p>
                </div>
              </div>

              {/* 최근 발행 블로그 글 목록 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-green-600" />
                    <h3 className="text-sm font-bold text-slate-800">최근 발행 콘텐츠</h3>
                    <span className="text-xs text-slate-400 font-normal">({posts.length}개 포스트)</span>
                  </div>
                  <a 
                    href={selectedBlogger.profile_url || `https://blog.naver.com/${selectedBlogger.blog_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-400 hover:text-green-600 flex items-center gap-1 font-medium"
                  >
                    블로그 홈 바로가기 <ExternalLink size={12} />
                  </a>
                </div>

                {loadingPosts ? (
                  <p className="text-xs text-slate-400 py-8 text-center">블로그 포스트를 불러오는 중입니다...</p>
                ) : posts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">등록된 최신 포스트 데이터가 없습니다.</p>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <a
                        key={post.post_id}
                        href={post.post_url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex gap-4 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition bg-slate-50/50"
                      >
                        <div className="w-40 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-slate-200 relative">
                          <img 
                            src={post.thumbnail_url || 'https://via.placeholder.com/300x200?text=No+Image'} 
                            alt={post.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-green-600 transition truncate">
                              {post.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                              {post.summary || '내용 미리보기가 제공되지 않는 포스트입니다.'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100/80">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} /> {post.published_at || '최근 작성'}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 text-rose-500 font-medium">
                                <Heart size={12} /> 공감 {(post.like_count || 0).toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1 text-slate-600 font-medium">
                                <MessageSquare size={12} /> 댓글 {(post.comment_count || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">
              선택된 블로그 인플루언서가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
