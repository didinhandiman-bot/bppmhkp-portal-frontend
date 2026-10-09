import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardUptDistribution } from '../../types/dashboard';

export interface DashboardUptBarsProps {
  data: DashboardUptDistribution[] | null;
  isLoading: boolean;
  /** Berapa UPT teratas yang ditampilkan. */
  limit?: number;
}

/** Jumlah UPT teratas per grafik. */
const DEFAULT_LIMIT = 10;

/** Lebar sumbu-Y; nama UPT panjang jadi label dipotong, bukan panel tergeser. */
const LEBAR_LABEL = 170;

function toCount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Siapkan baris untuk bar chart horizontal.
 *
 * Diurutkan menurun lalu dibalik, karena Recharts memplot sumbu-Y dari bawah ke
 * atas — tanpa pembalikan, bar terbesar berada di paling bawah.
 */
function prepareRows(
  rows: DashboardUptDistribution[] | null,
  limit: number
): Array<{ namaUpt: string; ekspor: number; pascaPanen: number; primer: number; grandTotal: number }> {
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((row) => row.namaUpt.trim() !== '' && toCount(row.grandTotal) > 0)
    .sort((a, b) => toCount(b.grandTotal) - toCount(a.grandTotal))
    .slice(0, limit)
    .map((row) => ({
      namaUpt: row.namaUpt.trim(),
      ekspor: toCount(row.ekspor),
      pascaPanen: toCount(row.pascaPanen),
      primer: toCount(row.primer),
      grandTotal: toCount(row.grandTotal),
    }))
    .reverse();
}

function ChartSkeleton() {
  return (
    <div
      className="flex h-full animate-pulse items-center justify-center rounded-lg bg-slate-100"
      aria-hidden="true"
    />
  );
}

/**
 * Sebaran aktivitas per UPT, 10 teratas.
 *
 * `grandTotal` sengaja tidak diplot sebagai batang keempat — ia cuma pemilah
 * peringkat. Baris yang ditampilkan tetap bisa dibaca per pilar lewat legend.
 */
export default function DashboardUptBars({ data, isLoading, limit = DEFAULT_LIMIT }: DashboardUptBarsProps) {
  const rows = prepareRows(data, limit);

  return (
    <section
      aria-labelledby="dashboard-upt-title"
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-2 flex flex-col gap-1">
        <h3 id="dashboard-upt-title" className="text-base font-semibold text-slate-900">
          Top 10 Sebaran UPT
        </h3>
        <p className="text-xs text-slate-500">
          UPT dengan aktivitas tertinggi lintas sektor pada periode aktif
        </p>
      </div>

      <div className="h-[340px] w-full">
        {isLoading ? (
          <ChartSkeleton />
        ) : rows.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 4, bottom: 4 }}
              barCategoryGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#cbd5e1" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="namaUpt"
                tick={{ fontSize: 11 }}
                stroke="#cbd5e1"
                width={LEBAR_LABEL}
                interval={0}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.75rem',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              <Bar dataKey="ekspor" name="Ekspor" fill="#2563eb" radius={[0, 3, 3, 0]} maxBarSize={12} />
              <Bar
                dataKey="pascaPanen"
                name="Pasca Panen"
                fill="#16a34a"
                radius={[0, 3, 3, 0]}
                maxBarSize={12}
              />
              <Bar dataKey="primer" name="Primer" fill="#f59e0b" radius={[0, 3, 3, 0]} maxBarSize={12} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-400">
            Data sebaran UPT belum tersedia dari server untuk periode ini.
          </div>
        )}
      </div>
    </section>
  );
}