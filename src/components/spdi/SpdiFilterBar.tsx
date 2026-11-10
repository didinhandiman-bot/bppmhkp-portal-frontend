import { RotateCcw } from 'lucide-react';
import SelectField from '../common/SelectField';
import type { SpdiFilterParams } from '../../types/spdi';
import type { UptOption } from '../../types/upt';

/** Opsi dropdown sederhana (kode + label). */
export interface SpdiProvinsiOption {
  value: string;
  label: string;
}

export interface SpdiFilterBarProps {
  filters: SpdiFilterParams;
  onFilterChange: (next: SpdiFilterParams) => void;
  /** Opsi UPT dari master `GET /api/v1/options/upt`. */
  uptOptions: UptOption[];
  isLoadingUpt: boolean;
  /** Opsi provinsi (kode BPS 2 digit) dari GeoJSON 38 provinsi. */
  provinsiOptions: SpdiProvinsiOption[];
  /** Tahun yang ditawarkan; default dibangun pemanggil. */
  tahunOptions: number[];
  /** Tampilkan penanda "memuat ulang" tanpa mematikan kontrol. */
  isFetching?: boolean;
}

/**
 * Baris filter global modul SPDI: UPT, provinsi, dan tahun.
 *
 * Berbeda dari HACCP (rentang tanggal) dan SKP (tahun wajib untuk YoY),
 * `tahun` di sini benar-benar opsional: nilai kosong berarti backend
 * menghitung SELURUH tahun. Mengubah filter mana pun selalu mengembalikan
 * `page` ke 1, karena halaman saat ini bisa jadi tidak berlaku lagi setelah
 * hasil menyempit.
 */
export default function SpdiFilterBar({
  filters,
  onFilterChange,
  uptOptions,
  isLoadingUpt,
  provinsiOptions,
  tahunOptions,
  isFetching = false,
}: SpdiFilterBarProps) {
  const update = (patch: Partial<SpdiFilterParams>) => {
    onFilterChange({ ...filters, ...patch, page: 1 });
  };

  const handleReset = () => {
    onFilterChange({
      kdUpt: '',
      kdProvinsi: '',
      tahun: '',
      search: filters.search ?? '',
      page: 1,
      limit: filters.limit ?? 10,
    });
  };

  return (
    <section
      aria-label="Filter data SPDI"
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-end gap-3">
        <SelectField
          idPrefix="spdi"
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

        <SelectField
          idPrefix="spdi"
          label="Provinsi"
          value={filters.kdProvinsi ?? ''}
          onChange={(value) => update({ kdProvinsi: value })}
          className="min-w-[14rem]"
          options={[
            { value: '', label: 'Semua Provinsi' },
            ...provinsiOptions,
          ]}
        />

        <SelectField
          idPrefix="spdi"
          label="Tahun"
          value={String(filters.tahun ?? '')}
          onChange={(value) => update({ tahun: value === '' ? '' : Number(value) })}
          options={[
            { value: '', label: 'Semua Tahun' },
            ...tahunOptions.map((tahun) => ({ value: String(tahun), label: String(tahun) })),
          ]}
        />

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset
        </button>

        {isFetching ? (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
            Memuat ulang…
          </span>
        ) : null}
      </div>
    </section>
  );
}
