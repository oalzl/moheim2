import { Router } from "express";
import { evaluateRelevance } from "../lib/interiorFilter";
import { logger } from "../lib/logger";

const router = Router();

const NAARA_API_BASE = "https://apis.data.go.kr/1230000/ad/BidPublicInfoService";
const ENDPOINT = "/getBidPblancListInfoCnstwk";
const API_KEY = process.env["NARA_API_KEY"] ?? "";

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
  const filterable = {
    bidNtceNm: toText(raw.bidNtceNm),
    cnstwkNm: toText(raw.cnstwkNm),
    cnstwkSe: toText(raw.cnstwkSe),
    cnstwkTypeOfBsns: toText(raw.cnstwkTypeOfBsns),
    licenseReq: toText(raw.licenseReq),
    prtcptReq: toText(raw.prtcptReq),
  };
  const { relevanceScore } = evaluateRelevance(filterable);

  return {
    id: `${toText(raw.bidNtceNo) ?? ""}__${toText(raw.bidNtceOrd) ?? "1"}`,
    bid_ntce_no: toText(raw.bidNtceNo) ?? "",
    bid_ntce_ord: toText(raw.bidNtceOrd) ?? "1",
    bid_ntce_nm: toText(raw.bidNtceNm) ?? null,
    cnstwk_nm: toText(raw.cnstwkNm) ?? null,
    ntce_instt_nm: toText(raw.ntceInsttNm) ?? null,
    dminstt_nm: toText(raw.dminsttNm) ?? null,
    cnstwk_se: toText(raw.cnstwkSe) ?? null,
    cnstwk_type_of_bsns: toText(raw.cnstwkTypeOfBsns) ?? null,
    license_req: toText(raw.licenseReq) ?? null,
    region_rstrn: toText(raw.cnstwkDtlRstrnArea) ?? null,
    asgn_bdgt_amt: toNumber(raw.asgnBdgtAmt) ?? null,
    presmpt_prce: toNumber(raw.presmptPrce) ?? null,
    ntce_dt: toDate(raw.ntceDt) ?? null,
    bid_clse_dt: toDate(raw.bidClseDt) ?? null,
    openg_dt: toDate(raw.opengDt) ?? null,
    cnstwk_period: toText(raw.cnstwkPeriod) ?? null,
    prtcpt_req: toText(raw.prtcptReq) ?? null,
    relevance_score: relevanceScore,
    raw_data: raw,
    collected_at: new Date().toISOString(),
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
  logger.info({ url: url.replace(API_KEY, "***") }, "[bids] Fetching nara API");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) throw new Error(`나라장터 API HTTP ${resp.status}`);
    const data = await resp.json();
    const body = data?.response?.body;
    if (!body) throw new Error("나라장터 API 응답 형식 오류");
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

// In-memory cache: refreshed on each /collect call
type MappedBid = ReturnType<typeof mapBidItem>;
let cachedBids: MappedBid[] = [];
let cacheTimestamp = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function fetchAllRelevantBids(): Promise<{ bids: MappedBid[]; collected: number }> {
  const allItems: RawBidItem[] = [];
  for (let page = 1; page <= 5; page++) {
    const items = await fetchNaraBids(100, page);
    allItems.push(...items);
    if (items.length < 100) break;
  }
  const mapped = allItems.map(mapBidItem);
  const relevant = mapped.filter((b) => b.relevance_score >= 5 && b.bid_ntce_no);
  return { bids: relevant, collected: allItems.length };
}

// GET /api/bids/health
router.get("/health", async (_req, res) => {
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
    res.json(
      ok
        ? { status: "ok", message: "나라장터 API 정상 연결" }
        : { status: "error", message: `나라장터 API 연결 실패 (${detail})` },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.json({ status: "error", message: `연결 확인 실패: ${msg}` });
  }
});

// POST /api/bids/collect — fetch fresh data from nara, refresh cache, return stats
router.post("/collect", async (_req, res) => {
  try {
    const { bids, collected } = await fetchAllRelevantBids();
    cachedBids = bids;
    cacheTimestamp = Date.now();
    res.json({ collected, stored: bids.length, relevant: bids.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error({ err: e }, "[bids] collect error");
    res.status(500).json({ error: msg });
  }
});

// GET /api/bids — return cached bids (auto-fetch if cache is empty/stale)
router.get("/", async (req, res) => {
  try {
    // Auto-refresh cache if stale
    if (cachedBids.length === 0 || Date.now() - cacheTimestamp > CACHE_TTL_MS) {
      const { bids } = await fetchAllRelevantBids();
      cachedBids = bids;
      cacheTimestamp = Date.now();
    }

    let result = cachedBids;

    const search = req.query["search"] as string | undefined;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.bid_ntce_nm?.toLowerCase().includes(q) ||
          b.ntce_instt_nm?.toLowerCase().includes(q) ||
          b.dminstt_nm?.toLowerCase().includes(q),
      );
    }

    const region = req.query["region"] as string | undefined;
    if (region && region !== "전체") {
      result = result.filter((b) => b.region_rstrn?.includes(region));
    }

    const agency = req.query["agency"] as string | undefined;
    if (agency) {
      result = result.filter((b) => b.ntce_instt_nm?.includes(agency));
    }

    const minAmount = req.query["minAmount"] as string | undefined;
    if (minAmount) {
      result = result.filter((b) => (b.asgn_bdgt_amt ?? 0) >= Number(minAmount));
    }

    const maxAmount = req.query["maxAmount"] as string | undefined;
    if (maxAmount) {
      result = result.filter((b) => (b.asgn_bdgt_amt ?? Infinity) <= Number(maxAmount));
    }

    const limit = Math.min(Number(req.query["limit"] ?? "100"), 500);
    result = result.slice(0, limit);

    res.json({ bids: result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error({ err: e }, "[bids] list error");
    res.status(500).json({ error: msg });
  }
});

// GET /api/bids/:bidNtceNo/:bidNtceOrd — look up from cache
router.get("/:bidNtceNo/:bidNtceOrd", async (req, res) => {
  try {
    const { bidNtceNo, bidNtceOrd } = req.params;

    // Ensure cache is populated
    if (cachedBids.length === 0 || Date.now() - cacheTimestamp > CACHE_TTL_MS) {
      const { bids } = await fetchAllRelevantBids();
      cachedBids = bids;
      cacheTimestamp = Date.now();
    }

    const bid = cachedBids.find(
      (b) => b.bid_ntce_no === bidNtceNo && b.bid_ntce_ord === bidNtceOrd,
    );

    if (!bid) {
      res.status(404).json({ error: "해당 공고를 찾을 수 없습니다." });
      return;
    }

    res.json({ bid });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error({ err: e }, "[bids] detail error");
    res.status(500).json({ error: msg });
  }
});

export default router;
