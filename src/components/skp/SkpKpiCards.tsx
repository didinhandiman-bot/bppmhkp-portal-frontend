import { Award, BadgeCheck, FileText, Users } from 'lucide-react';
import type { SkpSummaryData } from '../../types/skp';

export interface SkpKpiCardsProps {
  data: SkpSummaryData | null;
  isLoading: boolean;
}

/** Angka bulat dengan pemisah ribuan gaya Indonesia. */
function formatCount(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('id-ID').format(safe);
}

/**
 * Badge YoY.
 *
 * Backend sudah menghitung `yoyGrowth` sendiri (dibanding tahun sebelumnya),
 * jadi frontend tidak menghitung ulang. Nilai negatif berarti penurunan.
 */
function YoYBadge({ value }: { value: number }) {
  const safe = Number.isFinite(value) ? value : 0;
  const tone =
    safe > 0
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : safe < 0
        ? 'bg-rose-50 text-rose-700 ring-rose-200'
        : 'bg-slate-50 text-slate-600 ring-slate-200';
  const sign = safe > 0 ? '+' : '';

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-inset ${tone}`}
      title="Perubahan dibanding tahun sebelumnya"
    >
      {sign}
      {safe.toFixed(1)}% YoY
    </span>
  );
}

function CardSkeleton() {
  return (
    <div
      className="flex animate-pulse flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <div className="h-3 w-28 rounded bg-slate-200" />
        <div className="h-10 w-10 rounded-lg bg-slate-200" />
      </div>
      <div className="mt-4 h-8 w-32 rounded bg-slate-200" />
      <div className="mt-3 h-3 w-20 rounded bg-slate-200" />
    </div>
  );
}

/**
 * Grid 4 kartu KPI eksekutif: total SKP terbit (dengan badge YoY), sertifikat
 * aktif, sertifikat kedaluwarsa, dan UPI tersertifikasi.
 *
 * Kolom: 1 di mobile, 2 di tablet, 4 di desktop.
 */
export default function SkpKpiCards({ data, isLoading }: SkpKpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    );
  }

  const summary: SkpSummaryData = data ?? {
    year: new Date().getFullYear(),
    previousYear: new Date().getFullYear() - 1,
    totalTerbit: 0,
    totalTerbitPrevYear: 0,
    yoyGrowth: 0,
    totalAktif: 0,
    totalExpired: 0,
    totalUpi: 0,
    filters: { provinsiId: null, skalaUsaha: null, peringkat: null },
  };

  const cards = [
    {
      id: 'totalTerbit',
      label: 'Total SKP Terbit',
      value: formatCount(summary.totalTerbit),
      hint: `Tahun ${summary.year}`,
      icon: FileText,
      tone: 'bg-blue-600',
      // Hanya kartu ini yang punya nilai YoY dari backend.
      yoy: summary.yoyGrowth,
    },
    {
      id: 'totalAktif',
      label: 'Sertifikat Aktif',
      value: formatCount(summary.totalAktif),
      hint: 'Masih berlaku',
      icon: BadgeCheck,
      tone: 'bg-emerald-600',
      yoy: null,
    },
    {
      id: 'totalExpired',
      label: 'Sertifikat Kedaluwarsa',
      value: formatCount(summary.totalExpired),
      hint: 'Melewati masa berlaku',
      icon: BadgeCheck,
      tone: 'bg-rose-600',
      yoy: null,
    },
    {
      id: 'totalUpi',
      label: 'UPI Tersertifikasi',
      value: formatCount(summary.totalUpi),
      hint: 'UPI unik ber-SKP',
      icon: Users,
      tone: 'bg-indigo-600',
      yoy: null,
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.id}
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.tone}`}>
                <Icon className="h-5 w-5 text-white" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
              <p className="text-3xl font-bold tabular-nums text-slate-900">{card.value}</p>
              {card.yoy !== null ? <YoYBadge value={card.yoy} /> : null}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <Award className="h-3.5 w-3.5" aria-hidden="true" />
              {card.hint}
            </p>
          </article>
        );
      })}
    </div>
  );
}
