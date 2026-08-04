import type { BidStatus } from '@/types';

interface StatusBadgeProps {
  status: BidStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<BidStatus, string> = {
    진행중: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    마감임박: 'bg-amber-50 text-amber-700 ring-amber-200',
    마감: 'bg-slate-100 text-slate-500 ring-slate-200',
    입찰대기: 'bg-brand-50 text-brand-700 ring-brand-200',
  };
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {status}
    </span>
  );
}
