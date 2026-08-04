import { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Star, BarChart3, Settings, Telescope, X, Wifi } from 'lucide-react';
import { fetchHealth } from '@/lib/api';
import type { ApiHealthStatus } from '@/types';

export type PageKey = 'dashboard' | 'bids' | 'favorites' | 'analysis' | 'settings';

interface SidebarProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  isOpen: boolean;
  onClose: () => void;
}

const menuItems: { key: PageKey; label: string; icon: typeof LayoutDashboard; disabled?: boolean }[] = [
  { key: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { key: 'bids', label: '실내건축 입찰공고', icon: FileText },
  { key: 'favorites', label: '관심 공고', icon: Star },
  { key: 'analysis', label: '낙찰 분석', icon: BarChart3, disabled: true },
  { key: 'settings', label: '프로그램 설정', icon: Settings },
];

const statusConfig: Record<ApiHealthStatus, { color: string; pingColor: string; label: string; textColor: string }> = {
  ok: { color: 'bg-emerald-400', pingColor: 'bg-emerald-400', label: '정상 연결', textColor: 'text-emerald-600' },
  checking: { color: 'bg-amber-400', pingColor: 'bg-amber-400', label: '연결 확인 중', textColor: 'text-amber-600' },
  no_key: { color: 'bg-slate-400', pingColor: 'bg-slate-400', label: '인증키 미설정', textColor: 'text-slate-600' },
  error: { color: 'bg-rose-400', pingColor: 'bg-rose-400', label: 'API 연결 실패', textColor: 'text-rose-600' },
  unknown: { color: 'bg-slate-400', pingColor: 'bg-slate-400', label: '연결 확인 중', textColor: 'text-slate-600' },
};

export function Sidebar({ current, onNavigate, isOpen, onClose }: SidebarProps) {
  const [healthStatus, setHealthStatus] = useState<ApiHealthStatus>('checking');
  const [healthLabel, setHealthLabel] = useState('연결 확인 중');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { status, message } = await fetchHealth();
      if (!mounted) return;
      setHealthStatus(status);
      setHealthLabel(message || statusConfig[status].label);
    })();
  }, []);

  const sc = statusConfig[healthStatus];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed z-40 flex h-full w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Telescope className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900">BidScope</span>
            <span className="text-[11px] font-medium text-slate-400">실내건축 입찰 분석</span>
          </div>
          <button
            className="ml-auto rounded p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
            onClick={onClose}
            aria-label="메뉴 닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = current === item.key;
            const disabled = item.disabled;
            return (
              <button
                key={item.key}
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  onNavigate(item.key);
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  disabled
                    ? 'cursor-not-allowed text-slate-300'
                    : active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={disabled ? '준비 중' : undefined}
              >
                <Icon className={`h-[18px] w-[18px] ${disabled ? 'text-slate-300' : active ? 'text-brand-600' : 'text-slate-400'}`} />
                {item.label}
                {disabled && (
                  <span className="ml-auto text-[10px] font-medium text-slate-300">준비 중</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {healthStatus === 'ok' && (
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${sc.pingColor} opacity-75`} />
                )}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${sc.color}`} />
              </span>
              <span className="text-xs font-semibold text-slate-700">나라장터 API 연결</span>
            </div>
            <p className={`mt-1.5 text-[11px] font-medium ${sc.textColor}`}>{healthLabel}</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export function MobileTopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const [healthStatus, setHealthStatus] = useState<ApiHealthStatus>('checking');
  const [healthLabel, setHealthLabel] = useState('확인 중');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { status, message } = await fetchHealth();
      if (!mounted) return;
      setHealthStatus(status);
      setHealthLabel(message || statusConfig[status].label);
    })();
  }, []);

  const sc = statusConfig[healthStatus];

  return (
    <div className="flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
        aria-label="메뉴 열기"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-brand-600 text-white">
          <Telescope className="h-4 w-4" />
        </div>
        <span className="text-sm font-bold text-slate-900">BidScope</span>
      </div>
      <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-500">
        <Wifi className={`h-3.5 w-3.5 ${sc.textColor}`} />
        {healthLabel}
      </div>
    </div>
  );
}

export function useSidebarState() {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, setIsOpen };
}
