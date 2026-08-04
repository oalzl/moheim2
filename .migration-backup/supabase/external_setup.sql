/*
# 외부 Supabase용 테이블 생성 SQL

이 SQL을 외부 Supabase 대시보드의 SQL Editor에서 실행하세요.
(https://romhvtggakhcfexsfplw.supabase.co 의 SQL Editor)

1. New Tables
- `bids`: 나라장터 API에서 수집한 실내건축 공고 데이터
- `favorites`: 즐겨찾기한 공고

2. Security
- 두 테이블 모두 RLS 활성화
- 로그인 없는 단일 사용자 앱이므로 anon + authenticated 권한 부여
- bids: SELECT, INSERT, UPDATE (Edge Function이 데이터 저장/수정)
- favorites: 전체 CRUD (프론트엔드에서 직접 조작)

3. Indexes
- bids: (bid_ntce_no, bid_ntce_ord) 유니크 인덱스, bid_clse_dt/ntce_dt 인덱스
- favorites: bid_ntce_no 유니크 인덱스
*/

CREATE TABLE IF NOT EXISTS bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_ntce_no text NOT NULL,
  bid_ntce_ord text NOT NULL DEFAULT '1',
  bid_ntce_nm text,
  cnstwk_nm text,
  ntce_instt_nm text,
  dminstt_nm text,
  cnstwk_se text,
  cnstwk_type_of_bsns text,
  license_req text,
  region_rstrn text,
  asgn_bdgt_amt numeric,
  presmpt_prce numeric,
  ntce_dt timestamptz,
  bid_clse_dt timestamptz,
  openg_dt timestamptz,
  cnstwk_period text,
  prtcpt_req text,
  relevance_score real DEFAULT 0,
  raw_data jsonb,
  collected_at timestamptz DEFAULT now()
);

ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_bids" ON bids;
CREATE POLICY "anon_select_bids" ON bids FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bids" ON bids;
CREATE POLICY "anon_insert_bids" ON bids FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_bids" ON bids;
CREATE POLICY "anon_update_bids" ON bids FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bids_ntce_no_ord ON bids (bid_ntce_no, bid_ntce_ord);
CREATE INDEX IF NOT EXISTS idx_bids_clse_dt ON bids (bid_clse_dt);
CREATE INDEX IF NOT EXISTS idx_bids_ntce_dt ON bids (ntce_dt);

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_ntce_no text NOT NULL,
  is_favorite boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_favorites" ON favorites;
CREATE POLICY "anon_select_favorites" ON favorites FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_favorites" ON favorites;
CREATE POLICY "anon_insert_favorites" ON favorites FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_favorites" ON favorites;
CREATE POLICY "anon_update_favorites" ON favorites FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_favorites" ON favorites;
CREATE POLICY "anon_delete_favorites" ON favorites FOR DELETE
  TO anon, authenticated USING (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_bid_ntce_no ON favorites (bid_ntce_no);
