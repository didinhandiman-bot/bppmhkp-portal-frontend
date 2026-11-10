import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SpdiMonthlyTrendItem } from '../../types/spdi';

export interface SpdiTrendChartProps {
  data: SpdiMonthlyTrendItem[] | null;
  isLoading: boolean;
}

/** Nama bulan untuk sumbu-X; backend hanya mengirim `YYYY-MM`. */
const BULAN_PENDEK = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

/**
 * Ubah `YYYY-MM` menjadi label `Des 25`.
 *
 * Backend meng-group hanya bulan yang benar-benar punya terbitan, dan tahun
 * tidak wajib difilter, jadi rentangnya bisa lintas beberapa tahun — tahun
 * dua digit perlu ikut ditampilkan agar sumbu-X tidak berulang membosankan.
 */
function toMonthLabel(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) return value.trim();
  const monthIndex = Number(match[2]) - 1;
  const name = BULAN_PENDEK[monthIndex];
  if (!name) return value.trim();
  return `${name} ${match[1].slice(2)}`;
}

function toCount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Tren penerbitan sertifikat SPDI per bulan (area chart).
 *
 * Satu seri saja: `/dashboard` mengirim `monthlyTrend` tunggal tanpa
 * pembanding tahun sebelumnya.
 */
export default function SpdiTrendChart({ data, isLoading }: SpdiTrendChartProps) {
  const chartData = (Array.isArray(data) ? data : []).map((point) => ({
    bulan: toMonthLabel(point.bulan),
    total: toCount(point.total),
  }));

  const hasData = chartData.some((row) => row.total > 0);

  return (
    <section
      aria-labelledby="spdi-tren-title"
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-2 flex flex-col gap-1">
        <h3 id="spdi-tren-title" className="text-base font-semibold text-slate-900">
          Tren Penerbitan Sertifikat
        </h3>
        <p className="text-xs text-slate-500">
          Jumlah sertifikat SPDI yang terbit per bulan pada filter aktif
        </p>
      </div>

      <div className="h-[320px] w-full">
        {isLoading ? (
          <div
            className="flex h-full animate-pulse items-center justify-center rounded-lg bg-slate-100"
            aria-hidden="true"
          />
        ) : hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="spdi-gradienTren" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0891b2" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#0891b2" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="bulan" tick={{ fontSize: 12 }} stroke="#cbd5e1" minTickGap={16} />
              <YAxis tick={{ fontSize: 12 }} stroke="#cbd5e1" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.75rem',
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                name="Sertifikat"
                stroke="#0891b2"
                strokeWidth={2}
                fill="url(#spdi-gradienTren)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Belum ada data tren penerbitan untuk filter yang dipilih.
          </div>
        )}
      </div>
    </section>
  );
}
