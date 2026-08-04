import { useState, useEffect, useMemo } from 'react';
import { FileText, Clock, Star, ArrowRight, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { FavoriteButton } from '@/components/FavoriteButton';
import { useFavorites } from '@/store/favorites';
import { fetchBids, collectBids } from '@/lib/api';
import { formatCurrencyWon, formatDateTime, daysUntil, orDash } from '@/lib/format';
import type { Bid, BidStatus } from '@/types';
import type { PageKey } from '@/components/Sidebar';

interface DashboardProps {
  onNavigate: (page: PageKey) => void;
  onSelectBid: (bidNtceNo: string, bidNtceOrd: string) => void;
}

function getBidStatus(bid: Bid): BidStatus {
  const days = daysUntil(bid.bid_clse_dt);
  if (days < 0) return '마감';
  if (days <= 1) return '마감임박';
  return '진행중';
}

export function Dashboard({ onNavigate, onSelectBid }: DashboardProps) {
  const { isFavorite, toggleFavorite, loading: favLoading } = useFavorites();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collecting, setCollecting] = useState(false);

  const loadBids = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBids();
      setBids(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBids();
  }, []);

  const handleCollect = async () => {
    setCollecting(true);
    try {
      await collectBids();
      await loadBids();
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 수집에 실패했습니다.');
    } finally {
      setCollecting(false);
    }
  };

  const kpis = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const newToday = bids.filter((b) => {
      if (!b.ntce_dt) return false;
      const d = new Date(b.ntce_dt);
      return d >= todayStart;
    }).length;

    const inProgress = bids.filter((b) => {
      const days = daysUntil(b.bid_clse_dt);
      return days >= 0;
    }).length;

    const urgent = bids.filter((b) => {
      const days = daysUntil(b.bid_clse_dt);
      return days >= 0 && days <= 1;
    }).length;

    const favCount = bids.filter((b) => isFavorite(b.bid_ntce_no)).length;

    return [
      { label: '오늘 신규 공고', value: newToday, unit: '건', icon: FileText, color: 'brand' },
      { label: '진행 중 공고', value: inProgress, unit: '건', icon: Activity, color: 'emerald' },
      { label: '마감 임박', value: urgent, unit: '건', icon: Clock, color: 'amber' },
      { label: '관심 공고', value: favCount, unit: '건', icon: Star, color: 'violet' },
    ];
  }, [bids, isFavorite]);

  const recommended = useMemo(() => {
    return [...bids]
      .filter((b) => daysUntil(b.bid_clse_dt) >= 0)
      .sort((a, b) => {
        const daysA = daysUntil(a.bid_clse_dt);
        const daysB = daysUntil(b.bid_clse_dt);
        if (daysA !== daysB) return daysA - daysB;
        return (b.relevance_score ?? 0) - (a.relevance_score ?? 0);
      })
      .slice(0, 5);
  }, [bids]);

  const colorMap: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="오늘의 실내건축 입찰 현황"
        description="나라장터에서 자동 선별한 실내건축/인테리어 입찰공고를 한눈에 확인하세요."
      />

      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={handleCollect}
          disabled={collecting}
          className="btn-secondary"
        >
          <RefreshCw className={`h-4 w-4 ${collecting ? 'animate-spin' : ''}`} />
          {collecting ? '수집 중...' : '공고 수집'}
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-2 text-slate-500">데이터를 불러오는 중...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="card p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">{kpi.label}</span>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorMap[kpi.color]}`}>
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight text-slate-900">{kpi.value}</span>
                    <span className="text-sm font-medium text-slate-400">{kpi.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">오늘의 추천 입찰공고</h2>
              <button
                onClick={() => onNavigate('bids')}
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                전체 보기 <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {recommended.length === 0 ? (
              <div className="card flex flex-col items-center justify-center py-12 text-slate-400">
                <FileText className="mb-2 h-8 w-8" />
                <p className="text-sm">표시할 공고가 없습니다. '공고 수집' 버튼을 눌러 데이터를 가져오세요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recommended.map((bid) => (
                  <DashboardBidCard
                    key={`${bid.bid_ntce_no}-${bid.bid_ntce_ord}`}
                    bid={bid}
                    status={getBidStatus(bid)}
                    isFav={isFavorite(bid.bid_ntce_no)}
                    favLoading={favLoading}
                    onToggleFav={() => toggleFavorite(bid.bid_ntce_no)}
                    onClick={() => onSelectBid(bid.bid_ntce_no, bid.bid_ntce_ord)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DashboardBidCard({
  bid,
  status,
  isFav,
  favLoading,
  onToggleFav,
  onClick,
}: {
  bid: Bid;
  status: BidStatus;
  isFav: boolean;
  favLoading: boolean;
  onToggleFav: () => void;
  onClick: () => void;
}) {
  const daysLeft = daysUntil(bid.bid_clse_dt);
  return (
    <div
      onClick={onClick}
      className="card group cursor-pointer p-5 transition-all hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            <span className="text-xs text-slate-400">{bid.bid_ntce_no}</span>
          </div>
          <h3 className="mt-2 truncate text-base font-semibold text-slate-900 group-hover:text-brand-700">
            {orDash(bid.bid_ntce_nm)}
          </h3>
          <p className="mt-0.5 truncate text-sm text-slate-500">{orDash(bid.ntce_instt_nm)}</p>
        </div>
        <FavoriteButton isFavorite={isFav} onToggle={onToggleFav} disabled={favLoading} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <span className="text-xs text-slate-400">지역</span>
          <p className="font-medium text-slate-700">{orDash(bid.region_rstrn)}</p>
        </div>
        <div>
          <span className="text-xs text-slate-400">예산금액</span>
          <p className="font-medium text-slate-700">{formatCurrencyWon(bid.asgn_bdgt_amt)}</p>
        </div>
        <div>
          <span className="text-xs text-slate-400">마감</span>
          <p className="font-medium text-slate-700">{formatDateTime(bid.bid_clse_dt)}</p>
        </div>
      </div>
      {daysLeft <= 1 && daysLeft >= 0 && (
        <div className="mt-3">
          <span className="text-xs font-medium text-amber-600">
            D-{daysLeft === 0 ? 'Day' : daysLeft}
          </span>
        </div>
      )}
    </div>
  );
}
