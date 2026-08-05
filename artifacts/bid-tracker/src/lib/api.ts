import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ApiHealthStatus, Bid, FavoriteBid } from '@/types';

// ── Supabase (즐겨찾기 전용) ─────────────────────────────────────────
// 환경변수가 없으면 즐겨찾기 기능만 비활성화되고 앱은 정상 동작합니다.
let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase 환경변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)가 설정되지 않았습니다.');
  _supabase = createClient(url, key);
  return _supabase;
}

// ── 입찰 공고 API (로컬 Express 서버 경유) ──────────────────────────
// VITE_API_BASE_URL: Vercel 배포 시 API 서버의 도메인을 설정 (예: https://api.example.com)
// 로컬/Replit 개발 시에는 빈 문자열로 두어 상대 경로 /api/bids 를 사용합니다.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const BIDS_API = `${API_BASE}/api/bids`;

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

// ── 즐겨찾기 API (Supabase 직접 사용) ────────────────────────────────

export async function fetchFavorites(): Promise<FavoriteBid[]> {
  const { data, error } = await getSupabase()
    .from('favorites')
    .select('*')
    .eq('is_favorite', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as FavoriteBid[];
}

export async function addFavorite(bidNtceNo: string): Promise<void> {
  const { error } = await getSupabase()
    .from('favorites')
    .upsert({ bid_ntce_no: bidNtceNo, is_favorite: true }, { onConflict: 'bid_ntce_no' });
  if (error) throw new Error(error.message);
}

export async function removeFavorite(bidNtceNo: string): Promise<void> {
  const { error } = await getSupabase()
    .from('favorites')
    .delete()
    .eq('bid_ntce_no', bidNtceNo);
  if (error) throw new Error(error.message);
}

export async function fetchFavoriteBidNos(): Promise<Set<string>> {
  const favs = await fetchFavorites();
  return new Set(favs.map((f) => f.bid_ntce_no));
}
