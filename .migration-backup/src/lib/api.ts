import { createClient } from '@supabase/supabase-js';
import type { ApiHealthStatus, Bid, FavoriteBid } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const functionUrl = `${supabaseUrl}/functions/v1/bids-api`;

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchHealth(): Promise<{ status: ApiHealthStatus; message: string }> {
  try {
    const resp = await fetch(`${functionUrl}/health`, { headers: authHeaders() });
    if (!resp.ok) return { status: 'error', message: `서버 오류 (${resp.status})` };
    const data = await resp.json();
    return { status: data.status as ApiHealthStatus, message: data.message ?? '' };
  } catch {
    return { status: 'error', message: '서버에 연결할 수 없습니다.' };
  }
}

export async function collectBids(): Promise<{ collected: number; stored: number; relevant: number }> {
  const resp = await fetch(`${functionUrl}/collect`, { headers: authHeaders() });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error ?? '데이터 수집에 실패했습니다.');
  }
  return resp.json();
}

export async function fetchBids(): Promise<Bid[]> {
  const resp = await fetch(`${functionUrl}/bids`, { headers: authHeaders() });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error ?? '공고 조회에 실패했습니다.');
  }
  const data = await resp.json();
  return data.bids as Bid[];
}

export async function fetchBidDetail(bidNtceNo: string, bidNtceOrd: string): Promise<Bid | null> {
  const resp = await fetch(
    `${functionUrl}/bids/${encodeURIComponent(bidNtceNo)}/${encodeURIComponent(bidNtceOrd)}`,
    { headers: authHeaders() },
  );
  if (!resp.ok) {
    if (resp.status === 404) return null;
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error ?? '공고 조회에 실패했습니다.');
  }
  const data = await resp.json();
  return data.bid as Bid;
}

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
