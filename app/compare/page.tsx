'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFavorites, FavoriteItem } from '@/lib/favorites';
import { 
  BarChart2, Plus, X, ArrowLeft, Bookmark, ExternalLink, Award, TrendingUp, DollarSign, Users, Eye 
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
    // 기본으로 즐겨찾기에서 최대 처음 2개를 미리 비교 슬롯에 담아줌
    if (items.length > 0) {
      setSelectedItems(items.slice(0, 2));
    }
  }, []);

  const handleAddSlot = (item: FavoriteItem) => {
    if (selectedItems.length >= 4) {
      alert('최대 4개 채널까지만 동시에 비교할 수 있습니다.');
      return;
    }
    if (selectedItems.some(i => i._key === item.id || i.id === item.id)) {
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
            즐겨찾기한 채널들 중 최대 4개를 선택하여 핵심 성과 지표와 광고 단가를 정밀 비교하세요.
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
              className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
            >
              <Plus size={14} /> 즐겨찾기 채널에서 추가하기
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((idx) => {
            const item = selectedItems[idx];
            if (item) {
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
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-extrabold bg-red-100 text-red-700">
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
                className="border-2 border-dashed border-slate-200 hover:border-red-400 p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition h-20 bg-slate-50/50"
              >
                <Plus size={18} className="text-slate-400" />
                <span className="text-[11px] font-bold text-slate-500 mt-1">채널 추가하기</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 비교 분석 테이블 */}
      {selectedItems.length > 0 ? (
        <div className="max-w-6xl mx-auto w-full bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <BarChart2 size={18} className="text-red-600" />
            <h3 className="text-sm font-black text-slate-900">핵심 성과 지표 크로스 비교</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500">
                  <th className="py-4 px-6 w-40">비교 항목</th>
                  {selectedItems.map((item, i) => (
                    <th key={i} className="py-4 px-6 text-center min-w-[200px]">
                      <div className="flex flex-col items-center gap-1">
                        <img src={item.profile_img_url} alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        <span className="text-xs font-black text-slate-900 truncate max-w-[180px]">{item.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {/* 플랫폼 */}
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-500 bg-slate-50/30 flex items-center gap-1.5"><Award size={14} /> 플랫폼</td>
                  {selectedItems.map((item, i) => (
                    <td key={i} className="py-4 px-6 text-center font-bold text-slate-800">
                      <span className={`px-2 py-1 rounded text-[10px] font-black ${item.platform === 'youtube' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {item.platform.toUpperCase()}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* 구독자 / 팬 수 */}
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-500 bg-slate-50/30 flex items-center gap-1.5"><Users size={14} /> 구독자 / 팬 수</td>
                  {selectedItems.map((item, i) => (
                    <td key={i} className="py-4 px-6 text-center font-black text-slate-900 text-sm">
                      {item.metric1 > 0 ? `${item.metric1.toLocaleString()}명` : '집계중'}
                    </td>
                  ))}
                </tr>

                {/* 조회수 (롱폼) / 방문자 */}
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-500 bg-slate-50/30 flex items-center gap-1.5"><Eye size={14} /> 롱폼 평균 / 일방문자</td>
                  {selectedItems.map((item, i) => (
                    <td key={i} className="py-4 px-6 text-center font-bold text-red-600">
                      {item.metric2 > 0 ? `${item.metric2.toLocaleString()}회` : '0회'}
                    </td>
                  ))}
                </tr>

                {/* 조회수 (숏폼) / 이웃수 */}
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-500 bg-slate-50/30 flex items-center gap-1.5"><TrendingUp size={14} /> Shorts 평균 / 이웃수</td>
                  {selectedItems.map((item, i) => (
                    <td key={i} className="py-4 px-6 text-center font-bold text-slate-800">
                      {item.metric3 > 0 ? `${item.metric3.toLocaleString()}회` : '0회'}
                    </td>
                  ))}
                </tr>

                {/* 광고 단가 */}
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-500 bg-slate-50/30 flex items-center gap-1.5"><DollarSign size={14} /> 광고 단가 (설정가)</td>
                  {selectedItems.map((item, i) => {
                    const price = item.custom_price ?? item.base_price ?? 0;
                    return (
                      <td key={i} className="py-4 px-6 text-center font-black text-rose-600">
                        {price > 0 ? `${price.toLocaleString()}원` : '단가 미설정'}
                      </td>
                    );
                  })}
                </tr>

                {/* 채널 바로가기 */}
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-500 bg-slate-50/30">채널 방문</td>
                  {selectedItems.map((item, i) => (
                    <td key={i} className="py-4 px-6 text-center">
                      <button
                        type="button"
                        onClick={() => router.push(item.platform === 'youtube' ? `/youtube/${item.id}` : `/?search=${item.name}`)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer inline-flex items-center gap-1"
                      >
                        상세 리포트 <ExternalLink size={11} />
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
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-red-100 text-red-700">{fav.platform.toUpperCase()}</span>
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
