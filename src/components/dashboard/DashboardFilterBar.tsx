import { RotateCcw } from 'lucide-react';
import SelectField from '../common/SelectField';
import {
  DASHBOARD_DATE_PRESETS,
  DASHBOARD_UPT_SEMUA,
  type DashboardDatePreset,
} from '../../types/dashboard';
import type { UptOption } from '../../types/upt';

export interface DashboardFilterBarProps {
  preset: DashboardDatePreset;
  onPresetChange: (preset: DashboardDatePreset) => void;
  /** Rentang efektif hasil preset; hanya dipakai bila `preset === 'custom'`. */
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  /** `''` berarti nasional. */
  uptId: string;
  onUptChange: (value: string) => void;
  uptOptions: UptOption[];
  isLoadingUpt: boolean;
  /** Rentang periode berjalan, dipakai tombol Reset. */
  defaultRange: { startDate: string; endDate: string };
  isFetching?: boolean;
}

const INPUT_DATE_CLASS =
  'rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

/**
 * Baris filter dashboard: preset rentang tanggal dan cakupan UPT.
 *
 * Kolom tanggal hanya diablok saat preset "custom"; untuk preset siap pakai
 * rentang ditentukan di halaman supaya filter dan request tidak bisa berbeda.
 */
export default function DashboardFilterBar({
  preset,
  onPresetChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  uptId,
  onUptChange,
  uptOptions,
  isLoadingUpt,
  defaultRange,
  isFetching = false,
}: DashboardFilterBarProps) {
  const isCustom = preset === 'custom';
  const hasCustomDate =
    isCustom && (startDate !== defaultRange.startDate || endDate !== defaultRange.endDate);
  const hasActiveFilter = hasCustomDate || uptId !== '' || preset !== 'ytd';

  const handleReset = () => {
    onPresetChange('ytd');
    onUptChange('');
    onStartDateChange(defaultRange.startDate);
    onEndDateChange(defaultRange.endDate);
  };

  return (
    <section
      aria-label="Filter dashboard"
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-end gap-3">
        <SelectField
          idPrefix="dashboard-filter"
          label="Periode"
          value={preset}
          onChange={(value) => onPresetChange(value as DashboardDatePreset)}
          options={DASHBOARD_DATE_PRESETS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          className="min-w-[11rem]"
        />

        {isCustom ? (
          <>
            <div className="flex min-w-[9rem] flex-col gap-1.5">
              <label
                htmlFor="dashboard-filter-mulai"
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Mulai
              </label>
              <input
                id="dashboard-filter-mulai"
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => onStartDateChange(event.target.value)}
                className={INPUT_DATE_CLASS}
              />
            </div>
            <div className="flex min-w-[9rem] flex-col gap-1.5">
              <label
                htmlFor="dashboard-filter-selesai"
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Selesai
              </label>
              <input
                id="dashboard-filter-selesai"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => onEndDateChange(event.target.value)}
                className={INPUT_DATE_CLASS}
              />
            </div>
          </>
        ) : (
          <div className="flex min-w-[13rem] flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Periode Aktif
            </span>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium tabular-nums text-slate-700">
              {startDate || '—'} s.d. {endDate || '—'}
            </p>
          </div>
        )}

        <SelectField
          idPrefix="dashboard-filter"
          label="UPT"
          value={uptId}
          onChange={onUptChange}
          isBusy={isLoadingUpt}
          className="min-w-[16rem]"
          options={[
            { value: '', label: DASHBOARD_UPT_SEMUA },
            // `UptOption.value` = `KD_UNIT` kanonik dari master, mis. `15.0`.
            ...uptOptions.map((option) => ({ value: option.value, label: option.label })),
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