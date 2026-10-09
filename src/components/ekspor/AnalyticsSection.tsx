import { Loader2, TriangleAlert } from 'lucide-react';
import MonthlyTrendChart from './MonthlyTrendChart';
import TopDestinationsBar from './TopDestinationsBar';
import type { MonthlyTrendItem, TopDestinationItem } from '../../types/export';

interface AnalyticsSectionProps {
  /** Deret waktu bulanan untuk dual-axis chart. */
  monthlyTrends: MonthlyTrendItem[] | null;
  /** Peringkat negara tujuan ekspor. */
  topDestinations: TopDestinationItem[] | null;
  /** Status pemuatan data. */
  isLoading?: boolean;
  /** Pesan kesalahan bila pemuatan gagal. */
  errorMessage?: string | null;
  /** Callback opsional untuk mencoba ulang pemuatan data. */
  onRetry?: () => void;
}

/** Judul panel di dalam kontainer analitik. */
function PanelTitle({ children }: { children: string }) {
  return <h3 className="mb-4 text-sm font-semibold text-slate-800">{children}</h3>;
}

/** Kerangka placeholder satu panel saat data belum tersedia. */
function SkeletonPanel({ heightClass }: { heightClass: string }) {
  return <div className={`${heightClass} animate-pulse rounded-lg bg-slate-100`} />;
}

/** Tampilan loading ringkas untuk seluruh kontainer analitik. */
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
        <div className="lg:col-span-7">
          <SkeletonPanel heightClass="h-80" />
        </div>
        <div className="lg:col-span-3">
          <SkeletonPanel heightClass="h-80" />
        </div>
      </div>

      <p className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" aria-hidden="true" />
        Memuat analitik pasar…
      </p>
    </div>
  );
}

/** Tampilan kesalahan dengan tombol coba ulang opsional. */
function AnalyticsError({ message, onRetry }: { message: string; onRetry?: () => void }) {
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

/**
 * Kontainer 2: chart tren bulanan (tonase vs nilai ekspor) berdampingan dengan
 * Top 5 negara tujuan, rasio kolom 70:30.
 */
export default function AnalyticsSection({
  monthlyTrends,
  topDestinations,
  isLoading = false,
  errorMessage = null,
  onRetry,
}: AnalyticsSectionProps) {
  const hasAnyData = Boolean(monthlyTrends || topDestinations);

  return (
    <section
      className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-label="Analitik pasar ekspor"
    >
      {isLoading ? <AnalyticsSkeleton /> : null}

      {!isLoading && errorMessage ? (
        <AnalyticsError message={errorMessage} onRetry={onRetry} />
      ) : null}

      {!isLoading && !errorMessage && !hasAnyData ? (
        <p className="text-sm text-slate-500">Data analitik pasar belum tersedia.</p>
      ) : null}

      {!isLoading && !errorMessage && hasAnyData ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
          <div className="lg:col-span-7">
            <PanelTitle>Tren Bulanan: Tonase vs Nilai Ekspor</PanelTitle>
            <MonthlyTrendChart data={monthlyTrends ?? []} />
          </div>

          <div className="lg:col-span-3">
            <PanelTitle>Top 5 Negara Tujuan</PanelTitle>
            <TopDestinationsBar data={topDestinations ?? []} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
