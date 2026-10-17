'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Sparkles, ArrowRight, HelpCircle } from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');

  // 플랜별 가격 정의 (월간 / 연간 할인 적용가)
  const plans = [
    {
      id: 'basic',
      name: '베이직',
      badge: null,
      priceMonthly: 'Free',
      priceAnnually: 'Free',
      desc: '무료 제공 솔루션',
      isCurrent: true,
      teams: '1인',
      features: [
        'Agent-V 질문 횟수 일 10회',
        '검색 횟수 일 3회',
        '채널 상세 조회 일 3회',
        '영상 상세 조회 일 3회',
        '유튜브 수익 계산기 일 5회',
      ],
      functions: [
        '채널/영상 검색 기본 필터',
        'AI 인사이트 3회',
      ],
      buttonText: '이용중',
      buttonStyle: 'bg-slate-100 text-slate-700 cursor-default',
    },
    {
      id: 'standard',
      name: '스탠다드',
      badge: null,
      priceMonthly: '₩199,900',
      priceAnnually: '₩99,950',
      desc: '광고 제안의 첫걸음',
      isCurrent: false,
      teams: '1인',
      features: [
        'Agent-V 질문 횟수 월 200회',
        '검색 횟수 월 200회 (일 최대 20회)',
        '채널 상세 조회 월 200회',
        '영상 상세 조회 월 200회',
        '유튜브 수익 계산기 무제한',
        '시청자 분석 월 20회',
        '광고 단가 기능 월 20회',
      ],
      functions: [
        '베이직의 모든 기능 포함',
        '내 채널 리포트 조회',
        '채널/영상 검색 심화 필터',
        'AI 인사이트 무제한',
        '요즘 또는 채널/영상 전체 데이터 조회',
        '캠페인 성과 대시보드 동시 모니터링 가능 영상 수 10개',
      ],
      buttonText: '시작하기',
      buttonStyle: 'bg-white border border-slate-300 hover:border-slate-400 text-slate-900',
    },
    {
      id: 'startup',
      name: '스타트업',
      badge: '추천 요금제',
      priceMonthly: '₩399,900',
      priceAnnually: '₩199,950',
      desc: '유튜버 매칭을 위한 솔루션',
      isCurrent: false,
      teams: '3인',
      features: [
        'Agent-V 질문 횟수 월 500회',
        '검색 횟수 월 500회',
        '채널 상세 조회 월 500회',
        '영상 상세 조회 월 500회',
        '유튜브 수익 계산기 무제한',
        '시청자 분석 월 100회',
        '광고 단가 기능 월 100회',
      ],
      functions: [
        '스탠다드의 모든 기능 포함',
        '데이터 다운로드',
        '캠페인 성과 대시보드 동시 모니터링 가능 영상 수 100개',
      ],
      buttonText: '시작하기',
      buttonStyle: 'bg-[#FF0038] hover:bg-[#e60032] text-white shadow-md',
    },
    {
      id: 'professional',
      name: '프로페셔널',
      badge: null,
      priceMonthly: '₩999,900',
      priceAnnually: '₩499,950',
      desc: '효율적인 마케팅을 위한 솔루션',
      isCurrent: false,
      teams: '10인',
      features: [
        'Agent-V 질문 횟수 무제한',
        '검색 횟수 무제한',
        '채널 상세 조회 무제한',
        '영상 상세 조회 무제한',
        '유튜브 수익 계산기 무제한',
        '시청자 분석 무제한',
        '광고 단가 기능 무제한',
      ],
      functions: [
        '스타트업의 모든 기능 포함',
        '캠페인 성과 대시보드 동시 모니터링 가능 영상 수 300개',
      ],
      buttonText: '시작하기',
      buttonStyle: 'bg-white border border-slate-300 hover:border-slate-400 text-slate-900',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-y-auto p-10 space-y-12">
      {/* 상단 타이틀 및 토글 영역 */}
      <div className="max-w-6xl mx-auto w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900">요금 안내</h1>
          <a 
            href="https://blog.vling.net/tutorial-pricing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <span>내게 적합한 요금제 알아보기</span>
            <ArrowRight size={13} />
          </a>
        </div>

        {/* 월간 / 연간 토글 버튼 */}
        <div className="inline-flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              billingCycle === 'monthly' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            월간
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annually')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              billingCycle === 'annually' ? 'bg-[#FF0038] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>연간</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${billingCycle === 'annually' ? 'bg-white text-[#FF0038]' : 'bg-rose-100 text-rose-600'}`}>
              최대 50% 할인
            </span>
          </button>
        </div>
      </div>

      {/* 요금제 카드 4열 그리드 */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`bg-white rounded-3xl border p-6 flex flex-col justify-between transition relative shadow-xs ${
              plan.badge ? 'border-[#FF0038] ring-2 ring-rose-100' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {plan.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF0038] text-white text-[10px] font-black px-3 py-1 rounded-full shadow-xs">
                {plan.badge}
              </span>
            )}

            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">{plan.name}</h3>
                <p className="text-xs text-slate-500 font-medium">{plan.desc}</p>
              </div>

              <div className="py-2">
                <div className="text-2xl font-black text-slate-900">
                  {billingCycle === 'annually' ? plan.priceAnnually : plan.priceMonthly}
                  {plan.priceMonthly !== 'Free' && <span className="text-xs font-normal text-slate-500"> / 월</span>}
                </div>
                {plan.priceMonthly !== 'Free' && (
                  <p className="text-[10px] text-slate-400 mt-0.5">(부가세 별도)</p>
                )}
              </div>

              <button
                type="button"
                className={`w-full py-3 rounded-2xl text-xs font-bold transition cursor-pointer shadow-2xs ${plan.buttonStyle}`}
                onClick={() => {
                  if (plan.id === 'basic') return;
                  alert(`${plan.name} 플랜 결제/업그레이드 페이지로 이동합니다.`);
                }}
              >
                {plan.buttonText}
              </button>

              <div className="space-y-4 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <p className="font-bold text-slate-900 mb-2">
                    Teams 최대 인원 : <span className="text-red-600">{plan.teams}</span>
                  </p>
                  <p className="font-bold text-slate-900 mb-2">사용량 :</p>
                  <ul className="space-y-2 text-slate-600">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.functions.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <p className="font-bold text-slate-900 mb-2">기능 :</p>
                    <ul className="space-y-2 text-slate-600">
                      {plan.functions.map((func, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                          <span>{func}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 하단 엔터프라이즈 배너 */}
      <div className="max-w-6xl mx-auto w-full bg-white rounded-3xl border border-slate-200 p-8 flex items-center justify-between shadow-xs">
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-900">엔터프라이즈</h3>
          <p className="text-xs text-slate-500">
            유튜브 내 브랜드 언급 현황부터 비즈니스 조건에 맞춘 커스텀 API까지 제공하는 맞춤형 분석 솔루션
          </p>
        </div>
        <button
          type="button"
          onClick={() => alert('엔터프라이즈 도입 상담 신청 페이지로 이동합니다.')}
          className="px-6 py-3 bg-white border border-slate-300 hover:border-slate-400 text-slate-900 rounded-2xl text-xs font-bold transition cursor-pointer shadow-xs whitespace-nowrap"
        >
          자세히 보기
        </button>
      </div>
    </div>
  );
}
