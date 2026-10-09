import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SkpFilterBar from '../../components/skp/SkpFilterBar';
import SkpGradeDonut from '../../components/skp/SkpGradeDonut';
import SkpKpiCards from '../../components/skp/SkpKpiCards';
import SkpTable from '../../components/skp/SkpTable';
import SkpTopBars from '../../components/skp/SkpTopBars';
import SkpTrendsChart from '../../components/skp/SkpTrendsChart';
import { useDebounce } from '../../hooks/useDebounce';
import { deriveProvinsiOptions } from '../../utils/skpProvinsi';
import {
  getSkpDistribution,
  getSkpList,
  getSkpSummary,
  getSkpTrends,
} from '../../services/skpService';
import type {
  SkpDistributionData,
  SkpFilterParams,
  SkpListData,
  SkpSummaryData,
  SkpTrendsData,
} from '../../types/skp';

/** Jeda debounce pencarian tabel (ms). */
const SEARCH_DEBOUNCE_MS = 400;

/** Semua data SKP yang dimuat bersama, beserta kunci filter penghasilnya. */
interface SkpDashboardState {
  /** Kunci filter + nonce yang menghasilkan data ini. */
  key: string;
  summary: SkpSummaryData | null;
  trends: SkpTrendsData | null;
  distribution: SkpDistributionData | null;
  list: SkpListData | null;
  errorMessage: string | null;
}

/** Filter awal: tahun berjalan, tanpa pembatasan lain. */
function createInitialFilters(): SkpFilterParams {
  return {
    year: new Date().getFullYear(),
    provinsiId: '',
    skalaUsaha: '',
    peringkat: '',
    search: '',
    status: 'semua',
    page: 1,
    limit: 10,
  };
}

/**
 * Dashboard SKP (Standar Kompetensi Producer).
 *
 * Satu bar filterglobal mengatur keempat endpoint sekaligus. Keempatnya
 * dimuat paralel memakai `Promise.all`, sehingga latensi total sama dengan
 * request terlama.
 */
