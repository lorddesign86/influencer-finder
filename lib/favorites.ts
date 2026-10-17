// lib/favorites.ts
export interface FavoriteItem {
  id: string; // 고유 식별자 (channel_id 또는 blog_id)
  platform: 'youtube' | 'blog';
  name: string;
  handle: string;
  profile_img_url: string;
  tags: string[];
  // 주요 지표 (유튜브: 구독자/롱폼/숏폼, 블로그: 팬수/일방문자/이웃수)
  metric1: number; // 구독자 수 or 팬 수
  metric2: number; // 롱폼 평균 조회수 or 일일 방문자
  metric3: number; // 숏폼 평균 조회수 or 이웃 수
  base_price: number; // 기본 예상 단가
  custom_price?: number | null; // 회원이 직접 설정한 단가
  memo?: string; // 회원 개별 메모
  folder?: string; // 폴더 구분 (기본 폴더 등)
  added_at: string;
}

const STORAGE_KEY = 'findlist_user_favorites_v1';

export const getFavorites = (): Record<string, FavoriteItem> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveFavorites = (map: Record<string, FavoriteItem>) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event('favorites-updated'));
};

export const toggleFavoriteItem = (item: FavoriteItem): boolean => {
  const map = getFavorites();
  const key = `${item.platform}_${item.id}`;
  let isAdded = false;

  if (map[key]) {
    delete map[key];
    isAdded = false;
  } else {
    map[key] = { ...item, folder: item.folder || '기본 폴더', added_at: new Date().toISOString() };
    isAdded = true;
  }
  saveFavorites(map);
  return isAdded;
};

export const addBulkFavorites = (items: FavoriteItem[], folder = '기본 폴더') => {
  const map = getFavorites();
  items.forEach((item) => {
    const key = `${item.platform}_${item.id}`;
    if (!map[key]) {
      map[key] = {
        ...item,
        folder,
        added_at: new Date().toISOString(),
      };
    }
  });
  saveFavorites(map);
};

export const removeBulkFavorites = (keys: string[]) => {
  const map = getFavorites();
  keys.forEach((k) => delete map[k]);
  saveFavorites(map);
};

export const updateFavoriteMeta = (
  key: string,
  updates: { memo?: string; custom_price?: number | null; folder?: string }
) => {
  const map = getFavorites();
  if (!map[key]) return;
  map[key] = {
    ...map[key],
    ...updates,
  };
  saveFavorites(map);
};
