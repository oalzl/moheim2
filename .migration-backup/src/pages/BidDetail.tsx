import { useState, useEffect } from 'react';
import { ArrowLeft, Star, FileText, ShieldCheck, Calendar, Building2, MapPin, Banknote, Clock, FileCheck, Layers, Hash, Briefcase, AlertCircle, RefreshCw } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { useFavorites } from '@/store/favorites';
import { fetchBidDetail } from '@/lib/api';
import { formatCurrencyWon, formatDateTime, formatDate, daysUntil, orDash } from '@/lib/format';
import type { Bid, BidStatus } from '@/types';

interface BidDetailProps {
  bidNtceNo: string;
  bidNtceOrd: string;
  onBack: () => void;
}

function getBidStatus(bid: Bid): BidStatus {
  const days = daysUntil(bid.bid_clse_dt);
  if (days < 0) return '마감';
  if (days <= 1) return '마감임박';
  return '진행중';
}

export function BidDetail({ bidNtceNo, bidNtceOrd, onBack }: BidDetailProps) {
  const { isFavorite, toggleFavorite, loading: favLoading } = useFavorites();
  const [bid, setBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const data = await fetchBidDetail(bidNtceNo, bidNtceOrd);
        setBid(data);
        if (!data) setError('해당 공고를 찾을 수 없습니다.');
      } catch (err) {
        setError(err instanceof Error ? err.message : '공고를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, [bidNtceNo, bidNtceOrd]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-500">데이터를 불러오는 중...</span>
      </div>
    );
  }

  if (error || !bid) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-3 h-8 w-8 text-rose-400" />
        <p className="text-slate-500">{error ?? '공고를 찾을 수 없습니다.'}</p>
        <button onClick={onBack} className="btn-secondary mt-4">
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </button>
      </div>
    );
  }

  const fav = isFavorite(bid.bid_ntce_no);
  const status = getBidStatus(bid);

  const infoItems = [
    { icon: Hash, label: '공고번호', value: bid.bid_ntce_no },
    { icon: FileText, label: '공고명', value: orDash(bid.bid_ntce_nm) },
    { icon: Building2, label: '공고기관', value: orDash(bid.ntce_instt_nm) },
    { icon: Building2, label: '수요기관', value: orDash(bid.dminstt_nm) },
    { icon: Layers, label: '공사구분', value: orDash(bid.cnstwk_se) },
    { icon: Layers, label: '공사업종', value: orDash(bid.cnstwk_type_of_bsns) },
    { icon: MapPin, label: '지역제한', value: orDash(bid.region_rstrn) },
    { icon: Banknote, label: '예산금액', value: formatCurrencyWon(bid.asgn_bdgt_amt) },
    { icon: Banknote, label: '추정가격', value: formatCurrencyWon(bid.presmpt_prce) },
    { icon: Clock, label: '공사기간', value: orDash(bid.cnstwk_period) },
    { icon: Calendar, label: '입찰마감', value: formatDateTime(bid.bid_clse_dt) },
    { icon: Calendar, label: '개찰일', value: formatDateTime(bid.openg_dt) },
  ];

  return (
    <div className="animate-fade-in">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </button>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {orDash(bid.bid_ntce_nm)}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {orDash(bid.ntce_instt_nm)} · {orDash(bid.region_rstrn)} · {bid.bid_ntce_no}
          </p>
        </div>
        <button
          onClick={() => toggleFavorite(bid.bid_ntce_no)}
          disabled={favLoading}
          className={`btn-secondary shrink-0 ${fav ? 'border-amber-300 text-amber-600 hover:bg-amber-50' : ''}`}
        >
          <Star className="h-4 w-4" fill={fav ? 'currentColor' : 'none'} />
          {fav ? '관심 공고 해제' : '관심 공고'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
              <FileText className="h-[18px] w-[18px] text-brand-600" />
              기본 정보
            </h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {infoItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium text-slate-400">{item.label}</dt>
                      <dd className="mt-0.5 text-sm font-medium text-slate-900">{item.value}</dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
              <ShieldCheck className="h-[18px] w-[18px] text-brand-600" />
              참가자격
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">업종 / 면허</span>
                </div>
                <p className="mt-1.5 whitespace-pre-line pl-6 text-sm text-slate-600">
                  {orDash(bid.license_req)}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">지역 제한</span>
                </div>
                <p className="mt-1.5 whitespace-pre-line pl-6 text-sm text-slate-600">
                  {orDash(bid.region_rstrn)}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">기타 참가 조건</span>
                </div>
                <p className="mt-1.5 whitespace-pre-line pl-6 text-sm text-slate-600">
                  {orDash(bid.prtcpt_req)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-3 text-sm font-bold text-slate-900">주요 일정</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">공고일</span>
                <span className="font-medium text-slate-700">{formatDate(bid.ntce_dt)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">마감일</span>
                <span className="font-medium text-amber-600">{formatDateTime(bid.bid_clse_dt)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">개찰일</span>
                <span className="font-medium text-slate-700">{formatDateTime(bid.openg_dt)}</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-3 text-sm font-bold text-slate-900">실내건축 관련성</h2>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50">
                <span className="text-lg font-bold text-brand-600">
                  {Math.round(bid.relevance_score)}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                자동 필터링 기준의 관련성 점수입니다. 점수가 높을수록 실내건축과 관련이 높습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
