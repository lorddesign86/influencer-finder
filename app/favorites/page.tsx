'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getFavorites, removeBulkFavorites, updateFavoriteMeta, FavoriteItem 
} from '@/lib/favorites';
import { 
  Trash2, FileText, Download, Plus, Check, Edit3, Folder, ExternalLink 
} from 'lucide-react';

// 숫자를 '19만', '124만'처럼 간결하게 표기하는 헬퍼
const formatCompactNumber = (num: number): string => {
  if (!num || num <= 0) return '0';
  if (num >= 10000) {
    const man = num / 10000;
    return `${man % 1 === 0 ? man.toFixed(0) : man.toFixed(1)}만`;
  }
  return num.toLocaleString();
};

export default function FavoritesPage() {
  const router = useRouter();
  const [favoritesMap, setFavoritesMap] = useState<Record<string, FavoriteItem>>({});
  const [platformTab, setPlatformTab] = useState<'all' | 'youtube' | 'blog'>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('기본 폴더');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // 인라인 편집 상태 (메모 & 회원별 커스텀 단가)
  const [editingMemoKey, setEditingMemoKey] = useState<string | null>(null);
  const [memoDraft, setMemoDraft] = useState<string>('');
  const [editingPriceKey, setEditingPriceKey] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState<string>('');

  useEffect(() => {
    const load = () => setFavoritesMap(getFavorites());
    load();
    window.addEventListener('favorites-updated', load);
    return () => window.removeEventListener('favorites-updated', load);
  }, []);

  const allItems = useMemo(() => {
    return Object.entries(favoritesMap).map(([key, item]) => ({
      ...item,
      _key: key,
    }));
  }, [favoritesMap]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (platformTab !== 'all' && item.platform !== platformTab) return false;
      if (selectedFolder !== '전체 폴더' && (item.folder || '기본 폴더') !== selectedFolder) return false;
      return true;
    });
  }, [allItems, platformTab, selectedFolder]);

  // 체크박스 제어
  const toggleSelectRow = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (filteredItems.length > 0 && filteredItems.every((i) => selectedKeys.has(i._key))) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(filteredItems.map((i) => i._key)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedKeys.size === 0) return;
    if (!confirm(`선택한 ${selectedKeys.size}개의 채널을 즐겨찾기에서 삭제하시겠습니까?`)) return;
    removeBulkFavorites(Array.from(selectedKeys));
    setSelectedKeys(new Set());
  };

  // 메모 저장
  const startEditMemo = (key: string, currentMemo?: string) => {
    setEditingMemoKey(key);
    setMemoDraft(currentMemo || '');
  };

  const saveMemo = (key: string) => {
    updateFavoriteMeta(key, { memo: memoDraft.trim() });
    setEditingMemoKey(null);
  };

  // 회원별 커스텀 단가 저장
  const startEditPrice = (key: string, currentCustom?: number | null, basePrice?: number) => {
    setEditingPriceKey(key);
    setPriceDraft(String(currentCustom ?? basePrice ?? 0));
  };

  const savePrice = (key: string) => {
    const cleanNum = Number(String(priceDraft).replace(/[^0-9]/g, ''));
    updateFavoriteMeta(key, { custom_price: isNaN(cleanNum) ? 0 : cleanNum });
    setEditingPriceKey(null);
  };

  // 엑셀(CSV) 다운로드
  const handleDownloadCSV = () => {
    const targetList = selectedKeys.size > 0 
      ? filteredItems.filter(i => selectedKeys.has(i._key))
      : filteredItems;

    if (targetList.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    const headers = ['플랫폼', '채널명', '핸들/ID', '구독자/팬수', '롱폼조회수/일방문자', '숏폼조회수/이웃수', '회원설정단가(원)', '메모'];
    const rows = targetList.map(i => [
      i.platform.toUpperCase(),
      `"${(i.name || '').replace(/"/g, '""')}"`,
      i.handle,
      i.metric1,
      i.metric2,
      i.metric3,
      i.custom_price ?? i.base_price ?? 0,
      `"${(i.memo || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `findlist_favorites_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 선택된 채널들의 총 예산 합산
  const totalSelectedBudget = useMemo(() => {
    const list = selectedKeys.size > 0
      ? filteredItems.filter(i => selectedKeys.has(i._key))
      : filteredItems;
    return list.reduce((acc, cur) => acc + Number(cur.custom_price ?? cur.base_price ?? 0), 0);
  }, [filteredItems, selectedKeys]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* 상단 타이틀 및 플랫폼별 탭 */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900">즐겨찾기</h1>
            <div className="flex items-center gap-6 text-sm font-bold">
              <button
                type="button"
                onClick={() => setPlatformTab('all')}
                className={`pb-2 border-b-2 transition cursor-pointer ${
                  platformTab === 'all' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                전체 채널 ({allItems.length})
              </button>
              <button
                type="button"
                onClick={() => setPlatformTab('youtube')}
                className={`pb-2 border-b-2 transition cursor-pointer ${
                  platformTab === 'youtube' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                유튜브 채널 ({allItems.filter(i => i.platform === 'youtube').length})
              </button>
              <button
                type="button"
                onClick={() => setPlatformTab('blog')}
                className={`pb-2 border-b-2 transition cursor-pointer ${
                  platformTab === 'blog' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                블로그 인플루언서 ({allItems.filter(i => i.platform === 'blog').length})
              </button>
            </div>
          </div>

          {/* 우측 예산 요약 카드 */}
          <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-2xs text-right">
            <span className="text-[11px] font-bold text-slate-400 block">
              {selectedKeys.size > 0 ? `선택된 ${selectedKeys.size}개 채널 예상 총 광고비` : `현재 리스트(${filteredItems.length}개) 예상 총 광고비`}
            </span>
            <span className="text-lg font-black text-rose-600">
              {totalSelectedBudget.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 폴더 선택 및 컨트롤 헤더 (vling 스타일) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700">
                <Folder size={14} className="text-red-500" />
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="기본 폴더">기본 폴더</option>
                  <option value="1순위 섭외 후보">1순위 섭외 후보</option>
                  <option value="견적 협의중">견적 협의중</option>
                  <option value="전체 폴더">전체 폴더 보기</option>
                </select>
              </div>

              {selectedKeys.size > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Trash2 size={13} /> 선택 삭제 ({selectedKeys.size})
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Download size={14} /> 데이터 다운로드 (CSV)
              </button>
              <button
                type="button"
                onClick={() => router.push('/youtube')}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Plus size={14} /> 채널 추가하러 가기
              </button>
            </div>
          </div>

          {/* 심플 한눈에 보기 테이블 (최신글 썸네일 제외) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500">
                  <th className="py-3.5 px-5 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={filteredItems.length > 0 && filteredItems.every((i) => selectedKeys.has(i._key))}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4 min-w-[260px]">채널명</th>
                  <th className="py-3.5 px-4 w-32">구독자 / 팬 수 ↕</th>
                  <th className="py-3.5 px-4 w-36">롱폼 평균 / 일방문자 ↕</th>
                  <th className="py-3.5 px-4 w-36">Shorts 평균 / 이웃수 ↕</th>
                  <th className="py-3.5 px-4 w-44">회원 설정 단가 (클릭 수정)</th>
                  <th className="py-3.5 px-5 min-w-[240px]">메모</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-slate-400">
                      즐겨찾기에 추가된 채널이 없습니다. 유튜버 찾기 또는 블로거 찾기에서 체크박스를 선택해 추가해 보세요!
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isChecked = selectedKeys.has(item._key);
                    const effectivePrice = item.custom_price ?? item.base_price ?? 0;

                    return (
                      <tr
                        key={item._key}
                        className={`hover:bg-slate-50/80 transition ${isChecked ? 'bg-red-50/30' : ''}`}
                      >
                        {/* 체크박스 */}
                        <td className="py-4 px-5 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectRow(item._key)}
                            className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                          />
                        </td>

                        {/* 채널 프로필 + 이름 + 태그 */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.profile_img_url}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              className="w-11 h-11 rounded-full object-cover border border-slate-200 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  onClick={() => router.push(item.platform === 'youtube' ? `/youtube/${item.id}` : `/?search=${item.name}`)}
                                  className="font-bold text-slate-900 hover:text-red-600 cursor-pointer truncate text-sm flex items-center gap-1"
                                >
                                  {item.name}
                                  <ExternalLink size={11} className="text-slate-400" />
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${
                                    item.platform === 'youtube'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  {item.platform === 'youtube' ? 'YT' : 'BLOG'}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(item.tags || []).slice(0, 3).map((t, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 지표 1: 구독자 수 */}
                        <td className="py-4 px-4 font-bold text-slate-800">
                          {formatCompactNumber(item.metric1)}
                        </td>

                        {/* 지표 2: 롱폼 조회수 / 일방문자 */}
                        <td className="py-4 px-4 font-bold text-slate-800">
                          {formatCompactNumber(item.metric2)}
                        </td>

                        {/* 지표 3: 숏폼 조회수 / 이웃수 */}
                        <td className="py-4 px-4 font-bold text-slate-800">
                          {formatCompactNumber(item.metric3)}
                        </td>

                        {/* 회원별 커스텀 단가 설정 */}
                        <td className="py-4 px-4">
                          {editingPriceKey === item._key ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={priceDraft}
                                onChange={(e) => setPriceDraft(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && savePrice(item._key)}
                                placeholder="단가 입력(원)"
                                autoFocus
                                className="w-28 px-2.5 py-1.5 border border-red-400 rounded-lg text-xs font-bold focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => savePrice(item._key)}
                                className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
                              >
                                <Check size={13} />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => startEditPrice(item._key, item.custom_price, item.base_price)}
                              className="group flex items-center gap-1.5 cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-slate-100 transition"
                              title="클릭하여 회원 전용 커스텀 단가 수정"
                            >
                              <span className={`font-black ${item.custom_price != null ? 'text-rose-600' : 'text-slate-700'}`}>
                                {effectivePrice > 0 ? `${effectivePrice.toLocaleString()}원` : '단가 미설정'}
                              </span>
                              <Edit3 size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                              {item.custom_price != null && (
                                <span className="text-[9px] bg-rose-50 text-rose-600 border border-rose-200 px-1 rounded">
                                  지정가
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 메모 추가 및 인라인 수정 (vling 스타일 버튼) */}
                        <td className="py-4 px-5">
                          {editingMemoKey === item._key ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={memoDraft}
                                onChange={(e) => setMemoDraft(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && saveMemo(item._key)}
                                placeholder="섭외 현황, 담당자 연락처 등 메모..."
                                autoFocus
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                              />
                              <button
                                type="button"
                                onClick={() => saveMemo(item._key)}
                                className="px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 cursor-pointer"
                              >
                                저장
                              </button>
                            </div>
                          ) : item.memo ? (
                            <div
                              onClick={() => startEditMemo(item._key, item.memo)}
                              className="w-full px-3.5 py-2.5 bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/80 rounded-xl text-xs text-slate-800 cursor-pointer flex items-center justify-between gap-2 transition"
                            >
                              <span className="truncate font-medium">{item.memo}</span>
                              <Edit3 size={12} className="text-amber-600 flex-shrink-0" />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEditMemo(item._key, '')}
                              className="w-full py-2.5 px-4 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                              <FileText size={13} className="text-slate-400" /> 메모 추가
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
