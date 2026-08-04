export type BidStatus = '진행중' | '마감임박' | '마감' | '입찰대기';

export interface Bid {
  id: string;
  bid_ntce_no: string;
  bid_ntce_ord: string;
  bid_ntce_nm: string | null;
  cnstwk_nm: string | null;
  ntce_instt_nm: string | null;
  dminstt_nm: string | null;
  cnstwk_se: string | null;
  cnstwk_type_of_bsns: string | null;
  license_req: string | null;
  region_rstrn: string | null;
  asgn_bdgt_amt: number | null;
  presmpt_prce: number | null;
  ntce_dt: string | null;
  bid_clse_dt: string | null;
  openg_dt: string | null;
  cnstwk_period: string | null;
  prtcpt_req: string | null;
  relevance_score: number;
  raw_data: Record<string, unknown> | null;
  collected_at: string;
}

export interface FavoriteBid {
  id: string;
  bid_ntce_no: string;
  is_favorite: boolean;
  created_at: string;
}

export type SortKey = '마감순' | '금액높은순' | '금액낮은순' | '최신순';

export interface BidFilters {
  search: string;
  region: string;
  minAmount: string;
  maxAmount: string;
  agency: string;
  endDate: string;
  sort: SortKey;
}

export type ApiHealthStatus = 'ok' | 'checking' | 'no_key' | 'error' | 'unknown';
