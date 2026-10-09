import { Fish, Loader2 } from 'lucide-react';
import { fetchTopDestinationsByProduct } from '../../services/smkhpService';
import { useMatrixData } from '../../hooks/useMatrixData';
import type {
  MatrixDestinationCell,
  MatrixProductRow,
  TopDestinationsByProductData,
} from '../../types/smkhp';
import { formatPeriodeLabel, formatPersen, formatUsdJuta } from '../../utils/formatters';
import { EmptyState, ErrorState } from './MatrixNotice';
import YoY from './YoY';

const KOLOM_NEGARA = 5;
const LABEL_KOLOM_NEGARA = Array.from({ length: KOLOM_NEGARA }, (_, index) => `Negara ${index + 1}`);

interface DestinationsByProductViewProps {
  /** Tanggal awal rentang (YYYY-MM-DD). */
  startDate?: string;
  /** Tanggal akhir rentang (YYYY-MM-DD). */
  endDate?: string;
  /** Kode UPT terpilih (ternormalisasi). */
  kd_upt?: string;
}

/** Ringkasan komoditas: ikon, nama, total, YoY, share. */
function ProductSummary({
  productName,
  productShare,
  totalValue,
  yoy,
}: {
  productName: string;
  productShare: number;
  totalValue: number;
  yoy: number;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700">
        <Fish className="h-5 w-5 text-white" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800">{productName}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Total <span className="tabular-nums text-slate-700">{formatUsdJuta(totalValue)}</span> USD Jt
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          YoY <YoY value={yoy} /> · Share {formatPersen(productShare)}
        </p>
      </div>
    </div>
  );
}

/** Satu sel negara tujuan: nama, nilai, YoY, dan share. */
function DestinationCell({
  destination,
  compact = false,
}: {
  destination: MatrixDestinationCell;
  compact?: boolean;
}) {
  return (
    <div className={compact ? '' : 'lg:border-l lg:border-slate-100 lg:px-4'}>
      <p className="truncate text-xs font-semibold text-slate-800">{destination.destination}</p>
      <p className="mt-1 text-xs tabular-nums text-slate-500">
        <span className="text-slate-700">{formatUsdJuta(destination.value_usd_juta)}</span> USD Jt
      </p>
      <p className="mt-0.5 text-xs text-slate-500">
        <YoY value={destination.yoy_percentage} /> · Share {formatPersen(destination.share_percentage)}
      </p>
    </div>
  );
}

/** Sel kosong agar jumlah kolom negara tetap konsisten. */
function EmptyDestinationCell() {
  return <div className="hidden lg:block lg:border-l lg:border-slate-100 lg:px-4" />;
}

/** Variasi kartu untuk layar < lg: setiap produk menjadi kartu penuh. */
function ProductCard({ product }: { product: MatrixProductRow }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <ProductSummary
        productName={product.product_name}
        productShare={product.share_product_percentage}
        totalValue={product.total_value_usd_juta}
        yoy={product.yoy_percentage}
      />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {product.top_destinations.map((destination) => (
          <DestinationCell key={destination.destination} destination={destination} compact />
        ))}
      </div>
    </article>
  );
}

/**
 * Tab "Pasar Utama per Produk": baris per komoditas dengan kolom ringkasan
 * produk di kiri dan mini-tabel 5 negara tujuan di kanan.
 */
export default function DestinationsByProductView({
  startDate,
  endDate,
  kd_upt,
}: DestinationsByProductViewProps) {
  const { data, isLoading, errorMessage, reload } = useMatrixData<TopDestinationsByProductData>(
    fetchTopDestinationsByProduct,
    { startDate, endDate, kd_upt },
  );

  const periodeText =
    formatPeriodeLabel(data?.periode?.startDate, data?.periode?.endDate) ||
    formatPeriodeLabel(startDate, endDate) ||
    'periode aktif terpilih';

  const isEmpty =
    Array.isArray(data?.products) &&
    data.products.length > 0 &&
    data.products.every((product) => product.total_value_usd_juta === 0);

  return (
    <section aria-labelledby="matriks-pasar-produk-title">
      <div className="mb-4 flex flex-col gap-1">
        <h2 id="matriks-pasar-produk-title" className="text-lg font-bold text-slate-900">
          Pasar Utama Ekspor Perikanan Indonesia per Produk
        </h2>
        <p className="text-sm text-slate-500">Periode: {periodeText} (USD Juta)</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" aria-hidden="true" />
          <span className="sr-only">Memuat data matriks…</span>
        </div>
      )}

      {!isLoading && errorMessage !== null && (
        <ErrorState message={errorMessage} onRetry={reload} />
      )}

      {!isLoading && errorMessage === null && isEmpty && (
        <EmptyState message="Belum ada data ekspor untuk filter yang dipilih." />
      )}

      {!isLoading && errorMessage === null && !isEmpty && (
        <>
          <div className="space-y-4 lg:hidden">
            {Array.isArray(data?.products) &&
              data.products.map((product) => (
                <ProductCard key={product.product_name} product={product} />
              ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="grid grid-cols-[minmax(0,1.2fr)_repeat(5,minmax(0,1fr))] bg-blue-600 px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white">Komoditas</span>
              {LABEL_KOLOM_NEGARA.map((label) => (
                <span
                  key={label}
                  className="border-l border-blue-500 px-4 text-xs font-bold uppercase tracking-wider text-white"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="divide-y divide-slate-100">
              {Array.isArray(data?.products) &&
                data.products.map((product) => (
                  <div
                    key={product.product_name}
                    className="grid grid-cols-[minmax(0,1.2fr)_repeat(5,minmax(0,1fr))] px-4 py-4"
                  >
                    <div className="pr-4">
                      <ProductSummary
                        productName={product.product_name}
                        productShare={product.share_product_percentage}
                        totalValue={product.total_value_usd_juta}
                        yoy={product.yoy_percentage}
                      />
                    </div>
                    {Array.from({ length: KOLOM_NEGARA }, (_, index) => {
                      const destination = product.top_destinations[index];
                      return destination ? (
                        <DestinationCell key={destination.destination} destination={destination} />
                      ) : (
                        <EmptyDestinationCell key={`empty-${index}`} />
                      );
                    })}
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
