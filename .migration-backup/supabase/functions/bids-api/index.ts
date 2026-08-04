import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { evaluateRelevance, type FilterableBid } from "./interiorFilter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const NAARA_API_BASE = "https://apis.data.go.kr/1230000/ad/BidPublicInfoService";
const ENDPOINT = "/getBidPblancListInfoCnstwk";
const API_KEY = decodeURIComponent("%2Fy5YrXelYYPlZbQenOmip2n4frqkci3Kdewo6sRL3W8bOn5mT8qpvj37dV3b%2BAdtoLVKadi20eq1uW6yYs%2BxBA%3D%3D");

const EXTERNAL_SUPABASE_URL = "https://romhvtggakhcfexsfplw.supabase.co";
const EXTERNAL_SUPABASE_ANON_KEY = "sb_publishable_Et6D64O3RWN_KEuv2dg7FA_WUmK0nNM";

const supabase = createClient(
  EXTERNAL_SUPABASE_URL,
  EXTERNAL_SUPABASE_ANON_KEY,
);

interface RawBidItem {
  bidNtceNo?: string;
  bidNtceOrd?: string;
  bidNtceNm?: string;
  cnstwkNm?: string;
  ntceInsttNm?: string;
  dminsttNm?: string;
  cnstwkSe?: string;
  cnstwkTypeOfBsns?: string;
  licenseReq?: string;
  cnstwkDtlRstrnArea?: string;
  asgnBdgtAmt?: string | number;
  presmptPrce?: string | number;
  ntceDt?: string;
  bidClseDt?: string;
  opengDt?: string;
  cnstwkPeriod?: string;
  prtcptReq?: string;
  [key: string]: unknown;
}

function toText(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s.length > 0 ? s : undefined;
}

function toNumber(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? undefined : n;
}

function toDate(v: unknown): string | undefined {
  const s = toText(v);
  if (!s) return undefined;
  // API returns formats like "2026-08-01 10:00:00" or "20260801100000"
  let normalized = s;
  if (/^\d{14}$/.test(s)) {
    normalized = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}+09:00`;
  } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
    normalized = s.replace(" ", "T") + "+09:00";
  }
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

function mapBidItem(raw: RawBidItem) {
  const filterable: FilterableBid = {
    bidNtceNm: toText(raw.bidNtceNm),
    cnstwkNm: toText(raw.cnstwkNm),
    cnstwkSe: toText(raw.cnstwkSe),
    cnstwkTypeOfBsns: toText(raw.cnstwkTypeOfBsns),
    licenseReq: toText(raw.licenseReq),
    prtcptReq: toText(raw.prtcptReq),
  };
  const { relevanceScore } = evaluateRelevance(filterable);

  return {
    bid_ntce_no: toText(raw.bidNtceNo) ?? "",
    bid_ntce_ord: toText(raw.bidNtceOrd) ?? "1",
    bid_ntce_nm: toText(raw.bidNtceNm),
    cnstwk_nm: toText(raw.cnstwkNm),
    ntce_instt_nm: toText(raw.ntceInsttNm),
    dminstt_nm: toText(raw.dminsttNm),
    cnstwk_se: toText(raw.cnstwkSe),
    cnstwk_type_of_bsns: toText(raw.cnstwkTypeOfBsns),
    license_req: toText(raw.licenseReq),
    region_rstrn: toText(raw.cnstwkDtlRstrnArea),
    asgn_bdgt_amt: toNumber(raw.asgnBdgtAmt),
    presmpt_prce: toNumber(raw.presmptPrce),
    ntce_dt: toDate(raw.ntceDt),
    bid_clse_dt: toDate(raw.bidClseDt),
    openg_dt: toDate(raw.opengDt),
    cnstwk_period: toText(raw.cnstwkPeriod),
    prtcpt_req: toText(raw.prtcptReq),
    relevance_score: relevanceScore,
    raw_data: raw,
  };
}

async function fetchNaraBids(numOfRows: number, pageNo: number): Promise<RawBidItem[]> {
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    numOfRows: String(numOfRows),
    pageNo: String(pageNo),
    inqryDiv: "1",
    type: "json",
  });
  const url = `${NAARA_API_BASE}${ENDPOINT}?${params.toString()}`;
  console.log("[bids-api] Fetching:", url.replace(API_KEY, "***"));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) {
      const body = await resp.text();
      console.error(`[bids-api] API HTTP ${resp.status}:`, body.slice(0, 500));
      throw new Error(`나라장터 API HTTP ${resp.status}`);
    }
    const data = await resp.json();
    // 응답 구조: { response: { header: {...}, body: { items: [...] | { item: [...] } } } }
    const body = data?.response?.body;
    if (!body) {
      console.error("[bids-api] Unexpected response structure:", JSON.stringify(data).slice(0, 500));
      throw new Error("나라장터 API 응답 형식 오류");
    }
    const itemsRaw = body.items;
    const items: RawBidItem[] = Array.isArray(itemsRaw)
      ? itemsRaw
      : Array.isArray(itemsRaw?.item)
        ? itemsRaw.item
        : [];
    return items;
  } finally {
    clearTimeout(timeout);
  }
}

async function collectAndStoreBids(): Promise<{ collected: number; stored: number; relevant: number }> {
  const allItems: RawBidItem[] = [];
  for (let page = 1; page <= 5; page++) {
    const items = await fetchNaraBids(100, page);
    allItems.push(...items);
    if (items.length < 100) break;
  }

  const mapped = allItems.map(mapBidItem);
  const relevant = mapped.filter((b) => b.relevance_score >= 5 && b.bid_ntce_no);

  if (relevant.length === 0) {
    return { collected: allItems.length, stored: 0, relevant: 0 };
  }

  const { error } = await supabase
    .from("bids")
    .upsert(relevant, { onConflict: "bid_ntce_no,bid_ntce_ord" });

  if (error) {
    console.error("[bids-api] DB upsert error:", error.message);
    throw new Error(`DB 저장 실패: ${error.message}`);
  }

  return { collected: allItems.length, stored: relevant.length, relevant: relevant.length };
}

async function handleHealth(): Promise<Response> {
  if (!API_KEY) {
    return jsonResponse({ status: "no_key", message: "API 인증키가 설정되지 않았습니다." }, 200);
  }
  try {
    const params = new URLSearchParams({
      serviceKey: API_KEY,
      numOfRows: "1",
      pageNo: "1",
      inqryDiv: "1",
      type: "json",
    });
    const url = `${NAARA_API_BASE}${ENDPOINT}?${params.toString()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let ok = false;
    let detail = "";
    try {
      const resp = await fetch(url, { signal: controller.signal });
      ok = resp.ok;
      if (!ok) {
        detail = `HTTP ${resp.status}`;
      } else {
        const data = await resp.json();
        const resultCode = data?.response?.header?.resultCode;
        if (resultCode && resultCode !== "00") {
          ok = false;
          detail = data?.response?.header?.resultMsg || `코드 ${resultCode}`;
        }
      }
    } finally {
      clearTimeout(timeout);
    }
    return jsonResponse(
      ok
        ? { status: "ok", message: "나라장터 API 정상 연결" }
        : { status: "error", message: `나라장터 API 연결 실패 (${detail})` },
      200,
    );
  } catch (e) {
    return jsonResponse({ status: "error", message: `연결 확인 실패: ${e.message}` }, 200);
  }
}

