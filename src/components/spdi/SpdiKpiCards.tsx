import { Award, FileText, Gauge, Timer } from 'lucide-react';
import type { SpdiMetrics } from '../../types/spdi';

export interface SpdiKpiCardsProps {
  data: SpdiMetrics | null;
  isLoading: boolean;
}

/** Angka bulat dengan pemisah ribuan gaya Indonesia. */
function formatCount(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('id-ID').format(safe);
}

/** Rata-rata skor/SLA selalu punya maksimal satu angka desimal. */
function formatAverage(value: number | null): string {
  if (value === null) return '-';
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(safe);
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
 * Grid 4 kartu KPI SPDI: total sertifikat/unit, rata-rata skor inspeksi,
 * rata-rata skor CDIB, dan rata-rata SLA penerbitan.
 *
 * Kolom: 1 di mobile, 2 di tablet, 4 di layar lebar.
 */
export default function SpdiKpiCards({ data, isLoading }: SpdiKpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    );
  }

  const metrics: SpdiMetrics = data ?? {
    totalData: 0,
    totalTerbit: 0,
    totalUnit: 0,
    avgSkorInspeksi: null,
    avgSkorCdib: null,
    avgSlaHari: null,
  };

  const cards = [
    {
      id: 'totalSertifikat',
      label: 'Total Sertifikat / Unit',
      // Satu angka, dua konteks: sertifikat terbit sebagai pembilang, unit
      // terdaftar di belakangnya — backend mengirim keduanya sekaligus.
      value: `${formatCount(metrics.totalTerbit)} / ${formatCount(metrics.totalUnit)}`,
      hint: `Sertifikat terbit dari ${formatCount(metrics.totalData)} data permohonan`,
      icon: FileText,
      tone: 'bg-blue-600',
    },
    {
      id: 'avgSkorInspeksi',
      label: 'Rata-rata Skor Inspeksi',
      value: formatAverage(metrics.avgSkorInspeksi),
      hint: 'Skala 0-100',
      icon: Gauge,
      tone: 'bg-emerald-600',
    },
    {
      id: 'avgSkorCdib',
      label: 'Rata-rata Skor CDIB',
      value: formatAverage(metrics.avgSkorCdib),
      hint: 'Skala 0-100',
      icon: Award,
      tone: 'bg-indigo-600',
    },
    {
      id: 'avgSlaHari',
      label: 'Rata-rata SLA Penerbitan',
      // `avgSlaHari` `null` bila belum ada satu pun sertifikat terbit, jadi
      // satuan disembunyikan saat itu agar tidak tampil "- hari".
      value:
        metrics.avgSlaHari === null ? '-' : `${formatAverage(metrics.avgSlaHari)} hari`,
      hint: 'Terbit dikurangi permohonan',
      icon: Timer,
      tone: 'bg-amber-600',
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
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.tone}`}
              >
                <Icon className="h-5 w-5 text-white" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold tabular-nums text-slate-900">{card.value}</p>
            <p className="mt-3 text-xs text-slate-500">{card.hint}</p>
          </article>
        );
      })}
    </div>
  );
}
