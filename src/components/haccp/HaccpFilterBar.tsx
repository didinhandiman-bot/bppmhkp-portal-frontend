import { RotateCcw } from 'lucide-react';
import HaccpSelect from './HaccpSelect';
import type { HaccpFilterParams } from '../../types/haccp';
import type { UptOption } from '../../types/upt';

export interface HaccpFilterBarProps {
  filters: HaccpFilterParams;
  onFilterChange: (next: HaccpFilterParams) => void;
  /** Opsi UPT dari master `GET /api/v1/options/upt`. */
  uptOptions: UptOption[];
  isLoadingUpt: boolean;
  /** Opsi grade; diturunkan dari sebaran grade pada grafik. */
  gradeOptions: string[];
  /** Rentang default periode berjalan, dipakai tombol Reset. */
  defaultRange: { startDate: string; endDate: string };
  /** Tampilkan penanda "memuat ulang" tanpa mematikan kontrol. */
  isFetching?: boolean;
}

const INPUT_DATE_CLASS =
  'rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

/**
 * Baris filter global modul HACCP: rentang tanggal terbit, UPT, grade, dan
 * status sertifikat.
 *
 * Mengubah filter mana pun selalu mengembalikan `page` ke 1, karena halaman
 * saat ini bisa jadi tidak berlaku lagi setelah hasil menyempit.
 */
export default function HaccpFilterBar({
  filters,
  onFilterChange,
  uptOptions,
  isLoadingUpt,
  gradeOptions,
  defaultRange,
  isFetching = false,
}: HaccpFilterBarProps) {
  const update = (patch: Partial<HaccpFilterParams>) => {
    onFilterChange({ ...filters, ...patch, page: 1 });
  };

  const hasActiveFilter =
    filters.startDate !== defaultRange.startDate ||
    filters.endDate !== defaultRange.endDate ||
    (filters.kdUpt ?? '') !== '' ||
    (filters.grade ?? '') !== '' ||
    (filters.statusSert ?? '') !== '';

  const handleReset = () => {
    onFilterChange({
      startDate: defaultRange.startDate,
      endDate: defaultRange.endDate,
      kdUpt: '',
      grade: '',
      statusSert: '',
      search: '',
      page: 1,
      limit: filters.limit ?? 10,
    });
  };

  return (
    <section
      aria-label="Filter data HACCP"
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[9rem] flex-col gap-1.5">
          <label
            htmlFor="haccp-start-date"
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Tanggal Terbit Mulai
          </label>
          <input
            id="haccp-start-date"
            type="date"
            value={filters.startDate ?? ''}
            max={filters.endDate ?? undefined}
            onChange={(event) => update({ startDate: event.target.value })}
            className={INPUT_DATE_CLASS}
          />
        </div>

        <div className="flex min-w-[9rem] flex-col gap-1.5">
          <label
            htmlFor="haccp-end-date"
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Tanggal Terbit Akhir
          </label>
          <input
            id="haccp-end-date"
            type="date"
            value={filters.endDate ?? ''}
            min={filters.startDate ?? undefined}
            onChange={(event) => update({ endDate: event.target.value })}
            className={INPUT_DATE_CLASS}
          />
        </div>

        <HaccpSelect
          label="UPT"
          value={filters.kdUpt ?? ''}
          onChange={(value) => update({ kdUpt: value })}
          isBusy={isLoadingUpt}
          className="min-w-[16rem]"
          options={[
            { value: '', label: 'Semua UPT' },
            // `UptOption.value` sudah `KD_UNIT` kanonik dari master, mis. `15.0`.
            ...uptOptions.map((option) => ({ value: option.value, label: option.label })),
          ]}
        />

        <HaccpSelect
          label="Grade"
          value={filters.grade ?? ''}
          onChange={(value) => update({ grade: value })}
          options={[
            { value: '', label: 'Semua Grade' },
            ...gradeOptions.map((grade) => ({ value: grade, label: `Grade ${grade}` })),
          ]}
        />

        <HaccpSelect
          label="Status Sertifikat"
          value={filters.statusSert ?? ''}
          onChange={(value) => update({ statusSert: value })}
          options={[
            { value: '', label: 'Semua Status' },
            { value: 'BERLAKU', label: 'Berlaku' },
            { value: 'KADALUARSA', label: 'Kadaluarsa' },
          ]}
        />

        {hasActiveFilter ? (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset Filter
          </button>
        ) : null}

        {isFetching ? (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
            Memuat ulang…
          </span>
        ) : null}
      </div>
    </section>
  );
}