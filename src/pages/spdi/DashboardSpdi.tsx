import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import SpdiFilterBar from '../../components/spdi/SpdiFilterBar';
import SpdiKbliDonut from '../../components/spdi/SpdiKbliDonut';
import SpdiKpiCards from '../../components/spdi/SpdiKpiCards';
import SpdiProvinsiMap from '../../components/spdi/SpdiProvinsiMap';
import SpdiTable from '../../components/spdi/SpdiTable';
import SpdiTrendChart from '../../components/spdi/SpdiTrendChart';
import SpdiUptComboChart from '../../components/spdi/SpdiUptComboChart';
import { useDebounce } from '../../hooks/useDebounce';
import { getSpdiDashboard, getSpdiList } from '../../services/spdiService';
import { fetchMasterUptOptions } from '../../services/smkhpService';
import { PROVINSI_OPSI } from '../../utils/provinsi';
import { toErrorMessage } from '../../utils/errors';
import type {
  SpdiDashboardData,
  SpdiFilterParams,
  SpdiListData,
  SpdiPagination,
} from '../../types/spdi';
import type { UptOption } from '../../types/upt';

/** Jeda debounce pencarian tabel (ms). */
const SEARCH_DEBOUNCE_MS = 400;

/** Daftar tahun pada dropdown: enam tahun terakhir. */
const TAHUN_OPSI: number[] = Array.from(
  { length: 6 },
  (_, index) => new Date().getFullYear() - index
);

/**
 * Filter dashboard (tanpa pencarian/paginasi): `search`, `page`, dan `limit`
 * hanya berlaku pada `/list`, jadi kunci keduanya dipisah agar mengetik di
 * tabel tidak memicu refetch seluruh grafik.
 */
function dashboardKeyOf(filters: SpdiFilterParams, nonce: number): string {
  return `${filters.kdUpt ?? ''}|${filters.kdProvinsi ?? ''}|${String(filters.tahun ?? '')}|${nonce}`;
}

function listKeyOf(filters: SpdiFilterParams, search: string, nonce: number): string {
  return `${dashboardKeyOf(filters, nonce)}|${search}|${filters.page ?? 1}|${filters.limit ?? 10}`;
}

/** Filter awal: seluruh UPT, seluruh provinsi, seluruh tahun. */
function createInitialFilters(): SpdiFilterParams {
  return {
    kdUpt: '',
    kdProvinsi: '',
    tahun: '',
    search: '',
    page: 1,
    limit: 10,
  };
}

interface DashboardSpdiState {
  key: string;
  data: SpdiDashboardData | null;
  errorMessage: string | null;
}

interface ListSpdiState {
  key: string;
  data: SpdiListData | null;
  errorMessage: string | null;
}

/**
 * Dashboard SPDI Pascapanen (Sistem Pengawasan Distribusi Ikan).
 *
 * Dua endpoint dipanggil paralel namun berkey terpisah: `/dashboard`
 * (KPI + empat grafik + peta, satu request agregat) dan `/list` (direktori
 * unit terpaginasikan). Payload backend memakai envelope
 * `{ success, message, data, meta }`.
 */
