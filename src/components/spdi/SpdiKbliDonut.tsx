import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { SpdiKbliItem } from '../../types/spdi';

export interface SpdiKbliDonutProps {
  /** Slice `{ kode, total }`; bucket `Lainnya` sudah digabung backend. */
  data: SpdiKbliItem[] | null;
  isLoading: boolean;
}

/** Palet warna slice; urutan mengikuti frekuensi DESC dari backend. */
const WARNA_DONUT = [
  '#0891b2',
  '#2563eb',
  '#16a34a',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#94a3b8',
] as const;

function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

/**
 * Donut sebaran sektor usaha (KBLI).
 *
 * Backend mengirim frekuensi per kode KBLI (satu baris bisa memuat beberapa
 * kode) dan sudah menggabung irisan kecil ke bucket `Lainnya`, jadi frontend
 * tinggal memplot tanpa agregasi tambahan. Baris bernilai 0 dibuang agar
 * legend tidak menampilkan slice tak terlihat.
 */
export default function SpdiKbliDonut({ data, isLoading }: SpdiKbliDonutProps) {
  const rows = (Array.isArray(data) ? data : [])
    .filter((row) => row.kode.trim() !== '' && Number.isFinite(row.total) && row.total > 0)
    .map((row) => ({ label: row.kode.trim(), total: row.total }));

  const totalSum = rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <section
      aria-labelledby="spdi-kbli-title"
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-2 flex flex-col gap-1">
        <h3 id="spdi-kbli-title" className="text-base font-semibold text-slate-900">
          Sebaran Sektor Usaha (KBLI)
        </h3>
        <p className="text-xs text-slate-500">Frekuensi kode KBLI pada unit SPDI; sisanya dirangkum ke &quot;Lainnya&quot;</p>
      </div>

      <div className="h-[320px] w-full">
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
                  return [`${formatNumber(safe)} unit (${persentase}%)`, String(name)];
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
                  <Cell key={row.label} fill={WARNA_DONUT[index] ?? WARNA_DONUT[WARNA_DONUT.length - 1]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-400">
            Belum ada data KBLI untuk filter yang dipilih.
          </div>
        )}
      </div>
    </section>
  );
}
