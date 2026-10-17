export interface FavoriteItem {
  id: string;
  platform: 'youtube' | 'blog';
  name: string;
  handle: string;
  profile_img_url: string;
  tags: string[];
  metric1: number;
  metric2: number;
  metric3: number;
  base_price: number;
  custom_memo?: string;
  folder?: string;
  added_at: string;
}

export const getFavorites = (): Record<string, FavoriteItem> => {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem('findlist_favorites');
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};

export const toggleFavoriteItem = (item: FavoriteItem): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const favs = getFavorites();
    const key = `${item.platform}_${item.id}`;
    const isExist = Boolean(favs[key]);

    if (isExist) {
      delete favs[key];
    } else {
      favs[key] = { ...item, folder: item.folder || '기본 폴더' };
    }

    localStorage.setItem('findlist_favorites', JSON.stringify(favs));
    window.dispatchEvent(new Event('favorites-updated'));
    return !isExist;
  } catch (e) {
    return false;
  }
};

export const removeFavoriteItem = (keyOrId: string) => {
  if (typeof window === 'undefined') return;
  try {
    const favs = getFavorites();
    // 키 그대로 삭제 혹은 ID로 검색해서 삭제
    if (favs[keyOrId]) {
      delete favs[keyOrId];
    } else {
      const foundKey = Object.keys(favs).find(k => k === keyOrId || favs[k].id === keyOrId);
      if (foundKey) delete favs[foundKey];
    }
    localStorage.setItem('findlist_favorites', JSON.stringify(favs));
    window.dispatchEvent(new Event('favorites-updated'));
  } catch (e) {
    console.error(e);
  }
};

export const updateFavoriteFolder = (keyOrId: string, folder: string) => {
  if (typeof window === 'undefined') return;
  try {
    const favs = getFavorites();
    let targetKey = favs[keyOrId] ? keyOrId : Object.keys(favs).find(k => k === keyOrId || favs[k].id === keyOrId);
    if (targetKey && favs[targetKey]) {
      favs[targetKey].folder = folder;
      localStorage.setItem('findlist_favorites', JSON.stringify(favs));
      window.dispatchEvent(new Event('favorites-updated'));
    }
  } catch (e) {
    console.error(e);
  }
};
