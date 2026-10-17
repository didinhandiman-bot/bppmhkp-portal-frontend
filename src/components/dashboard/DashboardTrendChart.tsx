import {
  Area,
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardMonthlyTrend } from '../../types/dashboard';

export interface DashboardTrendChartProps {
  data: DashboardMonthlyTrend[] | null;
  isLoading: boolean;
}

function toCount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Label sumbu-X.
 *
 * `month` belum dikunci bentuknya di backend (angka atau teks), jadi apa pun
 * yang tidak ter-parse diperlakukan sebagai label 그대로 — lebih baik daripada
 * memunculkan `NaN` di sumbu.
 */
function toMonthLabel(value: string | number): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const BULAN = [
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
    // Angka 1-12 dianggap indeks bulan; angka lain dibiarkan apa adanya.
    const index = Math.trunc(value) - 1;
    return BULAN[index] ?? String(value);
  }
  const text = String(value).trim();
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(text)) {
    const [year, month] = text.split('-').map(Number);
    return new Intl.DateTimeFormat('id-ID', {month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year, month - 1, 1)));
  }
  return text === '' ? '—' : text;
}

function ChartSkeleton() {
  return (
    <div
      className="flex h-[340px] animate-pulse items-center justify-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-hidden="true"
    >
      <div className="h-full w-full rounded-lg bg-slate-100" />
    </div>
  );
}

/**
 * Tren bulanan lintas sektor: Ekspor, Pasca Panen, dan Primer.
 *
 * Ekspor digambar sebagai area karena nilainya jauh lebih besar daripada dua
 * sektor lain sehingga garisnya mendominasi sumbu-Y; dua sektor yang angkanya
 * jauh lebih kecil tetap memakai garis agar bedanya tidak tertutup area.
 */
export default function DashboardTrendChart({ data, isLoading }: DashboardTrendChartProps) {
  const rows = Array.isArray(data) ? data : [];

  const chartData = rows.map((row) => ({
    bulan: toMonthLabel(row.month),
    ekspor: toCount(row.ekspor),
    pascaPanen: toCount(row.pascaPanen),
    primer: toCount(row.primer),
  }));

  const hasData = chartData.some(
    (row) => row.ekspor > 0 || row.pascaPanen > 0 || row.primer > 0
  );

  return (
    <section
      aria-labelledby="dashboard-tren-title"
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-2 flex flex-col gap-1">
        <h3 id="dashboard-tren-title" className="text-base font-semibold text-slate-900">
          Tren Bulanan Lintas Sektor
        </h3>
        <p className="text-xs text-slate-500">
          Pergerakan jumlah aktivitas Ekspor, Pasca Panen, dan Primer per bulan
        </p>
      </div>

      <div className="h-[340px] w-full">
        {isLoading ? (
          <ChartSkeleton />
        ) : hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="dashboard-gradienEkspor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="bulan" tick={{ fontSize: 12 }} stroke="#cbd5e1" minTickGap={12} />
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
                dataKey="ekspor"
                name="Ekspor"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#dashboard-gradienEkspor)"
              />
              <Line
                type="monotone"
                dataKey="pascaPanen"
                name="Pasca Panen"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="primer"
                name="Primer"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-400">
            Data tren bulanan belum tersedia dari server untuk periode ini.
          </div>
        )}
      </div>
    </section>
  );
}