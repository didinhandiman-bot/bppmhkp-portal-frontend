import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AnalyticsSection from '../../components/ekspor/AnalyticsSection';
import DestinationsByProductView from '../../components/ekspor/DestinationsByProductView';
import FilterBar from '../../components/ekspor/FilterBar';
import KpiSection from '../../components/ekspor/KpiSection';
import ProductsByDestinationView from '../../components/ekspor/ProductsByDestinationView';
import {
  fetchKpiSummary,
  fetchMonthlyTrends,
  fetchTopDestinations,
} from '../../services/exportService';
import { useDebounce } from '../../hooks/useDebounce';
import { getDefaultDateRange } from '../../utils/dateRange';
import { toErrorMessage } from '../../utils/errors';
import { normalizeKdUpt } from '../../utils/uptCode';
import type {
  FilterParams,
  KpiSummaryResponse,
  MonthlyTrendItem,
  TopDestinationItem,
} from '../../types/export';

/** Jeda debounce untuk input pencarian (ms). */
const SEARCH_DEBOUNCE_MS = 400;

/** Kunci tab navigasi internal. */
type ViewKey = 'dashboard' | 'produk-tujuan' | 'pasar-produk';

/** Daftar tab navigasi internal. */
const VIEW_TABS: ReadonlyArray<{ key: ViewKey; label: string }> = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'produk-tujuan', label: 'Produk Utama di Negara Tujuan' },
  { key: 'pasar-produk', label: 'Pasar Utama per Produk' },
];

/** Seluruh data ringkasan dashboard yang dimuat bersamaan. */
interface DashboardData {
  kpiSummary: KpiSummaryResponse;
  monthlyTrends: MonthlyTrendItem[];
  topDestinations: TopDestinationItem[];
}

/** Hasil fetch ringkasan beserta kunci filter yang menghasilkannya. */
interface DashboardState {
  /** Kunci filter + nonce yang menghasilkan data ini. */
  key: string;
  data: DashboardData | null;
  errorMessage: string | null;
}

/**
 * Dashboard Ekspor.
 *
 * Menampung tiga tab dengan satu bar filter terpadu di atasnya. State filter
 * disimpan apa adanya (tanpa debounce) agar kontrol tetap responsif; hanya
 * nilai `search` yang didebounce sebelum dikirim ke API.
 */