export const DashboardSkp: React.FC = () => {
  const [filters, setFilters] = useState<SkpFilterParams>(createInitialFilters);

  /**
   * Pencarian didebounce supaya mengetik tidak memicu satu request per huruf.
   * Nilai kosong langsung dikirim apa adanya agar tidak menunggu debounce —
   * tanpa ini, menghapus kata kunci masih memicu request dengan teks lama.
   */
  const debouncedSearch = useDebounce(filters.search ?? '', SEARCH_DEBOUNCE_MS);
  const searchForApi = (filters.search ?? '').trim() === '' ? '' : debouncedSearch;

  /** Filter bersih yang dikirim ke service: nilai kosong dibuang seluruhnya. */
  const effectiveFilters = useMemo<SkpFilterParams>(() => {
    const result: SkpFilterParams = {
      year: filters.year ?? new Date().getFullYear(),
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
    };
    if (filters.provinsiId) result.provinsiId = filters.provinsiId;
    if (filters.skalaUsaha) result.skalaUsaha = filters.skalaUsaha;
    if (filters.peringkat) result.peringkat = filters.peringkat;
    if (filters.status) result.status = filters.status;
    const trimmed = searchForApi.trim();
    if (trimmed !== '') result.search = trimmed;
    return result;
  }, [
    filters.year,
    filters.provinsiId,
    filters.skalaUsaha,
    filters.peringkat,
    filters.status,
    filters.page,
    filters.limit,
    searchForApi,
  ]);

  const [state, setState] = useState<SkpDashboardState | null>(null);
  /** Dinaikkan saat "Coba Lagi" agar refetch pada filter yang sama. */
  const [reloadNonce, setReloadNonce] = useState<number>(0);
  /** Penanda urutan request: respons lama tidak boleh menimpa respons baru. */
  const requestSeq = useRef<number>(0);

  const requestKey = `${effectiveFilters.year ?? ''}|${effectiveFilters.provinsiId ?? ''}|${
    effectiveFilters.skalaUsaha ?? ''
  }|${effectiveFilters.peringkat ?? ''}|${effectiveFilters.status ?? 'semua'}|${
    effectiveFilters.search ?? ''
  }|${effectiveFilters.page ?? 1}|${effectiveFilters.limit ?? 10}|${reloadNonce}`;

  useEffect(() => {
    const requestId = ++requestSeq.current;
    const activeFilters = effectiveFilters;

    void (async () => {
      try {
        const [summary, trends, distribution, list] = await Promise.all([
          getSkpSummary(activeFilters),
          getSkpTrends(activeFilters),
          getSkpDistribution(activeFilters),
          getSkpList(activeFilters),
        ]);

        if (requestId !== requestSeq.current) return;
        setState({ key: requestKey, summary, trends, distribution, list, errorMessage: null });
      } catch (error) {
        if (requestId !== requestSeq.current) return;
        setState({
          key: requestKey,
          summary: null,
          trends: null,
          distribution: null,
          list: null,
          errorMessage: error instanceof Error ? error.message : 'Gagal memuat data SKP',
        });
      }
    })();
  }, [effectiveFilters, requestKey]);

  /**
   * `isLoading` DITURUNKAN dari perbandingan kunci, bukan disimpan sebagai
   * state terpisah. Menyimpan flag itu berarti `setIsLoading(true)` dipanggil
   * sinkron di dalam effect, yang memicu render berlapis dan dilanggar aturan
   * `react-hooks/set-state-in-effect`. Dengan kunci, semua `setState` hanya
   * berjalan di dalam callback async.
   */
  const isLoading = state?.key !== requestKey;
  const isCurrent = state?.key === requestKey;
  /** Data lama tetap ditampilkan saat refetch, ditandai dengan "memuat ulang". */
  const summary = state?.summary ?? null;
  const trends = state?.trends ?? null;
  const distribution = state?.distribution ?? null;
  const list = state?.list ?? null;
  const errorMessage = isCurrent ? state.errorMessage : null;
  const isRefetching = isLoading && state !== null;

  const handleRetry = useCallback((): void => {
    setReloadNonce((previous) => previous + 1);
  }, []);

  const provinsiOptions = useMemo(
    () => deriveProvinsiOptions(list?.items ?? []),
    [list]
  );

  const tahun = effectiveFilters.year ?? new Date().getFullYear();
  const tahunSebelumnya = trends?.previousYear || summary?.previousYear || tahun - 1;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard SKP</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ringkasan Standar Kompetensi Producer: jumlah penerbitan, masa berlaku sertifikat,
          UPI tersertifikasi, tren, dan sebaran peringkat.
        </p>
      </header>

      <SkpFilterBar
        filters={filters}
        onFilterChange={setFilters}
        provinsiOptions={provinsiOptions}
        isLoadingProvinsi={isLoading && provinsiOptions.length === 0}
        isFetching={isRefetching}
      />

      {errorMessage !== null ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            Coba Lagi
          </button>
        </div>
      ) : null}

      <SkpKpiCards data={summary} isLoading={isLoading} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SkpTrendsChart
            data={trends?.data ?? null}
            isLoading={isLoading}
            year={tahun}
            previousYear={tahunSebelumnya}
          />
        </div>
        <SkpGradeDonut
          data={distribution?.byPeringkat ?? null}
          isLoading={isLoading}
          year={distribution?.year || tahun}
        />
      </div>

      <SkpTopBars
        wilayah={distribution?.topWilayah ?? null}
        jenisOlahan={distribution?.topJenisOlahan ?? null}
        isLoading={isLoading}
        year={distribution?.year || tahun}
      />

      <SkpTable
        items={list?.items ?? null}
        pagination={list?.pagination ?? null}
        isLoading={isLoading}
        statusFilter={filters.status ?? 'semua'}
        onStatusFilterChange={(status) => setFilters((prev) => ({ ...prev, status, page: 1 }))}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setFilters((prev) => ({ ...prev, limit, page: 1 }))}
        search={filters.search ?? ''}
        onSearchChange={(search) => setFilters((prev) => ({ ...prev, search, page: 1 }))}
      />
    </div>
  );
};

export default DashboardSkp;
