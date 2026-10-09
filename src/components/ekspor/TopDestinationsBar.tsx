import { formatRupiah, formatTon } from '../../utils/formatters';
import type { TopDestinationItem } from '../../types/export';

interface TopDestinationsBarProps {
  /** Daftar negara tujuan dari endpoint `top-destinations`. */
  data: TopDestinationItem[];
}

/** Jumlah negara yang ditampilkan. */
const VISIBLE_COUNT = 5;

/**
 * Peringkat Top 5 negara tujuan ekspor sebagai progress bar horizontal.
 * Pangsa pasar diambil dari `sharePersentase` backend; bila tidak tersedia
 * nilainya dihitung ulang terhadap total lima negara teratas.
 */
export default function TopDestinationsBar({ data }: TopDestinationsBarProps) {
  const ranked = [...data]
    .sort((a, b) => b.totalNilaiRupiah - a.totalNilaiRupiah)
    .slice(0, VISIBLE_COUNT);

  if (ranked.length === 0) {
    return <p className="text-sm text-slate-500">Data negara tujuan tidak tersedia.</p>;
  }

  const totalNilai = ranked.reduce((sum, item) => sum + item.totalNilaiRupiah, 0);

  return (
    <ol className="flex flex-col gap-4">
      {ranked.map((item, index) => {
        const share =
          item.sharePersentase > 0
            ? item.sharePersentase
            : totalNilai > 0
              ? (item.totalNilaiRupiah / totalNilai) * 100
              : 0;

        // Lebar bar mengikuti pangsa pasar, dengan batas minimum agar tetap terlihat.
        const widthPercent = Math.max(2, Math.min(100, share));

        return (
          <li
            key={`${item.kode_negara_partner}-${item.negara_tujuan}`}
            className="flex flex-col gap-1.5"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span
                className="truncate text-sm font-semibold text-slate-800"
                title={item.negara_tujuan}
              >
                {index + 1}. {item.negara_tujuan}
              </span>
              <span className="shrink-0 text-sm font-bold text-blue-700">
                {share.toFixed(2)}%
              </span>
            </div>

            <div
              className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-label={`Pangsa pasar ${item.negara_tujuan}`}
              aria-valuenow={share}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${widthPercent}%` }} />
            </div>

            <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-700">{formatRupiah(item.totalNilaiRupiah)}</span>
              <span>{formatTon(item.totalNettoKg)}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
