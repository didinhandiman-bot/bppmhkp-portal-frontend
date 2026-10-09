import {
  Building2,
  FileSpreadsheet,
  Globe2,
  Minus,
  Scale,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatTon } from '../../utils/formatters';
import type { KpiCards } from '../../types/export';

interface KpiCardGridProps {
  /** Data kartu KPI dari endpoint `kpi-summary`. */
  kpiCards: KpiCards;
}

interface KpiDefinition {
  /** Kunci unik untuk kebutuhan `key` React. */
  id: string;
  label: string;
  value: string;
  /** Keterangan pendukung di bawah nilai. */
  hint: string;
  icon: LucideIcon;
  /** Persentase YoY; `undefined` bila backend tidak mengirimnya. */
  yoy?: number;
}

/** Format bilangan bulat gaya Indonesia (pemisah ribuan titik). */
const countFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

/** Format angka tanpa desimal untuk metrik hitungan (dokumen, eksportir, negara). */
function formatCount(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return countFormatter.format(Math.round(safe));
}

/** Membentuk label persentase YoY dengan tanda eksplisit. */
function formatYoyLabel(yoy: number): string {
  const value = Number.isFinite(yoy) ? yoy : 0;
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}% YoY`;
}

/** Menyusun definisi kartu dari data KPI agar render bersifat deklaratif. */
function buildDefinitions(kpiCards: KpiCards): KpiDefinition[] {
  return [
    {
      id: 'totalNettoTon',
      label: 'Total Tonase',
      value: formatTon(kpiCards.totalNettoTon, 'ton'),
      hint: 'Volume bersih terkirim',
      icon: Scale,
      yoy: kpiCards.yoy?.tonase,
    },
    {
      id: 'totalDokumenHc',
      label: 'Total Dokumen HC',
      value: formatCount(kpiCards.totalDokumenHc),
      hint: 'Sertifikat kesehatan terbit',
      icon: FileSpreadsheet,
      yoy: kpiCards.yoy?.dokumenHc,
    },
    {
      id: 'totalEksportirAktif',
      label: 'Eksportir Aktif',
      value: formatCount(kpiCards.totalEksportirAktif),
      hint: 'Trader dengan pengajuan',
      icon: Building2,
      yoy: kpiCards.yoy?.eksportirAktif,
    },
    {
      id: 'totalNegaraTujuan',
      label: 'Negara Tujuan',
      value: formatCount(kpiCards.totalNegaraTujuan),
      hint: 'Negara mitra terlayani',
      icon: Globe2,
      yoy: kpiCards.yoy?.negaraTujuan,
    },
  ];
}

/**
 * Grid metrik pendukung: 2 kolom pada mobile, 4 kolom pada layar desktop.
 * Setiap kartu memuat badge YoY bila backend mengirimnya.
 */
export default function KpiCardGrid({ kpiCards }: KpiCardGridProps) {
  const definitions = buildDefinitions(kpiCards);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {definitions.map(({ id, label, value, hint, icon: Icon, yoy }) => {
        const isDecline = yoy !== undefined && yoy < 0;
        const isFlat = yoy === 0;
        const YoyIcon = isDecline ? TrendingDown : isFlat ? Minus : TrendingUp;
        const yoyBadgeClass = isDecline
          ? 'bg-rose-100 text-rose-700'
          : 'bg-emerald-100 text-emerald-700';

        return (
          <div
            key={id}
            className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>

              {yoy === undefined ? null : (
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${yoyBadgeClass}`}
                  title="Pertumbuhan dibanding periode yang sama tahun sebelumnya"
                >
                  <YoyIcon className="h-3 w-3" aria-hidden="true" />
                  {formatYoyLabel(yoy)}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-1 break-words text-xl font-bold text-slate-900 sm:text-2xl">{value}</p>
              <p className="mt-1 text-xs text-slate-500">{hint}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
