import { useState, useEffect, useMemo } from 'react';
import { Star, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { FavoriteButton } from '@/components/FavoriteButton';
import { useFavorites } from '@/store/favorites';
import { fetchBids, fetchFavorites } from '@/lib/api';
import { formatCurrencyWon, formatDateTime, daysUntil, orDash } from '@/lib/format';
import type { Bid, BidStatus, FavoriteBid } from '@/types';

interface FavoritesProps {
  onSelectBid: (bidNtceNo: string, bidNtceOrd: string) => void;
}

function getBidStatus(bid: Bid): BidStatus {
  const days = daysUntil(bid.bid_clse_dt);
  if (days < 0) return '마감';
  if (days <= 1) return '마감임박';
  return '진행중';
}

export function Favorites({ onSelectBid }: FavoritesProps) {
  const { favorites, toggleFavorite, loading: favLoading } = useFavorites();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  const favoriteBids = useMemo(() => {
    return bids.filter((b) => favorites.has(b.bid_ntce_no));
  }, [bids, favorites]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="관심 공고"
        description="별표를 눌러 관심 등록한 실내건축 입찰공고를 확인하세요."
      />

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
      ) : favoriteBids.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-slate-400">
          <Star className="mb-3 h-10 w-10" />
          <p className="text-sm">관심 공고가 없습니다.</p>
          <p className="mt-1 text-xs">공고 목록에서 별표를 눌러 관심 공고를 추가해보세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {favoriteBids.map((bid) => (
            <div
              key={`${bid.bid_ntce_no}-${bid.bid_ntce_ord}`}
              onClick={() => onSelectBid(bid.bid_ntce_no, bid.bid_ntce_ord)}
              className="card group cursor-pointer p-5 transition-all hover:shadow-card-hover"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={getBidStatus(bid)} />
                    <span className="text-xs text-slate-400">{bid.bid_ntce_no}</span>
                  </div>
                  <h3 className="mt-2 truncate text-base font-semibold text-slate-900 group-hover:text-brand-700">
                    {orDash(bid.bid_ntce_nm)}
                  </h3>
                  <p className="mt-0.5 truncate text-sm text-slate-500">{orDash(bid.ntce_instt_nm)}</p>
                </div>
                <FavoriteButton
                  isFavorite={true}
                  onToggle={() => toggleFavorite(bid.bid_ntce_no)}
                  disabled={favLoading}
                />
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
