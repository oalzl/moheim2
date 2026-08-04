/*
# Create bids and favorites tables for BidScope

1. New Tables
- `bids`: stores interior-construction bid notices collected from 나라장터 API
  - `bid_ntce_no` (text): 공고번호 (bid notice number)
  - `bid_ntce_ord` (text): 공고차수 (bid notice order)
  - `bid_ntce_nm` (text): 공고명 (bid notice name)
  - `cnstwk_nm` (text): 공사명 (construction name)
  - `ntce_instt_nm` (text): 공고기관명 (notice institution name)
  - `dminstt_nm` (text): 수요기관명 (demand institution name)
  - `cnstwk_se` (text): 공사구분 (construction classification)
  - `cnstwk_type_of_bsns` (text): 공사업종 (construction business type)
  - `license_req` (text): 면허요건 (license requirements)
  - `region_rstrn` (text): 지역제한 (region restriction)
  - `asgn_bdgt_amt` (numeric): 예산금액 (assigned budget amount)
  - `presmpt_prce` (numeric): 추정가격 (presumed price)
  - `ntce_dt` (timestamptz): 공고일시 (notice date)
  - `bid_clse_dt` (timestamptz): 입찰마감일시 (bid close date)
  - `openg_dt` (timestamptz): 개찰일시 (opening date)
  - `cnstwk_period` (text): 공사기간 (construction period)
  - `prtcpt_req` (text): 참가자격 (participation requirements)
  - `relevance_score` (real): 실내건축 관련성 점수 (interior relevance score)
  - `raw_data` (jsonb): 원본 API 응답 (raw API response)
  - `collected_at` (timestamptz): 수집 시각
- `favorites`: stores user favorite bids
  - `bid_ntce_no` (text): 공고번호
  - `is_favorite` (boolean): 관심 여부
  - `created_at` (timestamptz): 생성 시각

2. Security
- Enable RLS on both tables.
- This is a no-auth single-tenant app: allow anon + authenticated CRUD on both.
- bids: SELECT only (data is collected server-side, not written from frontend)
- favorites: full CRUD for anon + authenticated

3. Indexes
- Unique index on bids(bid_ntce_no, bid_ntce_ord) to prevent duplicates
- Index on bids(bid_clse_dt) for deadline queries
- Index on bids(ntce_dt) for "today's new bids" queries
- Unique index on favorites(bid_ntce_no) to prevent duplicate favorites
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
