import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { HaccpMonthlyTrendItem } from '../../types/haccp';

export interface HaccpTrendChartProps {
  data: HaccpMonthlyTrendItem[] | null;
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
 * Ubah `YYYY-MM` menjadi label sumbu-X.
 *
 * Backend hanya/group by pada bulan yang benar-benar ada, jadi tren bisa
 * melompati bulan tanpa data (mis. hanya Mar dan Agu). Menambah bulan kosong
 * di antaranya membuat kemiringan garis jauh lebih jujur daripada menyambung
 * dua titik yang secara visual bersebelahan.
 */
function toMonthLabel(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) return value.trim();

  const year = match[1];
  const monthIndex = Number(match[2]) - 1;
  const name = BULAN_PENDEK[monthIndex];
  if (!name) return value.trim();
  // Tahun cukup dua digit terakhir supaya label tidak mendominasi sumbu.
  return `${name} ${year.slice(2)}`;
}

/** Pecah `YYYY-MM` menjadi `{ year, monthIndex }`; null bila tidak valid. */
function parseMonth(value: string): { year: number; monthIndex: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;
  return { year: Number(match[1]), monthIndex };
}

/** Selisih bulan absolut, aman untuk lintas tahun. */
function monthDistance(a: { year: number; monthIndex: number }, b: { year: number; monthIndex: number }): number {
  return (b.year - a.year) * 12 + (b.monthIndex - a.monthIndex);
}

function toCount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Isi celah bulan yang tidak ada barisnya dengan total 0. */
function fillGap(points: HaccpMonthlyTrendItem[]): HaccpMonthlyTrendItem[] {
  const parsed = points
    .map((point) => ({ point, period: parseMonth(point.bulan) }))
    .filter((row): row is { point: HaccpMonthlyTrendItem; period: { year: number; monthIndex: number } } =>
      row.period !== null
    )
    .sort((a, b) => monthDistance(a.period, b.period));

  if (parsed.length <= 1) return parsed.map((row) => row.point);

  const filled: HaccpMonthlyTrendItem[] = [parsed[0].point];

  for (let index = 1; index < parsed.length; index += 1) {
    const previous = parsed[index - 1];
    const current = parsed[index];
    const gap = monthDistance(previous.period, current.period);

    // Isi bulan di antaranya dengan 0 agar garis tidak melompati periode kosong.
    for (let step = 1; step < gap; step += 1) {
      const monthIndex = (previous.period.monthIndex + step) % 12;
      const year =
        previous.period.year + Math.floor((previous.period.monthIndex + step) / 12);
      filled.push({
        bulan: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
        total: 0,
      });
    }

    filled.push(current.point);
  }

  return filled;
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
 * Tren penerbitan sertifikat HACCP per bulan.
 *
 * Hanya ada satu seri (tahun berjalan), jadi tidak perlu pembanding seperti
 * di modul SKP: backend tidak mengirim data tahun sebelumnya.
 */
export default function HaccpTrendChart({ data, isLoading }: HaccpTrendChartProps) {
  const chartData = fillGap(Array.isArray(data) ? data : []).map((point) => ({
    bulan: toMonthLabel(point.bulan),
    total: toCount(point.total),
  }));

  const hasData = chartData.some((row) => row.total > 0);

  return (
    <section
      aria-labelledby="haccp-tren-title"
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-2 flex flex-col gap-1">
        <h3 id="haccp-tren-title" className="text-base font-semibold text-slate-900">
          Tren Penerbitan Bulanan
        </h3>
        <p className="text-xs text-slate-500">
          Jumlah sertifikat HACCP yang terbit per bulan pada periode aktif
        </p>
      </div>

      <div className="h-[320px] w-full">
        {isLoading ? (
          <ChartSkeleton />
        ) : hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="haccp-gradienTren" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#haccp-gradienTren)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Belum ada data tren penerbitan untuk periode yang dipilih.
          </div>
        )}
      </div>
    </section>
  );
}