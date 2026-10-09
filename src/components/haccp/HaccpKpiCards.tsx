import { BadgeCheck, CalendarCheck, FileText, Timer, Users } from 'lucide-react';
import type { HaccpKpiData } from '../../types/haccp';

export interface HaccpKpiCardsProps {
  data: HaccpKpiData | null;
  isLoading: boolean;
}

/** Angka bulat dengan pemisah ribuan gaya Indonesia. */
function formatCount(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('id-ID').format(safe);
}

/** Rata-rata proses selalu punya maksimal satu angka desimal. */
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
 * Grid 5 kartu KPI eksekutif HACCP: total sertifikat, yang masih berlaku, yang
 * sudah kadaluarsa, jumlah UPI tersertifikasi, dan rata-rata lama proses.
 *
 * Kolom: 1 di mobile, 2 di tablet, 3 di laptop, 5 di layar lebar.
 */
export default function HaccpKpiCards({ data, isLoading }: HaccpKpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    );
  }

  const kpi: HaccpKpiData = data ?? {
    totalSertifikat: 0,
    totalBerlaku: 0,
    totalKadaluarsa: 0,
    totalUpi: 0,
    avgProsesHari: null,
  };

  const cards = [
    {
      id: 'totalSertifikat',
      label: 'Total Sertifikat HACCP',
      value: formatCount(kpi.totalSertifikat),
      hint: 'Sertifikat pada periode aktif',
      icon: FileText,
      tone: 'bg-blue-600',
    },
    {
      id: 'totalBerlaku',
      label: 'Sertifikat Berlaku',
      value: formatCount(kpi.totalBerlaku),
      hint: 'Masa berlaku masih aman',
      icon: BadgeCheck,
      tone: 'bg-emerald-600',
    },
    {
      id: 'totalKadaluarsa',
      label: 'Sertifikat Kadaluarsa',
      value: formatCount(kpi.totalKadaluarsa),
      hint: 'Melewati masa berlaku',
      icon: CalendarCheck,
      tone: 'bg-rose-600',
    },
    {
      id: 'totalUpi',
      label: 'UPI Tersertifikasi',
      value: formatCount(kpi.totalUpi),
      hint: 'UPI unik ber-HACCP',
      icon: Users,
      tone: 'bg-indigo-600',
    },
    {
      id: 'avgProsesHari',
      label: 'Rata-rata Proses',
      // `avgProsesHari` bisa `null` bila tidak ada baris yang punya
      // `tgl_terima` + `tgl_terbit`, jadi satuan disembunyikan saat itu.
      value: kpi.avgProsesHari === null ? '-' : `${formatAverage(kpi.avgProsesHari)} hari`,
      hint: 'Terbit dikurangi diterima',
      icon: Timer,
      tone: 'bg-amber-600',
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
            <p className="mt-4 text-3xl font-bold tabular-nums text-slate-900">{card.value}</p>
            <p className="mt-3 text-xs text-slate-500">{card.hint}</p>
          </article>
        );
      })}
    </div>
  );
}