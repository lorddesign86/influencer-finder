'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getFavorites, removeFavoriteItem, updateFavoriteFolder, FavoriteItem 
} from '@/lib/favorites';
import { 
  Bookmark, Folder, Download, Plus, Trash2, Edit3, Check, X, MessageSquare 
} from 'lucide-react';

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'youtube' | 'blog'>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('전체보기');
  const [folders, setFolders] = useState<string[]>(['기본 폴더', '관심 캠페인', '섭외 1순위']);
  
  // 폴더 관리 모달 상태
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // 메모 남기기 편집 상태
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [tempMemo, setTempMemo] = useState<string>('');

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
    if (selectedFolder !== '전체보기' && (item.folder || '기본 폴더') !== selectedFolder) return false;
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
    if (confirm('이 채널을 즐겨찾기에서 삭제하시겠습니까?')) {
      removeFavoriteItem(id);
      setFavorites(Object.values(getFavorites()));
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
    }
  };

  // 메모 저장 함수 (custom_price 필드를 메모 저장 용도로 활용하거나 별도 관리)
  const handleSaveMemo = (id: string) => {
    const favs = getFavorites();
    if (favs[id]) {
      favs[id].custom_memo = tempMemo; // 메모 저장
      localStorage.setItem('findlist_favorites', JSON.stringify(favs));
      window.dispatchEvent(new Event('favorites-updated'));
    }
    setEditingMemoId(null);
    setFavorites(Object.values(getFavorites()));
  };

  // 선택한 채널들 일괄 폴더 이동 (상태 즉시 반영)
  const handleBulkMoveFolder = (targetFolder: string) => {
    if (selectedIds.size === 0) return;
    
    selectedIds.forEach(id => {
      updateFavoriteFolder(id, targetFolder);
    });

    setFavorites(Object.values(getFavorites()));
    setSelectedIds(new Set());
    alert(`선택한 ${selectedIds.size}개의 채널이 '${targetFolder}'(으)로 이동되었습니다.`);
  };

  // 새 폴더 추가
  const handleAddFolder = () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    if (folders.includes(trimmed)) {
      alert('이미 존재하는 폴더 이름입니다.');
      return;
    }
    setFolders([...folders, trimmed]);
    setNewFolderName('');
  };

  // 폴더 삭제
  const handleDeleteFolder = (folderToDelete: string) => {
    if (folders.length <= 1) {
      alert('최소 1개의 폴더는 남아있어야 합니다.');
      return;
    }
    if (confirm(`'${folderToDelete}' 폴더를 삭제하시겠습니까? 해당 폴더에 있던 채널들은 '기본 폴더'로 이동됩니다.`)) {
      const allFavs = getFavorites();
      Object.values(allFavs).forEach(item => {
        if ((item.folder || '기본 폴더') === folderToDelete) {
          updateFavoriteFolder(item.id, '기본 폴더');
        }
      });

      setFolders(folders.filter(f => f !== folderToDelete));
      if (selectedFolder === folderToDelete) {
        setSelectedFolder('전체보기');
      }
      setFavorites(Object.values(getFavorites()));
    }
  };

  const goToDetail = (item: FavoriteItem) => {
    if (item.platform === 'youtube') {
      router.push(`/youtube/${item.id}`);
    } else {
      router.push(`/blog/${item.id}`);
    }
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
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full md:w-44 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              <option value="전체보기">📁 전체보기 (모든 폴더)</option>
              {folders.map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            <button 
              type="button"
              onClick={() => setIsFolderModalOpen(true)}
              className="flex items-center gap-1 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer"
            >
              <Folder size={14} /> 폴더 관리
            </button>

            {/* 채널 선택 시에만 나타나는 일괄 이동 버튼 */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl flex-wrap">
                <span className="text-xs font-bold text-red-600">{selectedIds.size}개 선택됨:</span>
                <div className="flex items-center gap-1">
                  {folders.map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => handleBulkMoveFolder(f)}
                      className="px-2.5 py-1 bg-white hover:bg-red-600 hover:text-white border border-red-300 rounded-lg text-xs font-bold text-red-600 transition shadow-2xs cursor-pointer"
                    >
                      {f}로 이동
                    </button>
                  ))}
                </div>
              </div>
            )}
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

        {/* 즐겨찾기 리스트 */}
        {filteredFavorites.length === 0 ? (
          <div className="p-20 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">
            저장된 즐겨찾기 항목이 없습니다. 탐색 페이지에서 채널을 추가해 보세요!
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto w-full">
              <div className="min-w-[800px] divide-y divide-slate-100">
                {filteredFavorites.map((item: any) => {
                  const isChecked = selectedIds.has(item.id);
                  const currentMemo = item.custom_memo || '';
                  const isYoutube = item.platform === 'youtube';

                  return (
                    <div 
                      key={item.id}
                      className={`flex items-center justify-between px-4 py-3 transition hover:bg-slate-50/80 ${
                        isChecked ? 'bg-red-50/40' : ''
                      }`}
                    >
                      {/* 1. 왼쪽 고정 영역: 체크박스 + 프로필 & 채널명 */}
                      <div className="flex items-center gap-3 min-w-[260px] max-w-[260px] flex-shrink-0 bg-white sticky left-0 z-10 pr-2">
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
                          onClick={() => goToDetail(item)}
                          className="w-10 h-10 rounded-full border border-slate-200 object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                          title="상세 페이지로 이동"
                        />
                        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => goToDetail(item)}>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-xs md:text-sm font-bold text-slate-900 truncate hover:text-red-500 transition">{item.name}</h3>
                            <span className={`text-[9px] px-1.5 py-0.5 font-extrabold rounded uppercase ${
                              isYoutube ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                              {item.platform}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">@{item.handle}</p>
                        </div>
                      </div>

                      {/* 2. 오른쪽 스크롤 영역: 플랫폼별 맞춤 지표 및 메모 & 삭제 버튼 */}
                      <div className="flex items-center gap-8 text-xs text-slate-600 flex-1 justify-end pl-4">
                        
                        {/* 플랫폼별 지표 */}
                        {isYoutube ? (
                          <>
                            <div className="text-right w-24 flex-shrink-0">
                              <span className="text-[10px] text-slate-400 block">구독자 수</span>
                              <strong className="text-slate-900 font-black">{(item.metric1 || 0).toLocaleString()}명</strong>
                            </div>
                            <div className="text-right w-28 flex-shrink-0">
                              <span className="text-[10px] text-slate-400 block">평균 조회수(롱폼)</span>
                              <strong className="text-red-500 font-black">{(item.metric2 || 0).toLocaleString()}회</strong>
                            </div>
                            <div className="text-right w-28 flex-shrink-0">
                              <span className="text-[10px] text-slate-400 block">평균 조회수(숏츠)</span>
                              <strong className="text-slate-800 font-black">{(item.metric3 || 0).toLocaleString()}회</strong>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-right w-24 flex-shrink-0">
                              <span className="text-[10px] text-slate-400 block">팬 수</span>
                              <strong className="text-slate-900 font-black">{(item.metric1 || 0).toLocaleString()}명</strong>
                            </div>
                            <div className="text-right w-24 flex-shrink-0">
                              <span className="text-[10px] text-slate-400 block">이웃 수</span>
                              <strong className="text-slate-900 font-black">{(item.metric3 || 0).toLocaleString()}명</strong>
                            </div>
                            <div className="text-right w-28 flex-shrink-0">
                              <span className="text-[10px] text-slate-400 block">일방문자수</span>
                              <strong className="text-emerald-600 font-black">{(item.metric2 || 0).toLocaleString()}명</strong>
                            </div>
                          </>
                        )}

                        {/* 메모장 및 삭제 버튼 */}
                        <div className="flex items-center gap-3 flex-shrink-0 border-l border-slate-100 pl-6">
                          <div className="text-left w-36">
                            <span className="text-[10px] text-slate-400 block mb-0.5">채널 메모</span>
                            {editingMemoId === item.id ? (
                              <div className="flex items-center gap-1">
                                <input 
                                  type="text"
                                  value={tempMemo}
                                  onChange={(e) => setTempMemo(e.target.value)}
                                  placeholder="메모 입력..."
                                  className="w-24 px-2 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                                />
                                <button 
                                  type="button"
                                  onClick={() => handleSaveMemo(item.id)}
                                  className="px-2 py-1 bg-red-500 text-white rounded-lg text-[10px] font-bold"
                                >
                                  저장
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs text-slate-700 truncate max-w-[90px]" title={currentMemo}>
                                  {currentMemo || <span className="text-slate-300">메모 없음</span>}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMemoId(item.id);
                                    setTempMemo(currentMemo);
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                  title="메모 편집"
                                >
                                  <Edit3 size={13} />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* 휴지통 삭제 버튼 (즐겨찾기에서 제거) */}
                          <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            className="p-2 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl text-xs transition cursor-pointer"
                            title="즐겨찾기 삭제"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 폴더 관리 모달 */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Folder size={18} className="text-red-500" /> 폴더 관리
              </h3>
              <button 
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 block">새 폴더 추가</label>
              <div className="flex items-center gap-2">
                <input 
                  type="text"
                  placeholder="폴더 이름 입력..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={handleAddFolder}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl transition cursor-pointer whitespace-nowrap"
                >
                  추가
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 block">보유 중인 폴더 목록</label>
              <div className="max-h-48 overflow-y-auto space-y-2 divide-y divide-slate-50">
                {folders.map(f => (
                  <div key={f} className="flex items-center justify-between pt-2 first:pt-0">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Folder size={14} className="text-slate-400" /> {f}
                    </span>
                    {folders.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteFolder(f)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 text-[11px] font-bold rounded-lg transition cursor-pointer"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
