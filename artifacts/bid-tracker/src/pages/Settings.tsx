import { useState, useEffect } from 'react';
import { Save, Check, Database, Bell, Wifi, Clock, RefreshCw, Calendar, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { fetchHealth, collectBids } from '@/lib/api';
import type { ApiHealthStatus } from '@/types';

export function Settings() {
  const [notifyNewBid, setNotifyNewBid] = useState(true);
  const [notifyUrgent, setNotifyUrgent] = useState(true);
  const [saved, setSaved] = useState(false);
  const [healthStatus, setHealthStatus] = useState<ApiHealthStatus>('checking');
  const [healthMessage, setHealthMessage] = useState('확인 중');
  const [collecting, setCollecting] = useState(false);
  const [collectResult, setCollectResult] = useState<string | null>(null);
  const [collectError, setCollectError] = useState<string | null>(null);

  const checkHealth = async () => {
    setHealthStatus('checking');
    setHealthMessage('연결 확인 중');
    const { status, message } = await fetchHealth();
    setHealthStatus(status);
    setHealthMessage(message);
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCollect = async () => {
    setCollecting(true);
    setCollectError(null);
    setCollectResult(null);
    try {
      const result = await collectBids();
      setCollectResult(`수집 ${result.collected}건 중 실내건축 관련 ${result.relevant}건 저장 완료`);
      await checkHealth();
    } catch (err) {
      setCollectError(err instanceof Error ? err.message : '데이터 수집에 실패했습니다.');
    } finally {
      setCollecting(false);
    }
  };

  const healthConfig: Record<ApiHealthStatus, { color: string; label: string }> = {
    ok: { color: 'bg-emerald-50 text-emerald-600 ring-emerald-200', label: '정상 연결' },
    checking: { color: 'bg-amber-50 text-amber-600 ring-amber-200', label: '연결 확인 중' },
    no_key: { color: 'bg-slate-100 text-slate-600 ring-slate-200', label: '인증키 미설정' },
    error: { color: 'bg-rose-50 text-rose-600 ring-rose-200', label: 'API 연결 실패' },
    unknown: { color: 'bg-amber-50 text-amber-600 ring-amber-200', label: '연결 확인 중' },
  };

  const hc = healthConfig[healthStatus];

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader
        title="프로그램 설정"
        description="데이터 수집 및 알림 설정을 관리합니다."
      />

      <div className="space-y-6">
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Database className="h-[18px] w-[18px] text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">데이터 수집</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-50 text-slate-400">
                  <Wifi className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">나라장터 API 연결 상태</p>
                  <p className="text-xs text-slate-400">나라장터 입찰공고 데이터 수집 연결</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${hc.color}`}>
                <span className="relative flex h-1.5 w-1.5">
                  {healthStatus === 'ok' && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                    healthStatus === 'ok' ? 'bg-emerald-400' :
                    healthStatus === 'error' ? 'bg-rose-400' :
                    healthStatus === 'no_key' ? 'bg-slate-400' :
                    'bg-amber-400'
                  }`} />
                </span>
                {healthMessage}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-50 text-slate-400">
                  <RefreshCw className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">데이터 수집</p>
                  <p className="text-xs text-slate-400">나라장터에서 실내건축 공고를 수집합니다</p>
                </div>
              </div>
              <button
                onClick={handleCollect}
                disabled={collecting || healthStatus === 'no_key'}
                className="btn-secondary"
              >
                <RefreshCw className={`h-4 w-4 ${collecting ? 'animate-spin' : ''}`} />
                {collecting ? '수집 중...' : '수집'}
              </button>
            </div>

            {collectResult && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                <Check className="h-4 w-4 shrink-0" />
                {collectResult}
              </div>
            )}
            {collectError && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {collectError}
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-50 text-slate-400">
                  <Clock className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">마지막 데이터 수집 시간</p>
                  <p className="text-xs text-slate-400">가장 최근 데이터를 수집한 시각</p>
                </div>
              </div>
              <span className="text-sm font-medium text-slate-500">-</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-50 text-slate-400">
                  <Calendar className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">자동 수집 주기</p>
                  <p className="text-xs text-slate-400">나라장터 공고 자동 수집 간격</p>
                </div>
              </div>
              <select className="input-base w-32" defaultValue="1시간">
                <option>1시간</option>
                <option>3시간</option>
                <option>6시간</option>
                <option>12시간</option>
                <option>24시간</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-[18px] w-[18px] text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">알림</h2>
          </div>

          <div className="space-y-3">
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50">
              <div>
                <p className="text-sm font-semibold text-slate-700">새로운 실내건축 공고 알림</p>
                <p className="mt-0.5 text-xs text-slate-400">새로운 실내건축/인테리어 입찰공고가 수집되면 알림을 받습니다.</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyNewBid(!notifyNewBid)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  notifyNewBid ? 'bg-brand-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    notifyNewBid ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50">
              <div>
                <p className="text-sm font-semibold text-slate-700">마감 임박 공고 알림</p>
                <p className="mt-0.5 text-xs text-slate-400">마감 24시간 전 입찰공고를 알림으로 받습니다.</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyUrgent(!notifyUrgent)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  notifyUrgent ? 'bg-brand-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    notifyUrgent ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="btn-primary">
            <Save className="h-4 w-4" />
            저장
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
              <Check className="h-4 w-4" />
              저장되었습니다.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
