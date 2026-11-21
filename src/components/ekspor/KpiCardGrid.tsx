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

interface CardTheme {
  topBorder: string;
  cardBg: string;
  iconBg: string;
  iconText: string;
  valueText: string;
}

interface KpiDefinition {
  /** Kunci unik untuk kebutuhan `key` React. */
  id: string;
  label: string;
  value: string;
  /** Keterangan pendukung di bawah nilai. */
  hint: string;
  icon: LucideIcon;
  theme: CardTheme;
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

/**
 * Menyusun definisi kartu mengikuti palet warna ikon Siap Mutu:
 * Biru (Tonase), Hijau (Dokumen SMKHP), Kuning Emas (Eksportir), Merah (Negara Tujuan).
 */
function buildDefinitions(kpiCards: KpiCards): KpiDefinition[] {
  return [
    {
      id: 'totalNettoTon',
      label: 'Total Tonase',
      value: formatTon(kpiCards.totalNettoTon, 'ton'),
      hint: 'Volume bersih terkirim',
      icon: Scale,
      theme: {
        topBorder: 'border-t-[#2979FF]',
        cardBg: 'bg-gradient-to-br from-blue-50/45 via-white to-white',
        iconBg: 'bg-[#2979FF] shadow-sm shadow-blue-500/30',
        iconText: 'text-white',
        valueText: 'text-blue-900',
      },
      yoy: kpiCards.yoy?.tonase,
    },
    {
      id: 'totalDokumenHc',
      label: 'Total Dokumen SMKHP',
      value: formatCount(kpiCards.totalDokumenHc),
      hint: 'SMKHP terbit',
      icon: FileSpreadsheet,
      theme: {
        topBorder: 'border-t-[#00C853]',
        cardBg: 'bg-gradient-to-br from-emerald-50/45 via-white to-white',
        iconBg: 'bg-[#00C853] shadow-sm shadow-emerald-500/30',
        iconText: 'text-white',
        valueText: 'text-emerald-900',
      },
      yoy: kpiCards.yoy?.dokumenHc,
    },
    {
      id: 'totalEksportirAktif',
      label: 'Eksportir Aktif',
      value: formatCount(kpiCards.totalEksportirAktif),
      hint: 'Trader dengan pengajuan',
      icon: Building2,
      theme: {
        topBorder: 'border-t-[#EAB308]',
        cardBg: 'bg-gradient-to-br from-amber-50/50 via-white to-white',
        iconBg: 'bg-[#EAB308] shadow-sm shadow-amber-500/30',
        iconText: 'text-white',
        valueText: 'text-amber-900',
      },
      yoy: kpiCards.yoy?.eksportirAktif,
    },
    {
      id: 'totalNegaraTujuan',
      label: 'Negara Tujuan',
      value: formatCount(kpiCards.totalNegaraTujuan),
      hint: 'Negara mitra terlayani',
      icon: Globe2,
      theme: {
        topBorder: 'border-t-[#FF3B30]',
        cardBg: 'bg-gradient-to-br from-rose-50/45 via-white to-white',
        iconBg: 'bg-[#FF3B30] shadow-sm shadow-rose-500/30',
        iconText: 'text-white',
        valueText: 'text-rose-900',
      },
      yoy: kpiCards.yoy?.negaraTujuan,
    },
  ];
}

/**
 * Grid metrik pendukung: 2 kolom pada mobile, 4 kolom pada layar desktop.
 * Lingkaran ikon solid mengikuti identitas warna Siap Mutu.
 */
export default function KpiCardGrid({ kpiCards }: KpiCardGridProps) {
  const definitions = buildDefinitions(kpiCards);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {definitions.map(({ id, label, value, hint, icon: Icon, theme, yoy }) => {
        const isDecline = yoy !== undefined && yoy < 0;
        const isFlat = yoy === 0;
        const YoyIcon = isDecline ? TrendingDown : isFlat ? Minus : TrendingUp;
        const yoyBadgeClass = isDecline
          ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200/70'
          : isFlat
            ? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/70'
            : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/70';

        return (
          <div
            key={id}
            className={`group flex flex-col gap-3 rounded-xl border border-slate-200/90 border-t-4 ${theme.topBorder} ${theme.cardBg} p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105 ${theme.iconBg} ${theme.iconText}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>

              {yoy === undefined ? null : (
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${yoyBadgeClass}`}
                  title="Pertumbuhan dibanding periode yang sama tahun sebelumnya"
                >
                  <YoyIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatYoyLabel(yoy)}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className={`mt-1 break-words text-xl font-extrabold sm:text-2xl ${theme.valueText}`}>
                {value}
              </p>
              <p className="mt-1 text-xs text-slate-400">{hint}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}