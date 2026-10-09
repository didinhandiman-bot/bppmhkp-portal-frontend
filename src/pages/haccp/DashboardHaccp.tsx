import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import HaccpDonutChart from '../../components/haccp/HaccpDonutChart';
import HaccpFilterBar from '../../components/haccp/HaccpFilterBar';
import HaccpKpiCards from '../../components/haccp/HaccpKpiCards';
import HaccpTable from '../../components/haccp/HaccpTable';
import HaccpTopBars from '../../components/haccp/HaccpTopBars';
import HaccpTrendChart from '../../components/haccp/HaccpTrendChart';
import { useDebounce } from '../../hooks/useDebounce';
import { getHaccpCharts, getHaccpKpi, getHaccpTable } from '../../services/haccpService';
import { fetchMasterUptOptions } from '../../services/smkhpService';
import { HACCP_KOSONG } from '../../types/haccp';
import type {
  HaccpChartsData,
  HaccpFilterParams,
  HaccpKpiData,
  HaccpTableData,
} from '../../types/haccp';
import type { UptOption } from '../../types/upt';

/** Jeda debounce pencarian tabel (ms). */
const SEARCH_DEBOUNCE_MS = 400;

/** Palet warna untuk donut; label di luar daftar memakai abu-abu. */
const WARNA_DONUT = [
  '#0891b2',
  '#2563eb',
  '#16a34a',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
] as const;

/**
 * Periode default: seluruh tahun berjalan.
 *
 * Backend membandingkan `tgl_terbit` dengan rentang inklusif (`BETWEEN`), dan
 * tanpa filter tanggal halaman akan menampilkan SELURUH riwayat — termasuk
 * beberapa tahun sekaligus. Karena itu rentang tahun berjalan selalu dikirim.
 */
function createDefaultRange(): { startDate: string; endDate: string } {
  const year = new Date().getFullYear();
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  };
}

/** Filter awal: periode tahun berjalan, tanpa pembatasan lain. */
function createInitialFilters(): HaccpFilterParams {
  return {
    ...createDefaultRange(),
    kdUpt: '',
    grade: '',
    statusSert: '',
    search: '',
    page: 1,
    limit: 10,
  };
}

/** Seluruh data HACCP yang dimuat bersama, beserta kunci filter penghasilnya. */
interface HaccpDashboardState {
  /** Kunci filter + nonce yang menghasilkan data ini. */
  key: string;
  kpi: HaccpKpiData | null;
  charts: HaccpChartsData | null;
  table: HaccpTableData | null;
  errorMessage: string | null;
}

/**
 * Dashboard HACCP (Hazard Analysis and Critical Control Point).
 *
 * Satu bar filter mengatur ketiga endpoint sekaligus. Semuanya dimuat paralel
 * dengan `Promise.all`, sehingga latensi total sama dengan request terlama.
 * Endpoint `/charts` sendiri sudah aggregating tujuh query secara paralel di
 * sisi backend, sehingga lima grafik tetap cukup satu request.
 */
