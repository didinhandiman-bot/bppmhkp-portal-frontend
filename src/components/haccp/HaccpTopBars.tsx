import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface HaccpTopBarsProps {
  /** Deret `{ label, total }`; backend sudah mengurutkan menurun & membatasi 10. */
  data: Array<{ label: string; total: number }>;
  isLoading: boolean;
  title: string;
  description: string;
  /** `id` elemen judul, dipakai sebagai target `aria-labelledby`. */
  titleId: string;
  color: string;
  /** Nama seri pada tooltip. */
  valueLabel: string;
  emptyMessage: string;
  /** Berapa baris teratas yang ditampilkan. */
  limit?: number;
}

/** Jumlah baris teratas per grafik; default 10 sesuai backend. */
const DEFAULT_LIMIT = 10;

/** Panjang label-Y maksimum supaya panel tidak tergeser terlalu jauh. */
const LEBAR_LABEL = 170;

function toCount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Siapkan baris untuk bar chart horizontal.
 *
 * Diurutkan menurun lalu dibalik, karena Recharts memplot sumbu-Y dari bawah ke
 * atas — tanpa pembalikan, bar terbesar akan berada di paling bawah.
 */
function prepareRows(
  rows: Array<{ label: string; total: number }>,
  limit: number
): Array<{ name: string; total: number }> {
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((row) => row.label.trim() !== '' && toCount(row.total) > 0)
    .sort((a, b) => toCount(b.total) - toCount(a.total))
    .slice(0, limit)
    .map((row) => ({ name: row.label.trim(), total: toCount(row.total) }))
    .reverse();
}

function PanelSkeleton() {
  return (
    <div
      className="flex h-full animate-pulse flex-col rounded-lg bg-slate-100 p-3"
      aria-hidden="true"
    >
      <div className="h-full w-full rounded bg-slate-200/60" />
    </div>
  );
}

/** Bar chart horizontal generik: satu panel untuk satu deret label-total. */
export default function HaccpTopBars({
  data,
  isLoading,
  title,
  description,
  titleId,
  color,
  valueLabel,
  emptyMessage,
  limit = DEFAULT_LIMIT,
}: HaccpTopBarsProps) {
  const rows = prepareRows(data, limit);

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-2 flex flex-col gap-1">
        <h3 id={titleId} className="text-base font-semibold text-slate-900">
          {title}
        </h3>
        <p className="text-xs text-slate-500">{description}</p>
      </div>

      <div className="h-[300px] w-full">
        {isLoading ? (
          <PanelSkeleton />
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
              <Bar
                dataKey="total"
                name={valueLabel}
                fill={color}
                radius={[0, 4, 4, 0]}
                maxBarSize={26}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-400">
            {emptyMessage}
          </div>
        )}
      </div>
    </section>
  );
}