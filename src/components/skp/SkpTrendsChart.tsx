import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SkpTrendPoint } from '../../types/skp';

export interface SkpTrendsChartProps {
  data: SkpTrendPoint[] | null;
  isLoading: boolean;
  /** Tahun periode berjalan; tahun pembanding diturunkan dari `year - 1`. */
  year: number;
  previousYear: number;
}

/** Nama bulan cadangan; backend sudah mengirim `monthName`. */
const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** Satu titik siap render untuk Recharts. */
interface ChartPoint {
  bulan: string;
  tahunBerjalan: number;
  tahunSebelumnya: number;
}

/** Nilai chart selalu berupa angka; `undefined`/`NaN` dinormalkan ke 0. */
function toCount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildChartData(points: SkpTrendPoint[]): ChartPoint[] {
  if (!Array.isArray(points)) return [];

  return points.map((point) => ({
    bulan: point.monthName.trim() !== '' ? point.monthName : (BULAN_SINGKAT[point.month - 1] ?? String(point.month)),
    tahunBerjalan: toCount(point.currentYear),
    tahunSebelumnya: toCount(point.previousYear),
  }));
}

function ChartSkeleton() {
  return (
    <div
      className="flex h-[320px] animate-pulse items-center justify-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-hidden="true"
    >
      <div className="h-full w-full rounded-lg bg-slate-100" />
    </div>
  );
}

/**
 * Tren penerbitan bulanan: tahun berjalan vs tahun sebelumnya.
 *
 * Backend sudah mengembalikan kedua seri sekaligus dalam satu payload, jadi
 * chart ini tidak perlu request tambahan.
 */
export default function SkpTrendsChart({ data, isLoading, year, previousYear }: SkpTrendsChartProps) {
  const chartData = buildChartData(data ?? []);
  const hasData = chartData.some((row) => row.tahunBerjalan > 0 || row.tahunSebelumnya > 0);

  return (
    <section
      aria-labelledby="skp-tren-title"
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-2 flex flex-col gap-1">
        <h3 id="skp-tren-title" className="text-base font-semibold text-slate-900">
          Tren Penerbitan Bulanan
        </h3>
        <p className="text-xs text-slate-500">
          Perbandingan jumlah SKP terbit {year} vs {previousYear}
        </p>
      </div>

      <div className="h-[320px] w-full">
        {isLoading ? (
          <ChartSkeleton />
        ) : hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="skp-gradienTahunBerjalan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="bulan" tick={{ fontSize: 12 }} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 12 }} stroke="#cbd5e1" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.75rem',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              <Area
                type="monotone"
                dataKey="tahunBerjalan"
                name={`Tahun ${year}`}
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#skp-gradienTahunBerjalan)"
              />
              <Area
                type="monotone"
                dataKey="tahunSebelumnya"
                name={`Tahun ${previousYear}`}
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 4"
                fill="#94a3b8"
                fillOpacity={0.08}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Belum ada data tren untuk tahun {year}.
          </div>
        )}
      </div>
    </section>
  );
}
