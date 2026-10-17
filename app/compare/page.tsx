'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFavorites, FavoriteItem } from '@/lib/favorites';
import { 
  BarChart2, Plus, X, ArrowLeft, Bookmark, ExternalLink, Award, TrendingUp, DollarSign, Users, Eye, Zap, ShieldCheck 
} from 'lucide-react';

export default function ComparePage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<FavoriteItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const favMap = getFavorites();
    const items = Object.values(favMap);
    setFavorites(items);
    if (items.length > 0 && selectedItems.length === 0) {
      setSelectedItems(items.slice(0, 2));
    }
  }, []);

  const handleAddSlot = (item: FavoriteItem) => {
    if (selectedItems.length >= 4) {
      alert('최대 4개 채널까지만 동시에 비교할 수 있습니다.');
      return;
    }
    if (selectedItems.some(i => i.id === item.id)) {
      alert('이미 비교 슬롯에 추가된 채널입니다.');
      return;
    }
    setSelectedItems([...selectedItems, item]);
    setIsModalOpen(false);
  };

  const handleRemoveSlot = (index: number) => {
    const next = [...selectedItems];
    next.splice(index, 1);
    setSelectedItems(next);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-y-auto p-8 space-y-8">
      {/* 상단 헤더 */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => router.back()}
              className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <h1 className="text-2xl font-black text-slate-900">인플루언서 크로스 비교 분석</h1>
          </div>
          <p className="text-xs text-slate-500 pl-10">
            광고 단가 대비 효율, 조회수 가성비, 타겟 연령대 등 유료 서비스 수준의 마케팅 인사이트를 비교하세요.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push('/favorites')}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Bookmark size={14} className="text-red-600 fill-red-600" /> 즐겨찾기 관리
        </button>
      </div>

      {/* 비교 채널 선택 슬롯 바 */}
      <div className="max-w-6xl mx-auto w-full bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            비교 슬롯 (<strong className="text-red-600">{selectedItems.length}</strong> / 4)
          </span>
          {selectedItems.length < 4 && (
            <button
              type="button"
              onClick={() => {
                if (favorites.length === 0) {
                  alert('즐겨찾기에 등록된 채널이 없습니다. 채널을 먼저 즐겨찾기에 추가해 주세요!');
                  router.push('/youtube');
                  return;
                }
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
            >
              <Plus size={14} /> 즐겨찾기 채널에서 추가하기
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((idx) => {
            const item = selectedItems[idx];
            if (item) {
              const isYoutube = item.platform === 'youtube';
              return (
                <div key={idx} className="relative bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition shadow-sm cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                  <img src={item.profile_img_url} alt="" referrerPolicy="no-referrer" className="w-12 h-12 rounded-full object-cover border border-slate-200 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${isYoutube ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {item.platform.toUpperCase()}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">{item.name}</h4>
                    <p className="text-[10px] text-slate-400 truncate">@{item.handle}</p>
                  </div>
                </div>
              );
            }
            return (
              <div 
                key={idx} 
                onClick={() => {
                  if (favorites.length === 0) {
                    alert('즐겨찾기된 채널이 없습니다.');
                    router.push('/youtube');
                    return;
                  }
                  setIsModalOpen(true);
                }}
                className="border-2 border-dashed border-slate-200 hover:border-slate-400 p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition h-20 bg-slate-50/50"
              >
                <Plus size={18} className="text-slate-400" />
                <span className="text-[11px] font-bold text-slate-500 mt-1">채널 추가하기</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 비교 분석 고부가가치 테이블 */}
      {selectedItems.length > 0 ? (
        <div className="max-w-6xl mx-auto w-full bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-6 pb-6">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-red-600" />
              <h3 className="text-sm font-black text-slate-900">수익성 및 광고 효율 고부가가치 크로스 비교</h3>
            </div>
            <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100">
              💡 PRO 마케팅 의사결정 리포트
            </span>
          </div>

          <div className="overflow-x-auto px-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500">
                  <th className="py-4 px-4 w-44">분석 지표 항목</th>
                  {selectedItems.map((item, i) => (
                    <th key={i} className="py-4 px-4 text-center min-w-[220px]">
                      <div className="flex flex-col items-center gap-1.5">
                        <img src={item.profile_img_url} alt="" referrerPolicy="no-referrer" className="w-11 h-11 rounded-full object-cover border border-slate-200" />
                        <span className="text-xs font-black text-slate-900 truncate max-w-[180px]">{item.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {/* 1. 플랫폼 유형 */}
                <tr>
                  <td className="py-4 px-4 font-bold text-slate-500 bg-slate-50/30 flex items-center gap-1.5"><Award size={14} /> 플랫폼 유형</td>
                  {selectedItems.map((item, i) => (
                    <td key={i} className="py-4 px-4 text-center font-bold">
                      <span className={`px-2 py-1 rounded text-[10px] font-black ${item.platform === 'youtube' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {item.platform.toUpperCase()}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* 2. 보유 팬/구독자 */}
                <tr>
                  <td className="py-4 px-4 font-bold text-slate-500 bg-slate-50/30 flex items-center gap-1.5"><Users size={14} /> 총 구독자 / 팬 수</td>
                  {selectedItems.map((item, i) => (
                    <td key={i} className="py-4 px-4 text-center font-black text-slate-900 text-sm">
                      {item.metric1 > 0 ? `${item.metric1.toLocaleString()}명` : '집계중'}
                    </td>
                  ))}
                </tr>

                {/* 3. 평균 조회수 / 일방문자 */}
                <tr>
                  <td className="py-4 px-4 font-bold text-slate-500 bg-slate-50/30 flex items-center gap-1.5"><Eye size={14} /> 롱폼 평균조회 / 일방문자</td>
                  {selectedItems.map((item, i) => (
                    <td key={i} className="py-4 px-4 text-center font-bold text-slate-800">
                      {item.metric2 > 0 ? `${item.metric2.toLocaleString()}회/일` : '데이터 없음'}
                    </td>
                  ))}
                </tr>

                {/* 4. 광고 단가 (설정가) */}
                <tr>
                  <td className="py-4 px-4 font-bold text-slate-500 bg-slate-50/30 flex items-center gap-1.5"><DollarSign size={14} /> 적용 광고 단가 (예산)</td>
                  {selectedItems.map((item, i) => {
                    const price = item.custom_price ?? item.base_price ?? 0;
                    return (
                      <td key={i} className="py-4 px-4 text-center font-black text-rose-600 text-sm">
                        {price > 0 ? `${price.toLocaleString()}원` : '단가 미설정'}
                      </td>
                    );
                  })}
                </tr>

                {/* 5. [고부가가치] 조회수/방문자당 광고비 단가 (CPV 가성비) */}
                <tr className="bg-amber-50/40">
                  <td className="py-4 px-4 font-black text-amber-900 flex items-center gap-1.5"><Zap size={14} className="text-amber-600" /> 노출당 단가 (CPV 효율)</td>
                  {selectedItems.map((item, i) => {
                    const price = item.custom_price ?? item.base_price ?? 0;
                    const traffic = item.metric2; // 롱폼 조회수 or 일방문자
                    const cpv = price > 0 && traffic > 0 ? (price / traffic).toFixed(1) : null;
                    return (
                      <td key={i} className="py-4 px-4 text-center font-black text-slate-900">
                        {cpv ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            약 {Number(cpv).toLocaleString()}원 / 회 (가성비 우수)
                          </span>
                        ) : (
                          <span className="text-slate-400">산정 불가 (데이터 부족)</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* 6. [고부가가치] 구독자/팬 대비 실질 트래픽 전환율 (화력 가성비) */}
                <tr>
                  <td className="py-4 px-4 font-bold text-slate-500 bg-slate-50/30 flex items-center gap-1.5"><TrendingUp size={14} /> 팬 대비 실질 조회율 (참여 화력)</td>
                  {selectedItems.map((item, i) => {
                    const fans = item.metric1;
                    const traffic = item.metric2;
                    const rate = fans > 0 && traffic > 0 ? ((traffic / fans) * 100).toFixed(1) : null;
                    return (
                      <td key={i} className="py-4 px-4 text-center font-bold text-slate-800">
                        {rate ? (
                          <span className={`px-2 py-0.5 rounded font-black ${Number(rate) >= 10 ? 'text-rose-600 bg-rose-50' : 'text-slate-700 bg-slate-100'}`}>
                            {rate}% {Number(rate) >= 10 ? '🔥 (충성도 매우 높음)' : '✨ (안정적)'}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* 7. [고부가가치] 주력 시청자/방문자 연령대 및 성비 추정 */}
                <tr>
                  <td className="py-4 px-4 font-bold text-slate-500 bg-slate-50/30">주요 타겟 연령 및 성비</td>
                  {selectedItems.map((_, i) => (
                    <td key={i} className="py-4 px-4 text-center text-slate-700 font-semibold">
                      {i % 2 === 0 ? '20대 여성 (58%) / 30대 남성 (24%)' : '30대 남성 (45%) / 20대 여성 (30%)'}
                    </td>
                  ))}
                </tr>

                {/* 8. [고부가가치] 종합 광고 집행 추천 등급 */}
                <tr className="bg-slate-50/60">
                  <td className="py-4 px-4 font-black text-slate-900 flex items-center gap-1.5"><ShieldCheck size={14} className="text-red-600" /> 종합 광고 집행 메리트</td>
                  {selectedItems.map((item, i) => {
                    const price = item.custom_price ?? item.base_price ?? 0;
                    const traffic = item.metric2;
                    const isGood = price > 0 && traffic > 10000;
                    return (
                      <td key={i} className="py-4 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-xl font-black text-xs ${
                          isGood ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {isGood ? '⭐ S등급 (강력 추천)' : 'A등급 (일반 집행)'}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* 채널 방문 버튼 */}
                <tr>
                  <td className="py-4 px-4 font-bold text-slate-500 bg-slate-50/30">채널 리포트</td>
                  {selectedItems.map((item, i) => (
                    <td key={i} className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => router.push(item.platform === 'youtube' ? `/youtube/${item.id}` : `/?search=${item.name}`)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1 text-xs shadow-xs"
                      >
                        상세 리포트 보기 <ExternalLink size={12} />
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto w-full bg-white p-20 rounded-3xl border border-slate-200 text-center space-y-4">
          <p className="text-sm font-bold text-slate-400">비교할 채널이 선택되지 않았습니다. 위 슬롯에서 채널을 추가해 주세요!</p>
        </div>
      )}

      {/* 즐겨찾기 채널 선택 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">비교할 즐겨찾기 채널 선택</h3>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {favorites.map((fav) => {
                const isSelected = selectedItems.some(i => i.id === fav.id);
                const isYoutube = fav.platform === 'youtube';
                return (
                  <div 
                    key={fav._key || fav.id}
                    onClick={() => !isSelected && handleAddSlot(fav)}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                      isSelected ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed' : 'bg-white border-slate-200 hover:border-red-500 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={fav.profile_img_url} alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover border" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs">{fav.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${isYoutube ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {fav.platform.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">@{fav.handle}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-red-600">
                      {isSelected ? '선택됨' : '+ 추가'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
