import { Loader2, TriangleAlert } from 'lucide-react';
import HeroInsightCard from './HeroInsightCard';
import KpiCardGrid from './KpiCardGrid';
import type { KpiSummaryResponse } from '../../types/export';

interface KpiSectionProps {
  /** Data KPI yang sudah dimuat; `null` saat masih loading. */
  data: KpiSummaryResponse | null;
  /** Status pemuatan data. */
  isLoading?: boolean;
  /** Pesan kesalahan bila pemuatan gagal. */
  errorMessage?: string | null;
  /** Callback opsional untuk mencoba ulang pemuatan data. */
  onRetry?: () => void;
}

/** Kerangka satu kartu placeholder saat data belum tersedia. */
function SkeletonCard() {
  return (
    <div className="flex animate-pulse flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="h-9 w-9 rounded-md bg-slate-100" />
      <div className="space-y-2">
        <div className="h-3 w-2/3 rounded bg-slate-100" />
        <div className="h-6 w-1/2 rounded bg-slate-100" />
        <div className="h-3 w-3/4 rounded bg-slate-100" />
      </div>
    </div>
  );
}

/** Tampilan loading ringkas: skeleton hero + grid kartu. */
function KpiSectionSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <div className="flex animate-pulse flex-col gap-3">
        <div className="h-3 w-40 rounded bg-slate-100" />
        <div className="h-10 w-72 rounded bg-slate-100" />
        <div className="h-4 w-48 rounded bg-slate-100" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <p className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" aria-hidden="true" />
        Memuat data performa ekspor…
      </p>
    </div>
  );
}

/** Tampilan kesalahan dengan tombol coba ulang opsional. */
function KpiSectionError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="flex flex-col items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <div className="flex items-start gap-2 text-sm text-rose-700">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{message}</span>
      </div>

      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-md border border-rose-300 px-3 py-1.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
        >
          Coba lagi
        </button>
      ) : null}
    </div>
  );
}

/** Kontainer 1: kartu hero (Total Devisa) + grid kartu KPI. */
export default function KpiSection({
  data,
  isLoading = false,
  errorMessage = null,
  onRetry,
}: KpiSectionProps) {
  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-label="Ringkasan KPI ekspor"
    >
      {isLoading ? <KpiSectionSkeleton /> : null}

      {!isLoading && errorMessage ? (
        <KpiSectionError message={errorMessage} onRetry={onRetry} />
      ) : null}

      {!isLoading && !errorMessage && data ? (
        <div className="flex flex-col gap-6">
          <HeroInsightCard heroInsight={data.heroInsight} />

          <div className="h-px w-full bg-slate-200" aria-hidden="true" />

          <KpiCardGrid kpiCards={data.kpiCards} />
        </div>
      ) : null}

      {!isLoading && !errorMessage && !data ? (
        <p className="text-sm text-slate-500">Data KPI belum tersedia.</p>
      ) : null}
    </section>
  );
}
