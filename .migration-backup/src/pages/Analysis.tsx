import { BarChart3, Lock, Database, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

export function Analysis() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="낙찰 분석"
        description="과거 실내건축/인테리어 입찰의 낙찰 데이터를 분석한 통계를 확인하세요."
      />

      <div className="card flex flex-col items-center justify-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
          <Lock className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="mt-6 text-lg font-bold text-slate-900">낙찰 분석 기능 준비 중</h2>
        <p className="mt-2 max-w-md text-center text-sm text-slate-500">
          낙찰 분석은 실내건축 입찰공고 데이터가 충분히 수집된 후 제공될 예정입니다.
          공고 수집이 진행되면 과거 낙찰 데이터를 분석하여 통계와 추이를 확인할 수 있습니다.
        </p>

        <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
            <Database className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-400">분석 공고 수</p>
            <p className="mt-1 text-lg font-bold text-slate-300">-</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
            <BarChart3 className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-400">평균 낙찰률</p>
            <p className="mt-1 text-lg font-bold text-slate-300">--.--%</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-400">낙찰률 예측</p>
            <p className="mt-1 text-lg font-bold text-slate-300">-</p>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-2 rounded-md bg-brand-50 p-4">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <p className="text-sm text-brand-700">
            충분한 낙찰 데이터가 축적되면 분석 및 예측 기능이 활성화됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
