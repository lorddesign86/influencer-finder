'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getFavorites, removeFavoriteItem, updateCustomPrice, FavoriteItem 
} from '@/lib/favorites';
import { 
  Bookmark, Folder, Download, Plus, Trash2, Edit3, CheckSquare, Square, Check 
} from 'lucide-react';

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'youtube' | 'blog'>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('기본 폴더');
  const [folders, setFolders] = useState<string[]>(['기본 폴더', '관심 캠페인', '섭외 1순위']);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  useEffect(() => {
    const loadFavs = () => {
      const items = Object.values(getFavorites());
      setFavorites(items);
    };
    loadFavs();
    window.addEventListener('favorites-updated', loadFavs);
    return () => window.removeEventListener('favorites-updated', loadFavs);
  }, []);

  const filteredFavorites = favorites.filter(item => {
    if (activeTab === 'youtube' && item.platform !== 'youtube') return false;
    if (activeTab === 'blog' && item.platform !== 'blog') return false;
    return true;
  });

  const totalEstimatedPrice = filteredFavorites.reduce((sum, item) => {
    return sum + (item.custom_price ?? item.base_price ?? 300000);
  }, 0);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRemove = (id: string) => {
    removeFavoriteItem(id);
    setFavorites(Object.values(getFavorites()));
  };

  const handleSavePrice = (id: string) => {
    const num = Number(tempPrice.replace(/[^0-9]/g, ''));
    updateCustomPrice(id, isNaN(num) ? 0 : num);
    setEditingPriceId(null);
    setFavorites(Object.values(getFavorites()));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-y-auto relative pb-24">
      
      {/* 상단 헤더 영역 */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 sticky top-0 z-20 shadow-2xs space-y-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Bookmark className="text-red-500 fill-red-500" size={24} /> 즐겨찾기 관리
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">저장한 인플루언서 목록과 예상 광고비를 한눈에 관리하세요.</p>
          </div>

          <div className="w-full md:w-auto bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl flex items-center justify-between md:justify-end gap-6">
            <span className="text-xs font-bold text-slate-500">현재 리스트 ({filteredFavorites.length}명) 예상 총 광고비</span>
            <span className="text-sm md:text-base font-black text-red-600">{totalEstimatedPrice.toLocaleString()}원</span>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-100">
          {[
            { key: 'all', label: `전체 채널 (${favorites.length})` },
            { key: 'youtube', label: `유튜브 채널 (${favorites.filter(i => i.platform === 'youtube').length})` },
            { key: 'blog', label: `블로그 인플루언서 (${favorites.filter(i => i.platform === 'blog').length})` },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 text-xs font-bold transition whitespace-nowrap border-b-2 cursor-pointer ${
                activeTab === tab.key 
                  ? 'border-red-500 text-red-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full p-4 md:p-8 space-y-4">
        
        {/* 폴더 및 액션 바 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full md:w-44 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {folders.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <button 
              type="button"
              onClick={() => {
                const name = prompt('새로운 폴더 이름을 입력하세요:');
                if (name && !folders.includes(name)) setFolders([...folders, name]);
              }}
              className="flex items-center gap-1 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer"
            >
              <Folder size={14} /> 폴더 관리
            </button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => alert('CSV 다운로드 기능')}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
            >
              <Download size={14} /> 데이터 다운로드 (CSV)
            </button>
            <button
              type="button"
              onClick={() => router.push('/youtube')}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Plus size={14} /> 채널 추가하러 가기
            </button>
          </div>
        </div>

        {/* 즐겨찾기 리스트 (PC에서는 가로 한 줄 행 구조, 모바일에서는 유연하게 대응) */}
        {filteredFavorites.length === 0 ? (
          <div className="p-20 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">
            저장된 즐겨찾기 항목이 없습니다. 탐색 페이지에서 채널을 추가해 보세요!
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
            {filteredFavorites.map((item) => {
              const isChecked = selectedIds.has(item.id);
              const currentPrice = item.custom_price ?? item.base_price ?? 300000;

              return (
                <div 
                  key={item.id}
                  className={`p-4 md:px-6 md:py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition hover:bg-slate-50/80 ${
                    isChecked ? 'bg-red-50/40' : ''
                  }`}
                >
                  {/* 좌측: 체크박스 + 프로필 & 채널명 */}
                  <div className="flex items-center gap-3.5 min-w-0 w-full md:w-1/3">
                    <button
                      type="button"
                      onClick={() => toggleSelect(item.id)}
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition cursor-pointer flex-shrink-0 ${
                        isChecked ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-slate-300 hover:border-red-500'
                      }`}
                    >
                      {isChecked && <Check size={13} strokeWidth={3} />}
                    </button>

                    <img 
                      src={item.profile_img_url} 
                      alt="" 
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full border border-slate-200 object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs md:text-sm font-bold text-slate-900 truncate">{item.name}</h3>
                        <span className={`text-[9px] px-1.5 py-0.5 font-extrabold rounded uppercase ${
                          item.platform === 'youtube' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {item.platform}
                        </span>
                      </div>
                      <p className="text-[10px] md:text-xs text-slate-400 truncate mt-0.5">@{item.handle}</p>
                    </div>
                  </div>

                  {/* 중앙: 구독자 및 조회수 지표 */}
                  <div className="flex items-center gap-6 text-xs text-slate-600 w-full md:w-auto justify-between md:justify-start px-2 md:px-0">
                    <div>
                      <span className="text-[10px] text-slate-400 block">{item.platform === 'youtube' ? '구독자 수' : '팬 수'}</span>
                      <strong className="text-slate-900 font-black">{(item.metric1 || 0).toLocaleString()}명</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">{item.platform === 'youtube' ? '평균 조회수' : '일일 방문자'}</span>
                      <strong className="text-red-500 font-black">{(item.metric2 || 0).toLocaleString()}{item.platform === 'youtube' ? '회' : '명'}</strong>
                    </div>
                  </div>

                  {/* 우측: 예상 광고 단가 및 수정/삭제 버튼 */}
                  <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 block">예상 광고 단가</span>
                      {editingPriceId === item.id ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <input 
                            type="text"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            placeholder={currentPrice.toString()}
                            className="w-24 px-2 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                          <button 
                            type="button"
                            onClick={() => handleSavePrice(item.id)}
                            className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-[11px] font-bold"
                          >
                            저장
                          </button>
                        </div>
                      ) : (
                        <strong className="text-xs md:text-sm font-black text-red-600">{currentPrice.toLocaleString()}원</strong>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {editingPriceId !== item.id && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPriceId(item.id);
                            setTempPrice(currentPrice.toString());
                          }}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs transition cursor-pointer"
                          title="단가 수정"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="p-2 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl text-xs transition cursor-pointer"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
