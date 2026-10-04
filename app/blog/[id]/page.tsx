'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Mail, Heart, MessageSquare, ShieldCheck, 
  BarChart3, Hash, X, PieChart, Sparkles 
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
  const [activeTab, setActiveTab] = useState<'basic' | 'posts' | 'analytics'>('basic');
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
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [blogId]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-sm text-slate-400">상세 리포트를 불러오는 중입니다...</div>;
  }

  if (!blogger) {
    return <div className="h-screen flex items-center justify-center text-sm text-slate-400">해당 블로그 정보를 찾을 수 없습니다.</div>;
  }

  const avgLikes = blogger.avg_likes ?? blogger.recent_10_avg_likes ?? 45;
  const avgComments = blogger.avg_comments ?? blogger.recent_10_avg_comments ?? 12;
  const estPrice = Math.round((blogger.daily_visitors * 25 + blogger.fan_count * 20) / 10000) * 10000;
  const score = Math.min(99, Math.max(65, Math.round(70 + (blogger.engagement_rate || 4) * 3)));

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-y-auto">
      {/* 상단 네비게이션 */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-20 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
        >
          <ArrowLeft size={16} /> 리스트로 돌아가기
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowKeywordModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
          >
            <Hash size={14} /> 포스팅 키워드 분석
          </button>
          <a 
            href={`mailto:contact@findlist.co.kr`}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition shadow-xs cursor-pointer"
          >
            <Mail size={14} /> 광고 문의하기
          </a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full p-8 space-y-6">
        {/* 프로필 헤더 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-5">
          <img src={blogger.profile_img_url} alt={blogger.name} referrerPolicy="no-referrer" className="w-16 h-16 rounded-full object-cover border" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">{blogger.name}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-green-100 text-green-700">INFLUENCER</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">@{blogger.blog_id}</p>
            <div className="flex gap-1.5 mt-2.5">
              {(blogger.tags || []).map((t, i) => (
                <span key={i} className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">#{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 border-b border-slate-200 pb-2">
          <button onClick={() => setActiveTab('basic')} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'basic' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>기본 트래픽 정보</button>
          <button onClick={() => setActiveTab('posts')} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'posts' ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>콘텐츠 피드 ({posts.length})</button>
          <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'analytics' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>광고비 및 협업 진단</button>
        </div>

        {/* 탭 내용 */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-400">인플루언서 팬</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{(blogger.fan_count || 0).toLocaleString()}명</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-400">일일 평균 방문자</span>
                <p className="text-2xl font-black text-green-600 mt-1">{(blogger.daily_visitors || 0).toLocaleString()}명</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-400">이웃 수</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{(blogger.follower_count || 0).toLocaleString()}명</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-400">평균 공감 / 댓글</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{avgLikes} <span className="text-xs font-normal text-slate-400">/ {avgComments}</span></p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-3">
            {posts.map((p, idx) => (
              <a key={idx} href={p.post_url} target="_blank" rel="noreferrer" className="bg-white p-4 rounded-xl border border-slate-200 flex gap-4 items-center hover:shadow-sm transition block">
                <img src={p.thumbnail_url} alt="" referrerPolicy="no-referrer" className="w-24 h-16 rounded-lg object-cover bg-slate-100 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{p.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{p.summary}</p>
                </div>
                <div className="flex items-center gap-3 text-xs flex-shrink-0 px-4">
                  <span className="text-rose-500 font-medium"><Heart size={12} className="inline mr-1" />{p.like_count || avgLikes}</span>
                  <span className="text-slate-600 font-medium"><MessageSquare size={12} className="inline mr-1" />{p.comment_count || avgComments}</span>
                </div>
              </a>
            ))}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border-2 border-emerald-100">
                <span className="text-[11px] font-bold text-emerald-600 uppercase">포스팅 예상 원고료</span>
                <p className="text-3xl font-black text-slate-900 mt-2">{estPrice.toLocaleString()}원</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border-2 border-blue-100">
                <span className="text-[11px] font-bold text-blue-600 uppercase">협업 매칭 스코어</span>
                <p className="text-3xl font-black text-slate-900 mt-2">{score}점</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border-2 border-purple-100">
                <span className="text-[11px] font-bold text-purple-600 uppercase">독자 참여율 (ER)</span>
                <p className="text-3xl font-black text-purple-600 mt-2">{blogger.engagement_rate || 4.2}%</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 키워드 분석 모달 */}
      {showKeywordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">포스팅 핵심 키워드 클라우드</h3>
              <button onClick={() => setShowKeywordModal(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(blogger.tags || ['여행', '맛집', '일상']).map((t, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">#{t}</span>
              ))}
            </div>
            <button onClick={() => setShowKeywordModal(false)} className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl mt-4">확인</button>
          </div>
        </div>
      )}
    </div>
  );
}
