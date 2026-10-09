import { Globe2 } from 'lucide-react';
import { formatPersen, formatUsdJuta } from '../../utils/formatters';
import type { MatrixDestinationRow, MatrixProductCell } from '../../types/smkhp';
import YoY from './YoY';

/** Satu baris produk pada kartu destinasi. */
function ProductRow({ product }: { product: MatrixProductCell }) {
  return (
    <li className="flex flex-col gap-1 border-t border-slate-100 py-3 first:border-t-0">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-slate-800">{product.product_name}</span>
        <YoY value={product.yoy_percentage} />
      </div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="tabular-nums text-slate-500">
          {formatUsdJuta(product.value_usd_juta)}{' '}
          <span className="text-slate-400">USD Jt</span>
        </span>
        <span className="text-slate-500">Share {formatPersen(product.share_percentage)}</span>
      </div>
    </li>
  );
}

/**
 * Kartu setiap negara/wilayah tujuan: header biru (aksen portal), ringkasan
 * Total (nilai, YoY, share), lalu daftar produk teratas beserta nilai, YoY,
 * dan pangsa masing-masing.
 */
export default function DestinationCard({ destination }: { destination: MatrixDestinationRow }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center gap-2 bg-blue-600 px-4 py-3">
        <Globe2 className="h-5 w-5 shrink-0 text-blue-100" aria-hidden="true" />
        <h3 className="truncate text-sm font-bold uppercase tracking-wide text-white">
          {destination.destination}
        </h3>
      </header>

      <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Total
        </span>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-2xl font-bold tabular-nums text-slate-900">
            {formatUsdJuta(destination.total_value_usd_juta)}
          </span>
          <span className="text-xs font-medium text-slate-500">USD Juta</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="text-slate-500">
            YoY <YoY value={destination.yoy_percentage} />
          </span>
          <span className="text-slate-500">
            Share {formatPersen(destination.share_negara_percentage)}
          </span>
        </div>
      </div>

      <ul className="flex-1 px-4 pb-3">
        {destination.top_products.length > 0 ? (
          destination.top_products.map((product) => (
            <ProductRow key={product.product_name} product={product} />
          ))
        ) : (
          <li className="py-6 text-center text-xs text-slate-400">Belum ada data produk.</li>
        )}
      </ul>
    </article>
  );
}
