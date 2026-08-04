export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '-';
  return new Intl.NumberFormat('ko-KR').format(amount);
}

export function formatCurrencyWon(amount: number | null | undefined): string {
  if (amount == null) return '-';
  return `${formatCurrency(amount)}원`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day} ${h}:${min}`;
}

export function daysUntil(dateStr: string | null | undefined): number {
  if (!dateStr) return Infinity;
  const now = new Date();
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return Infinity;
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function orDash(value: string | null | undefined): string {
  if (!value || value.trim().length === 0) return '-';
  return value;
}
