import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SpdiUptItem } from '../../types/spdi';

export interface SpdiUptComboChartProps {
  data: SpdiUptItem[] | null;
  isLoading: boolean;
  /** Berapa UPT teratas yang ditampilkan. */
  limit?: number;
}

/** Jumlah UPT teratas per grafik. */
const DEFAULT_LIMIT = 10;

/** Panjang label-Y maksimum supaya panel tidak tergeser terlalu jauh. */
const LEBAR_LABEL = 170;

const WARNA_TOTAL = '#2563eb';
const WARNA_INSPEKSI = '#f59e0b';
const WARNA_CDIB = '#8b5cf6';

function toCount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Rata-rata skor boleh `null` (tidak ada sampel); sumbu skor melewatinya. */
function toScore(value: number | null): number | null {
  if (value === null) return null;
  return Number.isFinite(value) ? value : null;
}

/**
 * Siapkan baris untuk combo chart horizontal.
 *
 * Backend sudah mengurutkan DESC berdasarkan total, jadi cukup slice lalu
 * reverse — Recharts memplot sumbu-Y dari bawah ke atas; tanpa pembalikan,
 * UPT terbesar akan berada di paling bawah.
 */
function prepareRows(rows: SpdiUptItem[] | null, limit: number) {
  const source = Array.isArray(rows) ? rows : [];
  return source
    .filter((row) => row.nama_upt.trim() !== '' && toCount(row.total) > 0)
    .slice(0, limit)
    .map((row) => ({
      name: row.nama_upt.trim().slice(0, 40),
      total: toCount(row.total),
      avgSkorInspeksi: toScore(row.avgSkorInspeksi),
      avgSkorCdib: toScore(row.avgSkorCdib),
    }))
    .reverse();
}

/**
 * Jumlah unit & rata-rata skor per UPT.
 *
 * Dua sumbu-X: sumbu bawah untuk jumlah unit (bar), sumbu atas 0-100 untuk
 * rata-rata skor inspeksi/CDIB (garis bertitik) — skala keduanya berbeda,
 * jadi tidak bisa berbagi satu axis.
 */
export default function SpdiUptComboChart({
  data,
  isLoading,
  limit = DEFAULT_LIMIT,
}: SpdiUptComboChartProps) {
  const rows = prepareRows(data, limit);

  return (
    <section
      aria-labelledby="spdi-upt-title"
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-2 flex flex-col gap-1">
        <h3 id="spdi-upt-title" className="text-base font-semibold text-slate-900">
          Jumlah Unit &amp; Rata-rata Skor per UPT
        </h3>
        <p className="text-xs text-slate-500">
          Bar (sumbu bawah) = jumlah unit; garis (sumbu atas) = rata-rata skor 0-100
        </p>
      </div>

      <div className="h-[320px] w-full">
        {isLoading ? (
          <div
            className="flex h-full animate-pulse items-center justify-center rounded-lg bg-slate-100"
            aria-hidden="true"
          />
        ) : rows.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={rows}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 4, bottom: 4 }}
              barCategoryGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                stroke="#cbd5e1"
                allowDecimals={false}
              />
              <XAxis
                xAxisId="skor"
                type="number"
                orientation="top"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 11 }}
                stroke="#cbd5e1"
              />
              <YAxis
                type="category"
                dataKey="name"
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
              <Bar
                dataKey="total"
                name="Jumlah Unit"
                fill={WARNA_TOTAL}
                radius={[0, 4, 4, 0]}
                maxBarSize={26}
              />
              <Line
                xAxisId="skor"
                type="linear"
                dataKey="avgSkorInspeksi"
                name="Avg Skor Inspeksi"
                stroke={WARNA_INSPEKSI}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls={false}
              />
              <Line
                xAxisId="skor"
                type="linear"
                dataKey="avgSkorCdib"
                name="Avg Skor CDIB"
                stroke={WARNA_CDIB}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-400">
            Belum ada data UPT untuk filter yang dipilih.
          </div>
        )}
      </div>
    </section>
  );
}
