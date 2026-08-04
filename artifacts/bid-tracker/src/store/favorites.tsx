import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { fetchFavoriteBidNos, addFavorite, removeFavorite } from '@/lib/api';

interface FavoritesContextValue {
  favorites: Set<string>;
  toggleFavorite: (bidNtceNo: string) => Promise<void>;
  isFavorite: (bidNtceNo: string) => boolean;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const favSet = await fetchFavoriteBidNos();
        if (mounted) setFavorites(favSet);
      } catch (err) {
        console.error('Failed to load favorites:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toggleFavorite = useCallback(async (bidNtceNo: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(bidNtceNo)) {
        next.delete(bidNtceNo);
      } else {
        next.add(bidNtceNo);
      }
      return next;
    });

    try {
      if (favorites.has(bidNtceNo)) {
        await removeFavorite(bidNtceNo);
      } else {
        await addFavorite(bidNtceNo);
      }
    } catch (err) {
      // Revert on error
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(bidNtceNo)) next.delete(bidNtceNo);
        else next.add(bidNtceNo);
        return next;
      });
      console.error('Failed to toggle favorite:', err);
    }
  }, [favorites]);

  const isFavorite = useCallback((bidNtceNo: string) => favorites.has(bidNtceNo), [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