async function handleGetBids(url: URL): Promise<Response> {
  // DB에서 실내건축 관련 공고 조회
  let query = supabase
    .from("bids")
    .select("*")
    .order("bid_clse_dt", { ascending: true });

  const search = url.searchParams.get("search");
  if (search) {
    query = query.or(`bid_ntce_nm.ilike.%${search}%,ntce_instt_nm.ilike.%${search}%,dminstt_nm.ilike.%${search}%`);
  }

  const region = url.searchParams.get("region");
  if (region && region !== "전체") {
    query = query.ilike("region_rstrn", `%${region}%`);
  }

  const agency = url.searchParams.get("agency");
  if (agency) {
    query = query.ilike("ntce_instt_nm", `%${agency}%`);
  }

  const minAmount = url.searchParams.get("minAmount");
  if (minAmount) {
    query = query.gte("asgn_bdgt_amt", Number(minAmount));
  }

  const maxAmount = url.searchParams.get("maxAmount");
  if (maxAmount) {
    query = query.lte("asgn_bdgt_amt", Number(maxAmount));
  }

  const limit = Math.min(Number(url.searchParams.get("limit") ?? "100"), 500);
  const { data, error } = await query.limit(limit);

  if (error) {
    console.error("[bids-api] DB query error:", error.message);
    return jsonResponse({ error: "데이터 조회에 실패했습니다." }, 500);
  }

  return jsonResponse({ bids: data ?? [] });
}

async function handleGetBidDetail(bidNtceNo: string, bidNtceOrd: string): Promise<Response> {
  const { data, error } = await supabase
    .from("bids")
    .select("*")
    .eq("bid_ntce_no", bidNtceNo)
    .eq("bid_ntce_ord", bidNtceOrd)
    .maybeSingle();

  if (error) {
    console.error("[bids-api] DB detail query error:", error.message);
    return jsonResponse({ error: "데이터 조회에 실패했습니다." }, 500);
  }

  if (!data) {
    return jsonResponse({ error: "해당 공고를 찾을 수 없습니다." }, 404);
  }

  return jsonResponse({ bid: data });
}

async function handleCollect(): Promise<Response> {
  const result = await collectAndStoreBids();
  return jsonResponse(result);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/bids-api/, "");

    // Route: /health
    if (path === "/health") {
      return await handleHealth();
    }

    // Route: /collect (server-side data collection)
    if (path === "/collect") {
      return await handleCollect();
    }

    // Route: /bids/:bidNtceNo/:bidNtceOrd
    const detailMatch = path.match(/^\/bids\/([^/]+)\/([^/]+)$/);
    if (detailMatch) {
      return await handleGetBidDetail(decodeURIComponent(detailMatch[1]), decodeURIComponent(detailMatch[2]));
    }

    // Route: /bids
    if (path === "/bids" || path === "/bids/") {
      return await handleGetBids(url);
    }

    return jsonResponse({ error: "알 수 없는 경로입니다." }, 404);
  } catch (err) {
    console.error("[bids-api] Unhandled error:", err);
    return jsonResponse({ error: err.message || "서버 오류가 발생했습니다." }, 500);
  }
});
