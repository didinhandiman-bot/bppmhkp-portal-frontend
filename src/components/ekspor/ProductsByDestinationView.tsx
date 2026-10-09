import { fetchTopProductsByDestination } from '../../services/smkhpService';
import { useMatrixData } from '../../hooks/useMatrixData';
import type { TopProductsByDestinationData } from '../../types/smkhp';
import { formatPeriodeLabel } from '../../utils/formatters';
import DestinationCard from './DestinationCard';
import { EmptyState, ErrorState } from './MatrixNotice';
import SkeletonMatrixCards from './SkeletonMatrixCards';

interface ProductsByDestinationViewProps {
  /** Tanggal awal rentang (YYYY-MM-DD). */
  startDate?: string;
  /** Tanggal akhir rentang (YYYY-MM-DD). */
  endDate?: string;
  /** Kode UPT terpilih (ternormalisasi). */
  kd_upt?: string;
}

/**
 * Tab "Produk Utama di Negara Tujuan": grid kartu destinasi (header biru)
 * dengan nilai Total, YoY, share nasional, dan daftar produk teratas.
 */
export default function ProductsByDestinationView({
  startDate,
  endDate,
  kd_upt,
}: ProductsByDestinationViewProps) {
  const { data, isLoading, errorMessage, reload } = useMatrixData<TopProductsByDestinationData>(
    fetchTopProductsByDestination,
    { startDate, endDate, kd_upt },
  );

  const periodeText =
    formatPeriodeLabel(data?.periode?.startDate, data?.periode?.endDate) ||
    formatPeriodeLabel(startDate, endDate) ||
    'periode aktif terpilih';

  // respons dengan semua nilai nol diperlakukan sebagai "belum ada data",
  // sama seperti state kosong agar tidak menampilkan kartu kosong.
  const isEmpty =
    Array.isArray(data?.destinations) &&
    data.destinations.length > 0 &&
    data.destinations.every((dest) => dest.total_value_usd_juta === 0);

  return (
    <section aria-labelledby="matriks-produk-tujuan-title">
      <div className="mb-4 flex flex-col gap-1">
        <h2 id="matriks-produk-tujuan-title" className="text-lg font-bold text-slate-900">
          Produk Utama Ekspor Perikanan Indonesia di Negara Tujuan
        </h2>
        <p className="text-sm text-slate-500">Periode: {periodeText} (USD Juta)</p>
      </div>

      {isLoading && <SkeletonMatrixCards />}

      {!isLoading && errorMessage !== null && (
        <ErrorState message={errorMessage} onRetry={reload} />
      )}

      {!isLoading && errorMessage === null && isEmpty && (
        <EmptyState message="Belum ada data ekspor untuk filter yang dipilih." />
      )}

      {!isLoading && errorMessage === null && !isEmpty && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {Array.isArray(data?.destinations) &&
            data.destinations.map((destination) => (
              <DestinationCard key={destination.destination} destination={destination} />
            ))}
        </div>
      )}
    </section>
  );
}
