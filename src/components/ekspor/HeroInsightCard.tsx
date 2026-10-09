import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { formatRupiah, formatUsd } from '../../utils/formatters';
import type { HeroInsight } from '../../types/export';

interface HeroInsightCardProps {
  /** Data hero insight dari endpoint `kpi-summary`. */
  heroInsight: HeroInsight;
  /** Judul panel; dapat diubah bila dipakai di konteks lain. */
  title?: string;
}

/** Membentuk label persentase pertumbuhan dengan tanda eksplisit. */
function formatGrowthLabel(growthPercent: number): string {
  const value = Number.isFinite(growthPercent) ? growthPercent : 0;
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}% YoY`;
}

/**
 * Kartu metrik utama: Total Devisa (IDR) beserta konversi USD dan badge
 * pertumbuhan di pojok kanan atas.
 *
 * Palet mengikuti template portal (kartu putih, teks slate, aksen blue-600),
 * bukan tema gelap proyek dashboard.
 */
export default function HeroInsightCard({
  heroInsight,
  title = 'Total Devisa Ekspor',
}: HeroInsightCardProps) {
  const { totalNilaiRupiah, totalNilaiUsd, growthPercent } = heroInsight;

  const isDecline = growthPercent < 0;
  const isFlat = growthPercent === 0;

  const badgeClass = isDecline
    ? 'bg-rose-100 text-rose-700'
    : 'bg-emerald-100 text-emerald-700';

  const GrowthIcon = isDecline ? TrendingDown : isFlat ? Minus : TrendingUp;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>

        <p
          className="mt-2 break-words text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl"
          title={formatRupiah(totalNilaiRupiah)}
        >
          {formatRupiah(totalNilaiRupiah)}
        </p>

        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
          <span>Setara</span>
          <span className="font-semibold text-slate-800">{formatUsd(totalNilaiUsd)}</span>
          <span className="text-slate-400">(konversi kurs transaksi)</span>
        </p>
      </div>

      <span
        className={`inline-flex shrink-0 self-start items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${badgeClass}`}
        title="Pertumbuhan dibanding periode yang sama tahun sebelumnya"
      >
        <GrowthIcon className="h-4 w-4" aria-hidden="true" />
        {formatGrowthLabel(growthPercent)}
      </span>
    </div>
  );
}
