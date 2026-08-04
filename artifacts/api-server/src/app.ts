import { createClient } from '@supabase/supabase-js';
import type { ApiHealthStatus, Bid, FavoriteBid } from '@/types';

// Supabase: 관심공고(favorites) 저장용
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 나라장터 공고 조회: CORS 우회를 위해 로컬 Express API 경유
const BIDS_API = '/api/bids';

// ── 나라장터 공고 API (Express 서버 경유) ────────────────────────────

export async function fetchHealth(): Promise<{ status: ApiHealthStatus; message: string }> {
  try {
    const resp = await fetch(`${BIDS_API}/health`);
    if (!resp.ok) return { status: 'error', message: `서버 오류 (${resp.status})` };
    const data = await resp.json();
    return { status: data.status as ApiHealthStatus, message: data.message ?? '' };
  } catch {
    return { status: 'error', message: '서버에 연결할 수 없습니다.' };
  }
}

export async function collectBids(): Promise<{ collected: number; stored: number; relevant: number }> {
  const resp = await fetch(`${BIDS_API}/collect`, { method: 'POST' });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error ?? '데이터 수집에 실패했습니다.');
  }
  return resp.json();
}

export async function fetchBids(params?: {
  search?: string;
  region?: string;
  agency?: string;
  minAmount?: string;
  maxAmount?: string;
  limit?: number;
}): Promise<Bid[]> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.region) qs.set('region', params.region);
  if (params?.agency) qs.set('agency', params.agency);
  if (params?.minAmount) qs.set('minAmount', params.minAmount);
  if (params?.maxAmount) qs.set('maxAmount', params.maxAmount);
  if (params?.limit) qs.set('limit', String(params.limit));

  const url = `${BIDS_API}${qs.toString() ? `?${qs.toString()}` : ''}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error ?? '공고 조회에 실패했습니다.');
  }
  const data = await resp.json();
  return data.bids as Bid[];
}

export async function fetchBidDetail(bidNtceNo: string, bidNtceOrd: string): Promise<Bid | null> {
  const resp = await fetch(
    `${BIDS_API}/${encodeURIComponent(bidNtceNo)}/${encodeURIComponent(bidNtceOrd)}`,
  );
  if (!resp.ok) {
    if (resp.status === 404) return null;
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error ?? '공고 조회에 실패했습니다.');
  }
  const data = await resp.json();
  return data.bid as Bid;
}

// ── 관심공고 API (Supabase 직접 사용) ────────────────────────────────

export async function fetchFavorites(): Promise<FavoriteBid[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('is_favorite', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as FavoriteBid[];
}

export async function addFavorite(bidNtceNo: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .upsert({ bid_ntce_no: bidNtceNo, is_favorite: true }, { onConflict: 'bid_ntce_no' });
  if (error) throw new Error(error.message);
}

export async function removeFavorite(bidNtceNo: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('bid_ntce_no', bidNtceNo);
  if (error) throw new Error(error.message);
}

export async function fetchFavoriteBidNos(): Promise<Set<string>> {
  const favs = await fetchFavorites();
  return new Set(favs.map((f) => f.bid_ntce_no));
}
