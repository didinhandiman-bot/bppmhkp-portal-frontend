import { ChevronDown, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Kontrol select bergaya portal.
 *
 * Panah native disembunyikan dan diganti ikon `lucide` supaya seragam dengan
 * select lain di modul SKP dan Ekspor. Nilai kosong ditangani pemanggil, bukan
 * di sini, supaya komponen ini tetap murni presentasional.
 */
export interface SkpSelectProps {
  /** Label yang tampil di atas kontrol; juga dipakai sebagai `id` dan `aria`. */
  label: string;
  /** Nilai terpilih. */
  value: string;
  /** Dipanggil dengan nilai baru setiap kali pengguna memilih. */
  onChange: (value: string) => void;
  /** Opsi pilihan; `value` kosong berarti "Semua". */
  options: ReadonlyArray<{ value: string; label: string }>;
  /** Nonaktifkan kontrol (mis. saat memuat daftar provinsi). */
  disabled?: boolean;
  /** Tampilkan spinner di dalam kontrol. */
  isBusy?: boolean;
  /** Kelas tambahan pada elemen pembungkus. */
  className?: string;
}

/** Nama kelas bersama agar semua select modul SKP konsisten. */
const SELECT_CLASS =
  'w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';

export default function SkpSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
  isBusy = false,
  className = '',
}: SkpSelectProps) {
  const controlId = `skp-select-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const describedBy = options.length === 0 && !isBusy ? `${controlId}-kosong` : undefined;

  const decoration: ReactNode = isBusy ? (
    <Loader2 className="pointer-events-none absolute right-3 h-4 w-4 animate-spin text-blue-600" />
  ) : (
    <ChevronDown
      className="pointer-events-none absolute right-3 h-4 w-4 text-slate-500"
      aria-hidden="true"
    />
  );

  return (
    <div className={`flex min-w-[9rem] flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={controlId}
        className="text-xs font-semibold uppercase tracking-wide text-slate-500"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={controlId}
          value={value}
          disabled={disabled || isBusy}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          className={SELECT_CLASS}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {decoration}
      </div>
      {/* Pier accessibility untuk kondisi "tidak ada opsi". */}
      {describedBy ? (
        <span id={describedBy} className="sr-only">
          Tidak ada opsi tersedia
        </span>
      ) : null}
    </div>
  );
}