export const DashboardHaccp: React.FC = () => {
  const defaultRange = useMemo(() => createDefaultRange(), []);
  const [filters, setFilters] = useState<HaccpFilterParams>(createInitialFilters);
  const [uptOptions, setUptOptions] = useState<UptOption[]>([]);
  const [uptError, setUptError] = useState<string | null>(null);

  /**
   * Pencarian didebounce supaya mengetik tidak memicu satu request per huruf.
   * Nilai kosong langsung dikirim apa adanya agar tidak menunggu debounce —
   * tanpa ini, menghapus kata kunci masih memicu request dengan teks lama.
   */
  const debouncedSearch = useDebounce(filters.search ?? '', SEARCH_DEBOUNCE_MS);
  const searchForApi = (filters.search ?? '').trim() === '' ? '' : debouncedSearch.trim();

  /** Filter bersih yang dikirim ke service: nilai kosong dibuang seluruhnya. */
  const effectiveFilters = useMemo<HaccpFilterParams>(() => {
    const result: HaccpFilterParams = {
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
    };
    if (filters.startDate) result.startDate = filters.startDate;
    if (filters.endDate) result.endDate = filters.endDate;
    if (filters.kdUpt) result.kdUpt = filters.kdUpt;
    if (filters.grade) result.grade = filters.grade;
    if (filters.statusSert) result.statusSert = filters.statusSert;
    if (searchForApi !== '') result.search = searchForApi;
    return result;
  }, [
    filters.startDate,
    filters.endDate,
    filters.kdUpt,
    filters.grade,
    filters.statusSert,
    filters.page,
    filters.limit,
    searchForApi,
  ]);

  const [state, setState] = useState<HaccpDashboardState | null>(null);
  /** Dinaikkan saat "Coba Lagi" agar refetch pada filter yang sama. */
  const [reloadNonce, setReloadNonce] = useState<number>(0);
  /** Penanda urutan request: respons lama tidak boleh menimpa respons baru. */
  const requestSeq = useRef<number>(0);

  const requestKey = `${effectiveFilters.startDate ?? ''}|${
    effectiveFilters.endDate ?? ''
  }|${effectiveFilters.kdUpt ?? ''}|${effectiveFilters.grade ?? ''}|${
    effectiveFilters.statusSert ?? ''
  }|${effectiveFilters.search ?? ''}|${effectiveFilters.page ?? 1}|${
    effectiveFilters.limit ?? 10
  }|${reloadNonce}`;

  // Master UPT dimuat sekali; tidak bergantung filter apa pun.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const options = await fetchMasterUptOptions();
        if (!cancelled) {
          setUptOptions(options);
          setUptError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setUptError(error instanceof Error ? error.message : 'Gagal memuat daftar UPT');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const requestId = ++requestSeq.current;
    const activeFilters = effectiveFilters;

    void (async () => {
      try {
        const [kpi, charts, table] = await Promise.all([
          getHaccpKpi(activeFilters),
          getHaccpCharts(activeFilters),
          getHaccpTable(activeFilters),
        ]);

        if (requestId !== requestSeq.current) return;
        setState({ key: requestKey, kpi, charts, table, errorMessage: null });
      } catch (error) {
        if (requestId !== requestSeq.current) return;
        setState({
          key: requestKey,
          kpi: null,
          charts: null,
          table: null,
          errorMessage: error instanceof Error ? error.message : 'Gagal memuat data HACCP',
        });
      }
    })();
  }, [effectiveFilters, requestKey, requestSeq]);

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
  const kpi = state?.kpi ?? null;
  const charts = state?.charts ?? null;
  const table = state?.table ?? null;
  const errorMessage = isCurrent ? state.errorMessage : null;
  const isRefetching = isLoading && state !== null;

  const handleRetry = useCallback((): void => {
    setReloadNonce((previous) => previous + 1);
  }, []);

  /**
   * Opsi grade diturunkan dari sebaran grade pada grafik, karena backend tidak
   * menyediakan endpoint daftar grade dan nilainya bebas (bukan hanya A/B/C).
   * Grade yang sedang difilter tetap ikut ditampilkan walau hasil aggregat
   * berikutnya tidak memuatnya — tanpa itu, memilih grade akan menghapus
   * opsi yang sedang aktif dari dropdown.
   */
  const gradeOptions = useMemo<string[]>(() => {
    const options = new Set<string>();

    for (const row of charts?.gradeDistribution ?? []) {
      const grade = row.grade.trim();
      if (grade !== '' && grade !== HACCP_KOSONG) options.add(grade.toUpperCase());
    }

    const selected = filters.grade?.trim() ?? '';
    if (selected !== '' && selected !== HACCP_KOSONG) options.add(selected.toUpperCase());

    return Array.from(options).sort((a, b) => a.localeCompare(b, 'id-ID'));
  }, [charts?.gradeDistribution, filters.grade]);

  /** Deret `{ label, total }` dari payload chart untuk komponen grafik. */
  const gradeRows = useMemo(
    () => (charts?.gradeDistribution ?? []).map((row) => ({ label: row.grade, total: row.total })),
    [charts?.gradeDistribution]
  );
  const statusProdukRows = useMemo(
    () => (charts?.statusProduk ?? []).map((row) => ({ label: row.status_produk, total: row.total })),
    [charts?.statusProduk]
  );
  const kategoriRows = useMemo(
    () => (charts?.kategoriProduk ?? []).map((row) => ({ label: row.nama_kategori, total: row.total })),
    [charts?.kategoriProduk]
  );
  const investmentRows = useMemo(
    () =>
      (charts?.investmentDistribution ?? []).map((row) => ({
        label: row.investment,
        total: row.total,
      })),
    [charts?.investmentDistribution]
  );
  const topProdukRows = useMemo(
    () => (charts?.topProduk ?? []).map((row) => ({ label: row.nama_produk, total: row.total })),
    [charts?.topProduk]
  );
  const topUptRows = useMemo(
    () => (charts?.topUpt ?? []).map((row) => ({ label: row.upt, total: row.total })),
    [charts?.topUpt]
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard HACCP</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ringkasan Hazard Analysis and Critical Control Point: jumlah penerbitan sertifikat,
          masa berlaku, UPI tersertifikasi, tren, dan sebaran produk.
        </p>
      </header>

      <HaccpFilterBar
        filters={filters}
        onFilterChange={setFilters}
        uptOptions={uptOptions}
        isLoadingUpt={uptOptions.length === 0 && uptError === null}
        gradeOptions={gradeOptions}
        defaultRange={defaultRange}
        isFetching={isRefetching}
      />

      {uptError !== null ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
        >
          <span>Daftar UPT tidak dapat dimuat ({uptError}). Filter UPT mungkin tidak lengkap.</span>
        </div>
      ) : null}

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

      <HaccpKpiCards data={kpi} isLoading={isLoading} />

      <HaccpTrendChart data={charts?.monthlyTrend ?? null} isLoading={isLoading} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <HaccpTopBars
          data={topProdukRows}
          isLoading={isLoading}
          title="Top 10 Produk"
          description="Produk dengan sertifikat HACCP terbanyak"
          titleId="haccp-top-produk-title"
          color="#0891b2"
          valueLabel="Sertifikat"
          emptyMessage="Belum ada data produk pada periode yang dipilih."
        />
        <HaccpTopBars
          data={topUptRows}
          isLoading={isLoading}
          title="Top 10 UPT"
          description="UPT dengan sertifikat HACCP terbanyak"
          titleId="haccp-top-upt-title"
          color="#16a34a"
          valueLabel="Sertifikat"
          emptyMessage="Belum ada data UPT pada periode yang dipilih."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <HaccpDonutChart
          data={gradeRows}
          isLoading={isLoading}
          title="Distribusi Grade"
          description="Sebaran sertifikat per grade"
          titleId="haccp-grade-title"
          colors={WARNA_DONUT}
          valueLabel="Sertifikat"
          emptyMessage="Belum ada data grade pada periode yang dipilih."
        />
        <HaccpDonutChart
          data={kategoriRows}
          isLoading={isLoading}
          title="Distribusi Kategori Produk"
          description="Sebaran sertifikat per kategori produk"
          titleId="haccp-kategori-title"
          colors={WARNA_DONUT}
          valueLabel="Sertifikat"
          emptyMessage="Belum ada data kategori pada periode yang dipilih."
        />
        <HaccpDonutChart
          data={statusProdukRows}
          isLoading={isLoading}
          title="Status Produk"
          description="Sebaran sertifikat per status produk"
          titleId="haccp-status-produk-title"
          colors={WARNA_DONUT}
          valueLabel="Sertifikat"
          emptyMessage="Belum ada data status produk pada periode yang dipilih."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <HaccpDonutChart
          data={investmentRows}
          isLoading={isLoading}
          title="Distribusi Investasi"
          description="Sebaran sertifikat per nilai investasi"
          titleId="haccp-investasi-title"
          colors={WARNA_DONUT}
          valueLabel="Sertifikat"
          emptyMessage="Belum ada data investasi pada periode yang dipilih."
        />
        <section
          aria-labelledby="haccp-ringkasan-title"
          className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-2 flex flex-col gap-1">
            <h3 id="haccp-ringkasan-title" className="text-base font-semibold text-slate-900">
              Ringkasan Periode
            </h3>
            <p className="text-xs text-slate-500">Cakupan filter yang sedang aktif</p>
          </div>

          <dl className="mt-2 flex flex-1 flex-col gap-2 text-sm">
            {[
              { label: 'Mulai', value: filters.startDate || '-' },
              { label: 'Selesai', value: filters.endDate || '-' },
              {
                label: 'UPT',
                value:
                  filters.kdUpt === '' || filters.kdUpt === undefined
                    ? 'Semua UPT'
                    : (uptOptions.find((option) => option.value === filters.kdUpt)?.label ??
                      filters.kdUpt),
              },
              { label: 'Grade', value: filters.grade === '' || filters.grade === undefined ? 'Semua Grade' : `Grade ${filters.grade}` },
              {
                label: 'Status',
                value:
                  filters.statusSert === '' || filters.statusSert === undefined
                    ? 'Semua Status'
                    : filters.statusSert === 'BERLAKU'
                      ? 'Berlaku'
                      : 'Kadaluarsa',
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
              >
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {row.label}
                </dt>
                <dd className="truncate text-sm font-medium text-slate-800">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <HaccpTable
        items={table?.items ?? null}
        pagination={table?.pagination ?? null}
        isLoading={isLoading}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setFilters((prev) => ({ ...prev, limit, page: 1 }))}
        search={filters.search ?? ''}
        onSearchChange={(search) => setFilters((prev) => ({ ...prev, search, page: 1 }))}
      />
    </div>
  );
};

export default DashboardHaccp;