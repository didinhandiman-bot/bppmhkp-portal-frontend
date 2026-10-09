import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { SkpLabelTotal } from '../../types/skp';

export interface SkpGradeDonutProps {
  data: SkpLabelTotal[] | null;
  isLoading: boolean;
  year: number;
}

/**
 * Warna per grade.
 *
 * `byPeringkat` berisi Grade A/B/C dengan label backend apa adanya. Grade di
 * luar A/B/C mendapat warna abu-abu agar tidak disalahartikan sebagai valid.
 */
const WARNA_GRADE: Record<string, string> = {
  A: '#16a34a',
  B: '#f59e0b',
  C: '#ef4444',
};

/** Label bucket yang tidak mewakili grade. */
const WARNA_LAIN = '#94a3b8';

function toCount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function DonutSkeleton() {
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
 * Donut distribusi peringkat (Grade A/B/C).
 *
 * Backend tidak mengirim persentase, jadi dihitung di sini dari total. Grade
 * dengan nilai nol tetap dibuang agar legend tidak berdesakan.
 */
export default function SkpGradeDonut({ data, isLoading, year }: SkpGradeDonutProps) {
  const rows = Array.isArray(data) ? data.filter((row) => toCount(row.total) > 0) : [];

  const chartData = rows.map((row) => ({
    name: `Grade ${row.label}`,
    total: toCount(row.total),
  }));
  const totalSum = chartData.reduce((sum, row) => sum + row.total, 0);

  return (
    <section
      aria-labelledby="skp-grade-title"
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-2 flex flex-col gap-1">
        <h3 id="skp-grade-title" className="text-base font-semibold text-slate-900">
          Distribusi Peringkat
        </h3>
        <p className="text-xs text-slate-500">Grade A, B, dan C tahun {year}</p>
      </div>

      <div className="h-[320px] w-full">
        {isLoading ? (
          <DonutSkeleton />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.75rem',
                }}
                formatter={(value: unknown) => {
                  const total = toCount(value);
                  // Persentase dihitung dari total yang sudah dinormalkan ke 0,
                  // sehingga tidak mungkin menghasilkan NaN.
                  const persentase = totalSum > 0 ? Math.round((total / totalSum) * 1000) / 10 : 0;
                  return [`${total.toLocaleString('id-ID')} SKP (${persentase}%)`, String(name)];
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              <Pie
                data={chartData}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius={62}
                outerRadius={96}
                paddingAngle={2}
                label={({ name }) => String(name)}
                labelLine={false}
              >
                {chartData.map((row) => (
                  <Cell
                    key={row.name}
                    fill={WARNA_GRADE[row.name.replace('Grade ', '')] ?? WARNA_LAIN}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Belum ada data distribusi peringkat untuk tahun {year}.
          </div>
        )}
      </div>
    </section>
  );
}
