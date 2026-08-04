import { useState, useEffect, useMemo } from 'react';
import { Search, RotateCcw, SlidersHorizontal, ArrowUpDown, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { FavoriteButton } from '@/components/FavoriteButton';
import { useFavorites } from '@/store/favorites';
import { fetchBids, collectBids } from '@/lib/api';
import { formatCurrencyWon, formatDateTime, daysUntil, orDash } from '@/lib/format';
import type { Bid, BidStatus, BidFilters, SortKey } from '@/types';

interface BidListProps {
  onSelectBid: (bidNtceNo: string, bidNtceOrd: string) => void;
}

const defaultFilters: BidFilters = {
  search: '',
  region: '',
  minAmount: '',
  maxAmount: '',
  agency: '',
  endDate: '',
  sort: '마감순',
};

function getBidStatus(bid: Bid): BidStatus {
  const days = daysUntil(bid.bid_clse_dt);
  if (days < 0) return '마감';
  if (days <= 1) return '마감임박';
  return '진행중';
}

export function BidList({ onSelectBid }: BidListProps) {
  const { isFavorite, toggleFavorite, loading: favLoading } = useFavorites();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BidFilters>(defaultFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);
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

  const filtered = useMemo(() => {
    let result = bids.filter((bid) => {
      if (filters.search) {
        const q = filters.search;
        if (
          !bid.bid_ntce_nm?.includes(q) &&
          !bid.ntce_instt_nm?.includes(q) &&
          !bid.dminstt_nm?.includes(q)
        ) {
          return false;
        }
      }
      if (filters.region && filters.region !== '전체') {
        if (!bid.region_rstrn?.includes(filters.region)) return false;
      }
      if (filters.minAmount && (bid.asgn_bdgt_amt ?? 0) < parseInt(filters.minAmount)) return false;
      if (filters.maxAmount && (bid.asgn_bdgt_amt ?? 0) > parseInt(filters.maxAmount)) return false;
      if (filters.agency && !bid.ntce_instt_nm?.includes(filters.agency)) return false;
      if (filters.endDate && bid.bid_clse_dt && new Date(bid.bid_clse_dt) > new Date(filters.endDate)) return false;
      return true;
    });

    switch (filters.sort) {
      case '금액높은순':
        result = [...result].sort((a, b) => (b.asgn_bdgt_amt ?? 0) - (a.asgn_bdgt_amt ?? 0));
        break;
      case '금액낮은순':
        result = [...result].sort((a, b) => (a.asgn_bdgt_amt ?? 0) - (b.asgn_bdgt_amt ?? 0));
        break;
      case '최신순':
        result = [...result].sort((a, b) => {
          const da = a.ntce_dt ? new Date(a.ntce_dt).getTime() : 0;
          const db = b.ntce_dt ? new Date(b.ntce_dt).getTime() : 0;
          return db - da;
        });
        break;
      case '마감순':
      default:
        result = [...result].sort((a, b) => {
          const da = a.bid_clse_dt ? new Date(a.bid_clse_dt).getTime() : Infinity;
          const db = b.bid_clse_dt ? new Date(b.bid_clse_dt).getTime() : Infinity;
          return da - db;
        });
        break;
    }

    return result;
  }, [bids, filters]);

  const handleReset = () => setFilters(defaultFilters);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="실내건축 입찰공고"
        description="나라장터에서 자동 선별한 실내건축/인테리어 입찰공고를 검색하고 확인하세요."
      />

      <div className="mb-6 flex items-center gap-2">
        <button onClick={handleCollect} disabled={collecting} className="btn-secondary">
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

      <div className="card mb-6 p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">검색어</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="공고명 또는 발주기관"
              className="input-base"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">지역</label>
            <input
              type="text"
              value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
              placeholder="예: 서울, 경기"
              className="input-base"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">발주기관</label>
            <input
              type="text"
              value={filters.agency}
              onChange={(e) => setFilters({ ...filters, agency: e.target.value })}
              placeholder="기관명"
              className="input-base"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">정렬</label>
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value as SortKey })}
              className="input-base"
            >
              <option value="마감순">마감순</option>
              <option value="최신순">최신순</option>
              <option value="금액높은순">금액 높은순</option>
              <option value="금액낮은순">금액 낮은순</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          상세 필터 {showAdvanced ? '접기' : '펼치기'}
        </button>

        {showAdvanced && (
          <div className="mt-3 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">공사금액 최소</label>
              <input
                type="number"
                value={filters.minAmount}
                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                placeholder="0"
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">공사금액 최대</label>
              <input
                type="number"
                value={filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                placeholder="300000000"
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">입찰 마감일 (이전)</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="input-base"
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <button className="btn-primary">
            <Search className="h-4 w-4" />
            검색
          </button>
          <button onClick={handleReset} className="btn-secondary">
            <RotateCcw className="h-4 w-4" />
            초기화
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          총 <span className="font-semibold text-slate-900">{filtered.length}건</span>
        </p>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <ArrowUpDown className="h-3.5 w-3.5" />
          {filters.sort}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-2 text-slate-500">데이터를 불러오는 중...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-12 text-slate-400">
          <FileText className="mb-2 h-8 w-8" />
          <p className="text-sm">
            {bids.length === 0
              ? '수집된 공고가 없습니다. \'공고 수집\' 버튼을 눌러주세요.'
              : '조건에 맞는 공고가 없습니다.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">관심</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">공고명</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">발주기관</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">지역</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">예산금액</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">마감일</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">상태</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bid) => (
                  <tr
                    key={`${bid.bid_ntce_no}-${bid.bid_ntce_ord}`}
                    onClick={() => onSelectBid(bid.bid_ntce_no, bid.bid_ntce_ord)}
                    className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <FavoriteButton
                        isFavorite={isFavorite(bid.bid_ntce_no)}
                        onToggle={() => toggleFavorite(bid.bid_ntce_no)}
                        size="sm"
                        disabled={favLoading}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="block max-w-[280px] truncate font-medium text-slate-900"
                        title={bid.bid_ntce_nm ?? ''}
                      >
                        {orDash(bid.bid_ntce_nm)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{orDash(bid.ntce_instt_nm)}</td>
                    <td className="px-4 py-3 text-slate-600">{orDash(bid.region_rstrn)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {formatCurrencyWon(bid.asgn_bdgt_amt)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(bid.bid_clse_dt)}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={getBidStatus(bid)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
