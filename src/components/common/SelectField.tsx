import { ChevronDown, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export interface SelectFieldProps {
  /** Prefix unik untuk `id`/`htmlFor`; mencegah tabrakan antar halaman. */
  idPrefix: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  disabled?: boolean;
  isBusy?: boolean;
  className?: string;
}

const SELECT_CLASS =
  'w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';

/**
 * Select generik dengan gaya portal.
 *
 * Ada karena `SkpSelect` dan `HaccpSelect` mengulang kontrol yang sama dengan
 * awalan `id` berbeda; komponen ini dipakai halaman dashboard agar tidak ada
 * salinan ketiga. Panah native disembunyikan dan diganti ikon supaya seragam
 * dengan select modul lain. Nilai kosong ditangani pemanggil.
 */
export default function SelectField({
  idPrefix,
  label,
  value,
  onChange,
  options,
  disabled = false,
  isBusy = false,
  className = '',
}: SelectFieldProps) {
  const controlId = `${idPrefix}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
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
      {describedBy ? (
        <span id={describedBy} className="sr-only">
          Tidak ada opsi tersedia
        </span>
      ) : null}
    </div>
  );
}