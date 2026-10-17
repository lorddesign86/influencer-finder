// lib/favorites.ts
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
  custom_price?: number | null;
  memo?: string;
  folder?: string;
  added_at: string;
}

const STORAGE_KEY = 'findlist_user_favorites_v1';
const FOLDERS_KEY = 'findlist_user_folders_v1';

export const DEFAULT_FOLDER = '기본 폴더';

// 폴더 목록 가져오기
export const getFolders = (): string[] => {
  if (typeof window === 'undefined') return [DEFAULT_FOLDER];
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    return raw ? JSON.parse(raw) : [DEFAULT_FOLDER];
  } catch {
    return [DEFAULT_FOLDER];
  }
};

export const saveFolders = (folders: string[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  window.dispatchEvent(new Event('favorites-updated'));
};

export const addFolder = (folderName: string): boolean => {
  const trimmed = folderName.trim();
  if (!trimmed) return false;
  const folders = getFolders();
  if (folders.includes(trimmed)) return false;
  folders.push(trimmed);
  saveFolders(folders);
  return true;
};

export const deleteFolder = (folderName: string) => {
  if (folderName === DEFAULT_FOLDER) return;
  const folders = getFolders().filter(f => f !== folderName);
  saveFolders(folders);

  // 해당 폴더에 있던 아이템들은 기본 폴더로 이동
  const favs = getFavorites();
  let changed = false;
  Object.values(favs).forEach(item => {
    if (item.folder === folderName) {
      item.folder = DEFAULT_FOLDER;
      changed = true;
    }
  });
  if (changed) saveFavorites(favs);
};

export const renameFolder = (oldName: string, newName: string): boolean => {
  const trimmed = newName.trim();
  if (!trimmed || oldName === DEFAULT_FOLDER) return false;
  const folders = getFolders();
  if (folders.includes(trimmed)) return false;

  const updatedFolders = folders.map(f => (f === oldName ? trimmed : f));
  saveFolders(updatedFolders);

  const favs = getFavorites();
  let changed = false;
  Object.values(favs).forEach(item => {
    if (item.folder === oldName) {
      item.folder = trimmed;
      changed = true;
    }
  });
  if (changed) saveFavorites(favs);
  return true;
};

// 즐겨찾기 데이터 제어
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

export const toggleFavoriteItem = (item: FavoriteItem, currentFolder = DEFAULT_FOLDER): boolean => {
  const map = getFavorites();
  const key = `${item.platform}_${item.id}`;
  let isAdded = false;

  if (map[key]) {
    delete map[key];
    isAdded = false;
  } else {
    map[key] = { ...item, folder: item.folder || currentFolder, added_at: new Date().toISOString() };
    isAdded = true;
  }
  saveFavorites(map);
  return isAdded;
};

export const addBulkFavorites = (items: FavoriteItem[], folder = DEFAULT_FOLDER) => {
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
