import { useEffect, useState } from 'react';
import { Loader2, RotateCcw, Search } from 'lucide-react';
import { fetchMasterUptOptions } from '../../services/smkhpService';
import { getDefaultDateRange } from '../../utils/dateRange';
import { normalizeKdUpt } from '../../utils/uptCode';
import type { FilterParams } from '../../types/export';
import type { UptOption } from '../../types/upt';

interface FilterBarProps {
  /** Nilai filter yang sedang aktif. */
  filters: FilterParams;
  /**
   * Dipanggil setiap kali filter berubah dengan objek filter lengkap
   * (nilai kosong dihapus agar tidak dikirim ke API).
   */
  onFilterChange: (newFilters: FilterParams) => void;
  /** Menandai sedang ada proses pengambilan data (untuk indikator halus). */
  isFetching?: boolean;
}

const dateInputClass =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20';

const selectClass =
  'w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 sm:w-auto disabled:cursor-not-allowed disabled:opacity-60';

/** Panah dropdown kecil sebagai latar select (menghindari dependensi ikon tambahan). */
const selectStyle = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.5rem center',
} as const;

/**
 * Bar filter terpadu untuk Dashboard Ekspor: rentang periode (dua input date),
 * dropdown UPT dari master 46 UPT, input pencarian, dan tombol reset.
 *
 * Opsi UPT diambil dari `GET /options/upt` (master `hc.tb_r_upt`), bukan dari
 * agregat transaksi, sehingga unit tanpa transaksi tetap bisa dipilih.
 * Nilai kosong direpresentasikan sebagai string kosong pada kontrol, lalu
 * dihapus saat diteruskan ke pemanggil.
 */
export default function FilterBar({ filters, onFilterChange, isFetching = false }: FilterBarProps) {
  const defaultRange = getDefaultDateRange();

  const startDate = filters.startDate ?? '';
  const endDate = filters.endDate ?? '';
  const kdUpt = normalizeKdUpt(filters.kd_upt) ?? '';
  const search = filters.search ?? '';

  const [uptOptions, setUptOptions] = useState<UptOption[]>([]);
  // Awal `true`: daftar UPT memang belum diambil saat komponen pertama dirender,
  // sehingga dropdown menampilkan status memuat tanpa perlu `setState` sinkron
  // di dalam effect (dilarang aturan `react-hooks/set-state-in-effect`).
  const [isLoadingUpt, setIsLoadingUpt] = useState<boolean>(true);

  // Ambil opsi UPT dari master sekali saat komponen dipasang.
  useEffect(() => {
    let isActive = true;

    fetchMasterUptOptions()
      .then((list) => {
        if (isActive) setUptOptions(list);
      })
      .catch(() => {
        if (isActive) setUptOptions([]);
      })
      .finally(() => {
        if (isActive) setIsLoadingUpt(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const hasActiveFilter =
    search.trim() !== '' ||
    kdUpt !== '' ||
    startDate !== defaultRange.startDate ||
    endDate !== defaultRange.endDate;

  /** Memancarkan filter baru dengan membersihkan nilai kosong. */
  function emit(next: Partial<FilterParams>): void {
    const merged: FilterParams = { ...filters, ...next };
    // Kode legacy (`01.0` / `01.00`) dinormalkan ke kode primer `15.0` agar
    // selalu cocok dengan `value` opsi dropdown dari master UPT.
    merged.kd_upt = normalizeKdUpt(merged.kd_upt);

    if (!merged.startDate) delete merged.startDate;
    if (!merged.endDate) delete merged.endDate;
    if (!merged.kd_upt) delete merged.kd_upt;
    if (!merged.search || merged.search.trim() === '') delete merged.search;
    else merged.search = merged.search.trim();

    onFilterChange(merged);
  }

  function handleReset(): void {
    // Kembalikan ke periode default (bulan berjalan) dan kosongkan filter lain.
    onFilterChange(getDefaultDateRange());
  }

  const activeUptLabel = uptOptions.find((option) => option.value === kdUpt)?.label ?? kdUpt;

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-label="Filter dashboard ekspor"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Rentang Periode */}
          <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Periode
            </span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => emit({ startDate: event.target.value })}
                className={dateInputClass}
                aria-label="Tanggal awal periode"
              />
              <span className="text-xs text-slate-400">s/d</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => emit({ endDate: event.target.value })}
                className={dateInputClass}
                aria-label="Tanggal akhir periode"
              />
            </div>
          </label>

          {/* Dropdown UPT */}
          <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              UPT
              {isLoadingUpt ? (
                <Loader2 className="h-3 w-3 animate-spin text-blue-600" aria-hidden="true" />
              ) : null}
            </span>
            <select
              value={kdUpt}
              onChange={(event) => emit({ kd_upt: event.target.value })}
              className={selectClass}
              style={selectStyle}
              aria-label="Filter UPT"
              disabled={isLoadingUpt}
            >
              <option value="">{isLoadingUpt ? 'Memuat UPT…' : 'Semua UPT'}</option>
              {uptOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {/* Input Pencarian */}
          <div className="relative sm:min-w-[260px]">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => emit({ search: event.target.value })}
              placeholder="Cari eksportir atau komoditas ikan..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 transition-colors hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              aria-label="Cari eksportir atau komoditas ikan"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isFetching ? (
            <span
              className="flex items-center gap-1.5 text-xs text-slate-500"
              aria-live="polite"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" aria-hidden="true" />
              Memuat…
            </span>
          ) : null}

          {hasActiveFilter ? (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset Filter
            </button>
          ) : null}
        </div>
      </div>

      {hasActiveFilter ? (
        <p className="mt-3 text-xs text-slate-500">
          Filter aktif:
          {startDate || endDate ? (
            <span className="ml-1 font-medium text-slate-700">
              {startDate || '…'} s/d {endDate || '…'}
            </span>
          ) : null}
          {kdUpt ? (
            <span className="ml-1 font-medium text-slate-700">• UPT {activeUptLabel}</span>
          ) : null}
          {search.trim() ? (
            <span className="ml-1 font-medium text-slate-700">• “{search.trim()}”</span>
          ) : null}
        </p>
      ) : null}
    </section>
  );
}
