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
import type { TooltipContentProps } from 'recharts';
import { formatBulan, formatRupiah, formatTon } from '../../utils/formatters';
import type { MonthlyTrendItem } from '../../types/export';

interface MonthlyTrendChartProps {
  /** Deret waktu bulanan dari endpoint `monthly-trends`. */
  data: MonthlyTrendItem[];
}

/** Warna batang tonase (aksen blue-600, selaras dengan portal). */
const BAR_COLOR = '#2563eb';
/** Warna garis nilai rupiah. */
const LINE_COLOR = '#0f172a';
/** Tinggi area chart agar `ResponsiveContainer` punya acuan ukuran. */
const CHART_HEIGHT = 320;

/** Label bulan ringkas untuk sumbu X. */
const BULAN_SINGKAT: readonly string[] = [
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

/** Formatter ringkas untuk label sumbu agar tidak memakan lebar chart. */
const compactNumber = new Intl.NumberFormat('id-ID', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** Baris chart yang sudah dilengkapi label bulan dan urutan. */
interface ChartRow {
  bulan: string;
  labelSumbu: string;
  namaBulan: string;
  totalNettoTon: number;
  totalNilaiRupiah: number;
  totalDokumenHc: number;
  urutan: number;
}

/**
 * Menyusun baris chart: bulan diurutkan 1-12 dan diberi label.
 * Backend mengembalikan bulan sebagai string tanpa urutan (`"1"`, `"10"`, `"2"`, ...),
 * sehingga pengurutan wajib dilakukan di sisi klien.
 */
function toChartRows(data: MonthlyTrendItem[]): ChartRow[] {
  return data
    .map((item) => {
      const parsed = Number.parseInt(item.bulan, 10);
      const isValid = Number.isInteger(parsed) && parsed >= 1 && parsed <= 12;

      return {
        bulan: item.bulan,
        labelSumbu: isValid ? BULAN_SINGKAT[parsed - 1] : item.bulan,
        namaBulan: formatBulan(item.bulan),
        totalNettoTon: item.totalNettoTon,
        totalNilaiRupiah: item.totalNilaiRupiah,
        totalDokumenHc: item.totalDokumenHc,
        urutan: isValid ? parsed : Number.MAX_SAFE_INTEGER,
      };
    })
    .sort((a, b) => a.urutan - b.urutan);
}

/** Membaca baris data mentah dari payload tooltip tanpa memakai `any`. */
function readRow(source: unknown): ChartRow | null {
  if (typeof source !== 'object' || source === null) {
    return null;
  }
  const row = source as Partial<ChartRow>;
  return typeof row.namaBulan === 'string' ? (row as ChartRow) : null;
}

/** Tooltip kustom: nama bulan lengkap, tonase, nilai rupiah, dan jumlah dokumen HC. */
function MonthlyTrendTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const row = readRow(payload[0]?.payload);

  if (!row) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-md">
      <p className="mb-2 font-semibold text-slate-900">{row.namaBulan}</p>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BAR_COLOR }} />
            Tonase
          </span>
          <span className="font-semibold text-slate-900">
            {formatTon(row.totalNettoTon, 'ton')}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: LINE_COLOR }} />
            Nilai Ekspor
          </span>
          <span className="font-semibold text-slate-900">{formatRupiah(row.totalNilaiRupiah)}</span>
        </div>

        <div className="mt-1 flex items-center justify-between gap-4 border-t border-slate-100 pt-1 text-slate-500">
          <span>Dokumen HC</span>
          <span className="font-medium text-slate-700">
            {new Intl.NumberFormat('id-ID').format(row.totalDokumenHc)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Dual-axis chart: batang untuk volume tonase (sumbu kiri) dan
 * garis untuk nilai rupiah (sumbu kanan).
 */
export default function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const rows = toChartRows(data);

  if (rows.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-slate-500">
        Data tren bulanan tidak tersedia.
      </div>
    );
  }

  return (
    <div style={{ height: CHART_HEIGHT }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

          <XAxis
            dataKey="labelSumbu"
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />

          <YAxis
            yAxisId="tonase"
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(value: number) => compactNumber.format(value)}
          />

          <YAxis
            yAxisId="rupiah"
            orientation="right"
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(value: number) => `Rp ${compactNumber.format(value)}`}
          />

          <Tooltip content={MonthlyTrendTooltip} cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }} />

          <Legend
            verticalAlign="top"
            align="right"
            height={28}
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: '#64748b' }}
          />

          <Bar
            yAxisId="tonase"
            dataKey="totalNettoTon"
            name="Tonase (Ton)"
            fill={BAR_COLOR}
            radius={[4, 4, 0, 0]}
            maxBarSize={38}
          />

          <Line
            yAxisId="rupiah"
            type="monotone"
            dataKey="totalNilaiRupiah"
            name="Nilai Ekspor (Rp)"
            stroke={LINE_COLOR}
            strokeWidth={2}
            dot={{ r: 3, fill: LINE_COLOR }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
