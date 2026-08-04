/*
 * interiorFilter.ts
 *
 * 실내건축/인테리어 관련 공고 판별 모듈
 *
 * 나라장터 API에서 수집한 공사 입찰공고가 실내건축과 관련이 있는지
 * 판별하고 관련성 점수(relevanceScore)를 계산한다.
 *
 * 판별 기준:
 * 1. 공고명, 공사명, 공사구분, 공사업종, 면허요건, 참가자격 텍스트에서
 *    실내건축 관련 키워드를 검색
 * 2. 명확한 비관련 공종(도로, 토목, 교량, 외벽 등) 키워드가 있으면 제외
 * 3. 관련 키워드 가중치 합산 → relevanceScore
 * 4. 점수가 임계값(THRESHOLD) 이상인 공고만 통과
 *
 * 향후 개선:
 * - 키워드 목록 조정
 * - 머신러닝 분류기로 교체
 * - 업종/면허 코드 매핑 추가
 */

// 실내건축 관련 키워드 (높은 가중치)
const HIGH_RELEVANCE_KEYWORDS: { keyword: string; weight: number }[] = [
  { keyword: "실내건축", weight: 10 },
  { keyword: "실내공사", weight: 9 },
  { keyword: "인테리어", weight: 9 },
  { keyword: "내부공사", weight: 8 },
  { keyword: "내부환경개선", weight: 8 },
  { keyword: "시설환경개선", weight: 7 },
  { keyword: "청사환경개선", weight: 7 },
  { keyword: "교육환경개선", weight: 7 },
  { keyword: "사무실조성", weight: 7 },
  { keyword: "공간조성", weight: 6 },
  { keyword: "리모델링", weight: 6 },
  { keyword: "내부리모델링", weight: 8 },
  { keyword: "내부 개선", weight: 6 },
  { keyword: "실내개선", weight: 7 },
  { keyword: "실내정비", weight: 6 },
  { keyword: "내장공사", weight: 6 },
  { keyword: "내장재", weight: 5 },
  { keyword: "바닥공사", weight: 4 },
  { keyword: "바닥재", weight: 4 },
  { keyword: "벽지공사", weight: 4 },
  { keyword: "천장공사", weight: 4 },
  { keyword: "도장공사", weight: 3 },
  { keyword: "조명공사", weight: 3 },
  { keyword: "방수공사", weight: 3 },
  { keyword: "설비개선", weight: 4 },
];

// 명확한 비관련 공종 키워드 (발견 시 점수 차감)
const EXCLUDE_KEYWORDS: { keyword: string; penalty: number }[] = [
  { keyword: "도로공사", penalty: 15 },
  { keyword: "도로", penalty: 8 },
  { keyword: "토목", penalty: 12 },
  { keyword: "교량", penalty: 15 },
  { keyword: "터널", penalty: 15 },
  { keyword: "외벽", penalty: 10 },
  { keyword: "지붕", penalty: 10 },
  { keyword: "전기공사", penalty: 8 },
  { keyword: "소방공사", penalty: 8 },
  { keyword: "상하수도", penalty: 12 },
  { keyword: "하수도", penalty: 12 },
  { keyword: "포장", penalty: 8 },
  { keyword: "조경", penalty: 8 },
  { keyword: "토공", penalty: 12 },
  { keyword: "정지공사", penalty: 10 },
  { keyword: "가설공사", penalty: 8 },
  { keyword: "철거공사", penalty: 5 },
  { keyword: "굴착", penalty: 10 },
  { keyword: "파일", penalty: 8 },
  { keyword: "기초공사", penalty: 8 },
  { keyword: "외부", penalty: 6 },
  { keyword: "옥외", penalty: 6 },
];

// 관련성 점수 임계값: 이 점수 이상인 공고만 실내건축 관련으로 분류
const THRESHOLD = 5;

export interface FilterableBid {
  bidNtceNm?: string;
  cnstwkNm?: string;
  cnstwkSe?: string;
  cnstwkTypeOfBsns?: string;
  licenseReq?: string;
  prtcptReq?: string;
  [key: string]: unknown;
}

export interface FilterResult {
  isRelevant: boolean;
  relevanceScore: number;
  matchedKeywords: string[];
}

function combineText(bid: FilterableBid): string {
  return [
    bid.bidNtceNm,
    bid.cnstwkNm,
    bid.cnstwkSe,
    bid.cnstwkTypeOfBsns,
    bid.licenseReq,
    bid.prtcptReq,
  ]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .join(" ");
}

export function evaluateRelevance(bid: FilterableBid): FilterResult {
  const text = combineText(bid);
  if (!text || text.trim().length === 0) {
    return { isRelevant: false, relevanceScore: 0, matchedKeywords: [] };
  }

  let score = 0;
  const matched: string[] = [];

  for (const { keyword, weight } of HIGH_RELEVANCE_KEYWORDS) {
    if (text.includes(keyword)) {
      score += weight;
      matched.push(keyword);
    }
  }

  for (const { keyword, penalty } of EXCLUDE_KEYWORDS) {
    if (text.includes(keyword)) {
      score -= penalty;
    }
  }

  return {
    isRelevant: score >= THRESHOLD,
    relevanceScore: Math.max(0, score),
    matchedKeywords: matched,
  };
}
