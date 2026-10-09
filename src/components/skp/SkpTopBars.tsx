import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SkpLabelTotal } from '../../types/skp';

export interface SkpTopBarsProps {
  /** 10 wilayah teratas dari `/distribution`. */
  wilayah: SkpLabelTotal[] | null;
  /** 10 jenis olahan teratas dari `/distribution`. */
  jenisOlahan: SkpLabelTotal[] | null;
  isLoading: boolean;
  year: number;
  /** Berapa baris teratas yang ditampilkan per grafik. */
  limit?: number;
}

/** Jumlah baris teratas per grafik; default 10 sesuai backend. */
const DEFAULT_LIMIT = 10;

/** Panjang label-Y maksimum supaya panel tidak tergeser terlalu jauh. */
const LEBAR_LABEL = 150;

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
function prepareRows(rows: SkpLabelTotal[] | null, limit: number): Array<{ name: string; total: number }> {
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
      className="flex h-[360px] animate-pulse flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-hidden="true"
    >
      <div className="h-3 w-32 rounded bg-slate-200" />
      <div className="mt-2 h-2 w-44 rounded bg-slate-200" />
      <div className="mt-4 flex-1 rounded-lg bg-slate-100" />
    </div>
  );
}

/** Panel satu grafik: judul, deskripsi, dan bar chart horizontal. */
function Panel({
  title,
  description,
  rows,
  color,
  isLoading,
  ariaLabelledBy,
  emptyMessage,
}: {
  title: string;
  description: string;
  rows: Array<{ name: string; total: number }>;
  color: string;
  isLoading: boolean;
  ariaLabelledBy: string;
  emptyMessage: string;
}) {
  return (
    <section
      aria-labelledby={ariaLabelledBy}
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-2 flex flex-col gap-1">
        <h3 id={ariaLabelledBy} className="text-base font-semibold text-slate-900">
          {title}
        </h3>
        <p className="text-xs text-slate-500">{description}</p>
      </div>

      <div className="h-[320px] w-full">
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
              <Bar dataKey="total" name="Jumlah SKP" fill={color} radius={[0, 4, 4, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            {emptyMessage}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Dua grafik batang horizontal: Top 10 wilayah dan Top 10 jenis olahan.
 * Berdampingan di desktop, bertumpuk di layar sempit.
 */
export default function SkpTopBars({
  wilayah,
  jenisOlahan,
  isLoading,
  year,
  limit = DEFAULT_LIMIT,
}: SkpTopBarsProps) {
  const wilayahRows = prepareRows(wilayah, limit);
  const olahanRows = prepareRows(jenisOlahan, limit);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel
        ariaLabelledBy="skp-top-wilayah-title"
        title="Top 10 Wilayah"
        description={`Provinsi dengan SKP terbanyak tahun ${year}`}
        rows={wilayahRows}
        color="#2563eb"
        isLoading={isLoading}
        emptyMessage={`Belum ada data wilayah untuk tahun ${year}.`}
      />
      <Panel
        ariaLabelledBy="skp-top-olahan-title"
        title="Top 10 Jenis Olahan"
        description={`Jenis pengolahan dengan SKP terbanyak tahun ${year}`}
        rows={olahanRows}
        color="#16a34a"
        isLoading={isLoading}
        emptyMessage={`Belum ada data jenis olahan untuk tahun ${year}.`}
      />
    </div>
  );
}
