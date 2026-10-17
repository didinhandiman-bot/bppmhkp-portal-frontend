import { toErrorMessage } from '../utils/errors';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DashboardFilterBar from '../components/dashboard/DashboardFilterBar';
import DashboardMetricCards from '../components/dashboard/DashboardMetricCards';
import DashboardRecentActivities from '../components/dashboard/DashboardRecentActivities';
import DashboardTrendChart from '../components/dashboard/DashboardTrendChart';
import DashboardUptBars from '../components/dashboard/DashboardUptBars';
import { fetchDashboardOverview } from '../services/dashboardService';
import { fetchMasterUptOptions } from '../services/smkhpService';
import { useAuth } from '../hooks/useAuth';
import type { DashboardDatePreset, DashboardOverview } from '../types/dashboard';
import type { UptOption } from '../types/upt';

/** Tanggal hari ini dalam format `YYYY-MM-DD` di zona waktu lokal. */
function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Rentang default "Tahun Ini (YTD)".
 *
 * Tanpa filter tanggal, ketiga repository backend menghitung agregat atas SELURUH
 * tabel tanpa batas bawah, jadi halaman akan menampilkan angka sejak 2017 dan
 * tidak bisa dianggap sebagai ringkasan eksekutif saat ini.
 */
function createDefaultRange(): { startDate: string; endDate: string } {
  const today = new Date();
  return {
    startDate: `${today.getFullYear()}-01-01`,
    endDate: toDateInput(today),
  };
}

/** Rentang "Bulan Ini": hari pertama sampai hari ini. */
function createMonthRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return { startDate: toDateInput(start), endDate: toDateInput(today) };
}

/** Seluruh data dashboard beserta kunci filter penghasilnya. */
interface DashboardPageState {
  /** Kunci filter + nonce yang menghasilkan data ini. */
  key: string;
  overview: DashboardOverview | null;
  errorMessage: string | null;
}

/**
 * Dashboard ringkasan eksekutif lintas pilar (Ekspor, Pasca Panen, Primer).
 *
 * Sapaan pengguna tetap dipegang `DashboardLayout`; halaman ini hanya memuat
 * judul, filter, angka, dan visualisasinya.
 */
export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const defaultRange = useMemo(() => createDefaultRange(), []);
  const [preset, setPreset] = useState<DashboardDatePreset>('ytd');
  const [selectedUpt, setUptId] = useState<string>('');
  const nationalAccess = user?.isNationalAccess === true;
  const uptId = nationalAccess ? selectedUpt : user?.kdUnit ?? '';
  const [customStart, setCustomStart] = useState<string>(defaultRange.startDate);
  const [customEnd, setCustomEnd] = useState<string>(defaultRange.endDate);

  const [uptOptions, setUptOptions] = useState<UptOption[]>([]);
  const [uptError, setUptError] = useState<string | null>(null);

  /**
   * Rentang yang benar-benar dikirim. Preset siap pakai menentukan rentang di
   * sini (bukan di event handler) supaya pilihan dropdown dan query string
   * tidak mungkin berbeda.
   */
  const activeRange = useMemo(() => {
    if (preset === 'bulan-ini') return createMonthRange();
    if (preset === 'custom') {
      return { startDate: customStart, endDate: customEnd };
    }
    return defaultRange;
  }, [preset, customStart, customEnd, defaultRange]);

  const [state, setState] = useState<DashboardPageState | null>(null);
  /** Dinaikkan saat "Coba Lagi" agar refetch pada filter yang sama. */
  const [reloadNonce, setReloadNonce] = useState<number>(0);
  /** Penanda urutan request: respons lama tidak boleh menimpa respons baru. */
  const requestSeq = useRef<number>(0);

  const requestKey = `${activeRange.startDate}|${activeRange.endDate}|${uptId}|${reloadNonce}`;

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
    const filters = { startDate: activeRange.startDate, endDate: activeRange.endDate, uptId };

    void (async () => {
      try {
        const overview = await fetchDashboardOverview(filters);
        if (requestId !== requestSeq.current) return;
        setState({ key: requestKey, overview, errorMessage: null });
      } catch (error) {
        if (requestId !== requestSeq.current) return;
        setState({
          key: requestKey,
          overview: null,
          errorMessage: toErrorMessage(error),
        });
      }
    })();
  }, [activeRange, uptId, requestKey, requestSeq]);

  /**
   * `isLoading` DITURUNKAN dari perbandingan kunci, bukan disimpan sebagai
   * state terpisah, supaya `setState` hanya jalan di dalam callback async.
   * Data lama tetap tampil saat refetch dengan penanda "memuat ulang".
   */
  const isLoading = state?.key !== requestKey;
  const isCurrent = state?.key === requestKey;
  const overview = isCurrent ? state?.overview ?? null : null;
  const errorMessage = isCurrent ? state.errorMessage : null;
  const isRefetching = isLoading && state !== null;

  const handleRetry = useCallback((): void => {
    setReloadNonce((previous) => previous + 1);
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Ringkasan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ringkasan eksekutif lintas pilar {user?.nama ? `untuk ${user.nama}` : ''}
          : ekspor, sertifikasi pasca panen, dan sertifikasi primer.
        </p>
      </header>

      <DashboardFilterBar
        preset={preset}
        onPresetChange={setPreset}
        startDate={preset === 'custom' ? customStart : activeRange.startDate}
        endDate={preset === 'custom' ? customEnd : activeRange.endDate}
        onStartDateChange={setCustomStart}
        onEndDateChange={setCustomEnd}
        uptId={uptId}
        onUptChange={setUptId}
        allowNational={nationalAccess}
        uptOptions={nationalAccess ? uptOptions : [{ value: uptId, label: uptOptions.find(option => option.value === uptId)?.label || 'UPT akun (' + uptId + ')', kota: '' }]}
        isLoadingUpt={uptOptions.length === 0 && uptError === null}
        defaultRange={defaultRange}
        isFetching={isRefetching}
      />

      {uptError !== null ? (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
        >
          Daftar UPT tidak dapat dimuat ({uptError}). Filter UPT mungkin tidak lengkap.
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

      {overview?.scope?.kapalIncluded === false ? (
        <p role="status" className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Data Primer mencakup kota/kabupaten wilayah UPT terpilih. Sertifikat kapal belum termasuk dalam ringkasan ini.
        </p>
      ) : null}

      <DashboardMetricCards scopeLimited={!nationalAccess || uptId !== ''} data={overview?.summaryKpi ?? null} isLoading={isLoading} />

      <DashboardTrendChart data={overview?.monthlyTrends ?? null} isLoading={isLoading} />

      <DashboardUptBars data={overview?.uptDistribution ?? null} isLoading={isLoading} />

      <DashboardRecentActivities items={overview?.recentActivities ?? null} isLoading={isLoading} />
    </div>
  );
};

export default DashboardPage;