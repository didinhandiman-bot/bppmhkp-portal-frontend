import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export interface HaccpDonutChartProps {
  /** Deret `{ label, total }` yang sudah dinormalkan. */
  data: Array<{ label: string; total: number }>;
  isLoading: boolean;
  title: string;
  description: string;
  /** `id` elemen judul, dipakai sebagai target `aria-labelledby`. */
  titleId: string;
  /** Palet warna; label di luar daftar memakai abu-abu. */
  colors: readonly string[];
  /** Nama sumbu pada tooltip. */
  valueLabel: string;
  emptyMessage: string;
}

/** Warna netral untuk label yang tidak punya warna tersendiri. */
const WARNA_LAIN = '#94a3b8';

function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

/**
 * Donut distribusi generik.
 *
 * Backend tidak mengirim persentase maupun nama warna, jadi persentase
 * dihitung dari total di sini dan warna ditentukan lewat `colors` berurutan.
 * Baris bernilai 0 dibuang supaya legend tidak menampilkan slice tak terlihat.
 */
export default function HaccpDonutChart({
  data,
  isLoading,
  title,
  description,
  titleId,
  colors,
  valueLabel,
  emptyMessage,
}: HaccpDonutChartProps) {
  const rows = data
    .filter((row) => row.label.trim() !== '' && Number.isFinite(row.total) && row.total > 0)
    .map((row) => ({ label: row.label.trim(), total: row.total }));

  const totalSum = rows.reduce((sum, row) => sum + row.total, 0);

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
          <div
            className="flex h-full animate-pulse items-center justify-center rounded-lg bg-slate-100"
            aria-hidden="true"
          />
        ) : rows.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.75rem',
                }}
                formatter={(value: unknown, name: unknown) => {
                  const total = Number(value);
                  const safe = Number.isFinite(total) ? total : 0;
                  const persentase = totalSum > 0 ? Math.round((safe / totalSum) * 1000) / 10 : 0;
                  return [
                    `${formatNumber(safe)} ${valueLabel} (${persentase}%)`,
                    String(name),
                  ];
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              <Pie
                data={rows}
                dataKey="total"
                nameKey="label"
                cx="50%"
                cy="45%"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={2}
                label={({ name }) => String(name)}
                labelLine={false}
              >
                {rows.map((row, index) => (
                  <Cell key={row.label} fill={colors[index] ?? WARNA_LAIN} />
                ))}
              </Pie>
            </PieChart>
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