export const DashboardEkspor: React.FC = () => {
  const [filters, setFilters] = useState<FilterParams>(() => getDefaultDateRange());
  const [activeView, setActiveView] = useState<ViewKey>('dashboard');

  const debouncedSearch = useDebounce(filters.search ?? '', SEARCH_DEBOUNCE_MS);

  /**
   * Mengosongkan filter.search diterapkan seketika, bukan menunggu debounce.
   * Tanpa ini, menghapus kata kunci masih memicu satu request memakai kata
   * kunci lama yang sudah tidak berlaku.
   */
  const searchForApi = (filters.search ?? '').trim() === '' ? '' : debouncedSearch;

  /**
   * Filter efektif untuk API: nilai kosong dibuang, `search` memakai versi
   * hasil debounce, dan `kd_upt` dinormalkan ke kode master.
   */
  const effectiveFilters = useMemo<FilterParams>(() => {
    const result: FilterParams = {};
    if (filters.startDate) result.startDate = filters.startDate;
    if (filters.endDate) result.endDate = filters.endDate;
    if (filters.kd_upt) result.kd_upt = normalizeKdUpt(filters.kd_upt);
    const trimmed = searchForApi.trim();
    if (trimmed !== '') result.search = trimmed;
    return result;
  }, [filters.startDate, filters.endDate, filters.kd_upt, searchForApi]);

  /**
   * State hasil fetch. Sengaja tidak menyimpan flag `isLoading` terpisah:
   * `isLoading` dan `isRefetching` DITURUNKAN dari perbandingan kunci di
   * bawah. Menyimpannya berarti harus memanggil `setIsLoading(true)` di body
   * effect, yang memicu render berlapis dan dilanggar aturan
   * `react-hooks/set-state-in-effect`. Semua setState di sini hanya berjalan
   * di dalam callback async fetch.
   */
  const [dashboardState, setDashboardState] = useState<DashboardState | null>(null);
  /** Dinaikkan saat "Coba Lagi" untuk memaksa fetch ulang pada filter sama. */
  const [reloadNonce, setReloadNonce] = useState<number>(0);

  /**
   * Penanda urutan request agar respons lama tidak menimpa respons baru.
   * Penting saat pengguna mengetik cepat atau berpindah filter beruntun.
   */
  const requestSeq = useRef<number>(0);

  /** Kunci unik untuk permintaan ini: filter efektif + nonce reload. */
  const requestKey = `${effectiveFilters.startDate ?? ''}|${
    effectiveFilters.endDate ?? ''
  }|${effectiveFilters.kd_upt ?? ''}|${effectiveFilters.search ?? ''}|${reloadNonce}`;

  const isCurrentRequest = (requestId: number): boolean => requestId === requestSeq.current;
  useEffect(() => {
    const requestId = ++requestSeq.current;
    const activeFilters = effectiveFilters;

    /**
     * Sengaja TIDAK memakai `.then(x, y)` combined form: kegagalan diAbort/
     * pembatalan harus tetap tercakup agar tidak menjadi unhandled rejection.
     */
    void (async () => {
      try {
        // Dimuat bersamaan agar latensi = request terlama.
        const [kpiSummary, monthlyTrends, topDestinations] = await Promise.all([
          fetchKpiSummary(activeFilters),
          fetchMonthlyTrends(activeFilters),
          fetchTopDestinations({ ...activeFilters, limit: 5 }),
        ]);

        if (isCurrentRequest(requestId)) {
          setDashboardState({
            key: requestKey,
            data: { kpiSummary, monthlyTrends, topDestinations },
            errorMessage: null,
          });
        }
      } catch (error) {
        if (isCurrentRequest(requestId)) {
          setDashboardState({ key: requestKey, data: null, errorMessage: toErrorMessage(error) });
        }
      }
    })();
  }, [effectiveFilters, requestKey]);

  /** "Sedang memuat" = belum ada hasil untuk kunci yang sedang diminta. */
  const isLoading = dashboardState?.key !== requestKey;
  const isCurrent = dashboardState?.key === requestKey;
  /** Data terakhir yang berhasil dimuat; sengaja dipertahankan saat refetch. */
  const dashboardData = dashboardState?.data ?? null;
  const errorMessage = isCurrent ? dashboardState.errorMessage : null;
  /** Muat ulang halus: ada data lama yang masih ditampilkan sambil menunggu. */
  const isRefetching = isLoading && dashboardData !== null;

  const handleRetry = useCallback((): void => {
    setReloadNonce((previous) => previous + 1);
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Ekspor</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ringkasan performa ekspor hasil perikanan: devisa, tonase, dokumen HC, dan
          negara tujuan.
        </p>
      </header>

      {/* Bar filter terpadu, berlaku untuk ketiga tab. */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        isFetching={isRefetching}
      />

      {/* Tab navigasi internal. */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Tab dashboard ekspor">
          {VIEW_TABS.map((tab) => {
            const isActive = activeView === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveView(tab.key)}
                aria-current={isActive ? 'page' : undefined}
                className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {activeView === 'dashboard' ? (
        <div className="space-y-6">
          <KpiSection
            data={dashboardData?.kpiSummary ?? null}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onRetry={handleRetry}
          />

          <AnalyticsSection
            monthlyTrends={dashboardData?.monthlyTrends ?? null}
            topDestinations={dashboardData?.topDestinations ?? null}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onRetry={handleRetry}
          />
        </div>
      ) : null}

      {activeView === 'produk-tujuan' ? (
        <ProductsByDestinationView
          startDate={effectiveFilters.startDate}
          endDate={effectiveFilters.endDate}
          kd_upt={effectiveFilters.kd_upt}
        />
      ) : null}

      {activeView === 'pasar-produk' ? (
        <DestinationsByProductView
          startDate={effectiveFilters.startDate}
          endDate={effectiveFilters.endDate}
          kd_upt={effectiveFilters.kd_upt}
        />
      ) : null}
    </div>
  );
};

export default DashboardEkspor;
