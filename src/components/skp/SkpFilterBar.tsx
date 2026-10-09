import { RotateCcw } from 'lucide-react';
import SkpSelect from './SkpSelect';
import {
  SKP_PERINGKAT_OPTIONS,
  SKP_SKALA_USAHA_OPTIONS,
  type SkpFilterParams,
} from '../../types/skp';
import type { SkpProvinsiOption } from '../../utils/skpProvinsi';

export interface SkpFilterBarProps {
  filters: SkpFilterParams;
  onFilterChange: (next: SkpFilterParams) => void;
  /** Opsi provinsi (id + nama) dari data tabel yang sudah dimuat. */
  provinsiOptions: SkpProvinsiOption[];
  isLoadingProvinsi: boolean;
  /** Tampilkan penanda "memuat ulang" tanpa mematikan kontrol. */
  isFetching?: boolean;
  /** Tahun yang tersedia di UI, default tiga tahun terakhir. */
  yearOptions?: number[];
}

/**
 * Baris filter global modul SKP: tahun, provinsi, skala usaha, dan peringkat.
 *
 * Mengubah filter mana pun selalu mengembalikan `page` ke 1, karena halaman
 * saat ini bisa jadi tidak berlaku lagi setelah hasil menyempit.
 */
export default function SkpFilterBar({
  filters,
  onFilterChange,
  provinsiOptions,
  isLoadingProvinsi,
  isFetching = false,
  yearOptions,
}: SkpFilterBarProps) {
  const currentYear = new Date().getFullYear();
  const years = yearOptions ?? [currentYear, currentYear - 1, currentYear - 2];

  const update = (patch: Partial<SkpFilterParams>) => {
    onFilterChange({ ...filters, ...patch, page: 1 });
  };

  const hasActiveFilter =
    (filters.provinsiId ?? '') !== '' ||
    (filters.skalaUsaha ?? '') !== '' ||
    (filters.peringkat ?? '') !== '' ||
    (filters.year ?? currentYear) !== currentYear;

  const handleReset = () => {
    onFilterChange({
      year: currentYear,
      provinsiId: '',
      skalaUsaha: '',
      peringkat: '',
      search: '',
      status: 'semua',
      page: 1,
      limit: filters.limit ?? 10,
    });
  };

  return (
    <section
      aria-label="Filter data SKP"
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-end gap-3">
        <SkpSelect
          label="Tahun"
          value={String(filters.year ?? currentYear)}
          onChange={(value) => update({ year: Number(value) })}
          options={years.map((year) => ({ value: String(year), label: String(year) }))}
        />

        <SkpSelect
          label="Provinsi"
          value={filters.provinsiId ?? ''}
          onChange={(value) => update({ provinsiId: value })}
          isBusy={isLoadingProvinsi}
          options={[
            { value: '', label: 'Semua Provinsi' },
            ...provinsiOptions.map((option) => ({ value: option.id, label: option.name })),
          ]}
        />

        <SkpSelect
          label="Skala Usaha"
          value={filters.skalaUsaha ?? ''}
          onChange={(value) => update({ skalaUsaha: value })}
          options={[
            { value: '', label: 'Semua Skala' },
            // Label bucket backend ("Mikro"), bukan "Usaha Mikro".
            ...SKP_SKALA_USAHA_OPTIONS.map((bucket) => ({
              value: bucket,
              label: `Usaha ${bucket}`,
            })),
          ]}
        />

        <SkpSelect
          label="Peringkat"
          value={filters.peringkat ?? ''}
          onChange={(value) => update({ peringkat: value })}
          options={[
            { value: '', label: 'Semua Peringkat' },
            ...SKP_PERINGKAT_OPTIONS.map((grade) => ({ value: grade, label: `Grade ${grade}` })),
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