export const DashboardSpdi: React.FC = () => {
  const [filters, setFilters] = useState<SpdiFilterParams>(createInitialFilters);
  const [uptOptions, setUptOptions] = useState<UptOption[]>([]);
  const [uptError, setUptError] = useState<string | null>(null);

  /**
   * Pencarian didebounce supaya mengetik tidak memicu satu request per huruf.
   * Nilai kosong langsung dikirim apa adanya agar tidak menunggu debounce.
   */
  const debouncedSearch = useDebounce(filters.search ?? '', SEARCH_DEBOUNCE_MS);
  const searchForApi = (filters.search ?? '').trim() === '' ? '' : debouncedSearch.trim();

  /** Dinaikkan saat "Coba Lagi" agar refetch pada filter yang sama. */
  const [reloadNonce, setReloadNonce] = useState<number>(0);

  const dashboardKey = dashboardKeyOf(filters, reloadNonce);
  const listKey = listKeyOf(filters, searchForApi, reloadNonce);

  const [dashState, setDashState] = useState<DashboardSpdiState | null>(null);
  const [listState, setListState] = useState<ListSpdiState | null>(null);

  /** Penanda urutan request: respons lama tidak boleh menimpa respons baru. */
  const dashSeq = useRef<number>(0);
  const listSeq = useRef<number>(0);

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
          setUptError(toErrorMessage(error));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const requestId = ++dashSeq.current;
    const activeFilters: SpdiFilterParams = {
      kdUpt: filters.kdUpt,
      kdProvinsi: filters.kdProvinsi,
      tahun: filters.tahun,
    };

    void (async () => {
      try {
        const data = await getSpdiDashboard(activeFilters);
        if (requestId !== dashSeq.current) return;
        setDashState({ key: dashboardKey, data, errorMessage: null });
      } catch (error) {
        if (requestId !== dashSeq.current) return;
        setDashState({
          key: dashboardKey,
          data: null,
          errorMessage: toErrorMessage(error),
        });
      }
    })();
  }, [dashboardKey, filters.kdUpt, filters.kdProvinsi, filters.tahun]);

  useEffect(() => {
    const requestId = ++listSeq.current;
    const activeFilters: SpdiFilterParams = {
      kdUpt: filters.kdUpt,
      kdProvinsi: filters.kdProvinsi,
      tahun: filters.tahun,
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
    };
    if (searchForApi !== '') activeFilters.search = searchForApi;

    void (async () => {
      try {
        const data = await getSpdiList(activeFilters);
        if (requestId !== listSeq.current) return;
        setListState({ key: listKey, data, errorMessage: null });
      } catch (error) {
        if (requestId !== listSeq.current) return;
        setListState({
          key: listKey,
          data: null,
          errorMessage: toErrorMessage(error),
        });
      }
    })();
  }, [
    listKey,
    filters.kdUpt,
    filters.kdProvinsi,
    filters.tahun,
    filters.page,
    filters.limit,
    searchForApi,
  ]);

  /**
   * `isLoading` DITURUNKAN dari perbandingan kunci, bukan disimpan sebagai
   * state terpisah (aturan `react-hooks/set-state-in-effect`): semua `setState`
   * hanya berjalan di dalam callback async.
   */
  const isDashboardLoading = dashState?.key !== dashboardKey;
  const isListLoading = listState?.key !== listKey;
  const dashboard = dashState?.data ?? null;
  const list = listState?.data ?? null;
  const dashboardError = dashState?.key === dashboardKey ? dashState.errorMessage : null;
  const listError = listState?.key === listKey ? listState.errorMessage : null;
  const isRefetching = isDashboardLoading && dashState !== null;

  const errorMessage = useMemo(
    () => dashboardError ?? listError,
    [dashboardError, listError]
  );

  const handleRetry = (): void => {
    setReloadNonce((previous) => previous + 1);
  };

  const emptyPagination: SpdiPagination = useMemo(
    () => ({ total: 0, page: 1, limit: 10, totalPages: 1 }),
    []
  );

  /** Klik provinsi pada peta memasang filter; klik kode sama melepasnya. */
  const handleMapSelect = useCallback((kdProvinsi: string): void => {
    setFilters((prev) => ({
      ...prev,
      kdProvinsi: prev.kdProvinsi === kdProvinsi ? '' : kdProvinsi,
      page: 1,
    }));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Pasca Panen</span>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-cyan-700">SPDI</span>
        </nav>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Dashboard SPDI (Sistem Pengawasan Distribusi Ikan)
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Ringkasan penerbitan sertifikat, skor inspeksi &amp; CDIB, SLA penerbitan, sebaran
          sektor usaha (KBLI), kontribusi UPT, dan direktori unit SPDI.
        </p>
      </header>

      <SpdiFilterBar
        filters={filters}
        onFilterChange={setFilters}
        uptOptions={uptOptions}
        isLoadingUpt={uptOptions.length === 0 && uptError === null}
        provinsiOptions={PROVINSI_OPSI}
        tahunOptions={TAHUN_OPSI}
        isFetching={isRefetching || (isListLoading && listState !== null)}
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

      <SpdiKpiCards data={dashboard?.metrics ?? null} isLoading={isDashboardLoading} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SpdiTrendChart data={dashboard?.monthlyTrend ?? null} isLoading={isDashboardLoading} />
        <SpdiKbliDonut
          data={dashboard?.kbliDistribution ?? null}
          isLoading={isDashboardLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SpdiUptComboChart data={dashboard?.byUpt ?? null} isLoading={isDashboardLoading} />
        <SpdiProvinsiMap
          data={dashboard?.byProvinsi ?? null}
          isLoading={isDashboardLoading}
          dataKey={dashboardKey}
          onSelectProvinsi={handleMapSelect}
        />
      </div>

      <SpdiTable
        items={list?.items ?? null}
        pagination={list?.pagination ?? emptyPagination}
        isLoading={isListLoading}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setFilters((prev) => ({ ...prev, limit, page: 1 }))}
        search={filters.search ?? ''}
        onSearchChange={(search) => setFilters((prev) => ({ ...prev, search, page: 1 }))}
      />
    </div>
  );
};

export default DashboardSpdi;
