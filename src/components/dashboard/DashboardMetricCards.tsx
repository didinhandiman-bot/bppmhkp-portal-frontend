import { FileCheck2, Layers, Ship, Sprout } from 'lucide-react';
import type { DashboardSummaryKpi } from '../../types/dashboard';

export interface DashboardMetricCardsProps {
  scopeLimited?: boolean;
  data: DashboardSummaryKpi | null;
  isLoading: boolean;
}

/** Angka bulat dengan pemisah ribuan gaya Indonesia. */
function formatCount(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('id-ID').format(safe);
}

/**
 * Volume ekspor ditampilkan dalam ton dengan pembulatan 2 desimal.
 *
 * `totalVolumeTon` dari backend = kg / 1000, jadi untuk nilai kecil (mis. 0,4
 * ton) pembulatan ini masih informatif; kilogram mentah dicetak sebagai
 * catatan kecil agar angkanya tidak hilang begitu saja.
 */
function formatTon(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(safe);
}

/** Rupiah penuh; ringkas ke ribuan/jutaan agar tidak memenuhi kartu. */
function formatRupiah(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(safe);
}

/** Ringkas rupiah ke satuan besar: rb / jt / M / M. */
function formatRupiahRingkas(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const absolute = Math.abs(safe);
  if (absolute >= 1e12) return `Rp ${(safe / 1e12).toFixed(1).replace('.', ',')} T`;
  if (absolute >= 1e9) return `Rp ${(safe / 1e9).toFixed(1).replace('.', ',')} M`;
  if (absolute >= 1e6) return `Rp ${(safe / 1e6).toFixed(1).replace('.', ',')} jt`;
  if (absolute >= 1e3) return `Rp ${(safe / 1e3).toFixed(0)} rb`;
  return formatRupiah(safe);
}

function CardSkeleton() {
  return (
    <div
      className="flex animate-pulse flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <div className="h-3 w-32 rounded bg-slate-200" />
        <div className="h-10 w-10 rounded-lg bg-slate-200" />
      </div>
      <div className="mt-4 h-8 w-36 rounded bg-slate-200" />
      <div className="mt-3 h-3 w-24 rounded bg-slate-200" />
      <div className="mt-4 h-3 w-full rounded bg-slate-100" />
    </div>
  );
}

/** Baris angka kecil di bawah nilai utama. */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold tabular-nums text-slate-700">{value}</span>
    </div>
  );
}

/**
 * Empat kartu metrik lintas pilar: Ekspor, Pasca Panen, Primer, dan total
 * nasional.
 *
 * Kolom: 1 di mobile, 2 di tablet, 4 di desktop.
 */
export default function DashboardMetricCards({ data, isLoading, scopeLimited = false }: DashboardMetricCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    );
  }

  const kpi = data;
  const ekspor = kpi?.ekspor;
  const pascaPanen = kpi?.pascaPanen;
  const primer = kpi?.primer;

  /*
   * Aturan bisnis: 9 sertifikasi mutu BPPMHKP = 3 Pasca Panen
   * (SKP + HACCP + SPDI) + 6 layanan Primer.
   *
   * Total ini dihitung ulang di frontend, bukan diambil dari
   * `pascaPanen.totalSertifikatTerbit`, karena angka backend itu = SKP + SMKHP
   * + HACCP sehingga masih memasukkan SMKHP. SPDI belum ada di backend, jadi
   * selalu 0 sampai repository mengirimkannya.
   */
  const totalSkp = pascaPanen?.skp.total ?? 0;
  const totalHaccp = pascaPanen?.haccp.total ?? 0;
  const totalSpdi = pascaPanen?.spdi ?? 0;
  const totalPascaPanen = totalSkp + totalHaccp + totalSpdi;
  const totalPrimer = primer?.totalSertifikat ?? 0;
  const totalNasional = totalPascaPanen + totalPrimer;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* 1. Sektor Ekspor */}
      <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-slate-500">Sektor Ekspor</p>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600">
            <Ship className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold tabular-nums text-slate-900">
            {formatTon(ekspor?.totalVolumeTon ?? 0)}
            <span className="ml-1 text-base font-semibold text-slate-500">Ton</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatCount(ekspor?.totalVolumeKg ?? 0)} kg volume bersih
          </p>
        </div>
        <div className="mt-4 flex flex-1 flex-col gap-2">
          <DetailRow label="Total Frekuensi" value={formatCount(ekspor?.totalFrekuensi ?? 0)} />
          <DetailRow label="Total Pengajuan" value={formatCount(ekspor?.totalPengajuan ?? 0)} />
          <DetailRow label="Nilai Ekspor" value={formatRupiahRingkas(ekspor?.totalNilaiRupiah ?? 0)} />
        </div>
      </article>

      {/* 2. Sertifikasi Pasca Panen */}
      <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-slate-500">Sertifikasi Pasca Panen</p>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600">
            <FileCheck2 className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold tabular-nums text-slate-900">
            {formatCount(totalPascaPanen)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Sertifikat terbit (SKP + HACCP + SPDI)</p>
        </div>
        {/*
         * Baris SMKHP dihapus sesuai aturan bisnis: SMKHP tidak dihitung sebagai
         * sertifikasi pasca panen, sedangkan angka backend
         * `totalSertifikatTerbit` masih menghitungnya. Baris Pending juga
         * dihapus karena kartu ini hanya menampilkan sertifikat terbit.
         */}
        <div className="mt-4 flex flex-1 flex-col gap-2">
          <DetailRow label="SKP" value={formatCount(totalSkp)} />
          <DetailRow label="HACCP" value={formatCount(totalHaccp)} />
          <DetailRow label="SPDI" value={formatCount(totalSpdi)} />
        </div>
      </article>

      {/* 3. Sertifikasi Primer */}
      <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-slate-500">Sertifikasi Primer</p>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-600">
            <Sprout className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold tabular-nums text-slate-900">
            {formatCount(primer?.totalSertifikat ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Sertifikat terbit (CPIB, CBIB, CPPIB, CPOIB, CDOIB, CPIB Kapal)
          </p>
        </div>
        {/*
         * Rincian per jenis izin. Urutannya mengikuti urutan pada
         * `primerRepository.getAggregatedSummary` supaya mudah dicocokkan dengan
         * query backend. Tujuh baris membuat kartu ini lebih tinggi daripada
         * tiga kartu lain; tinggi grid tetap seragam karena stretch, sementara
         * `flex-1` di sini menjaga baris Pending menempel ke dasar kartu —
         * posisinya sejajar dengan Pending di kartu Pasca Panen.
         */}
        <div className="mt-4 flex flex-1 flex-col gap-2">
          <DetailRow label="CPIB" value={formatCount(primer?.detail?.cpib ?? 0)} />
          <DetailRow label="CBIB" value={formatCount(primer?.detail?.cbib ?? 0)} />
          <DetailRow label="CPPIB" value={formatCount(primer?.detail?.cppib ?? 0)} />
          <DetailRow label="CPOIB" value={formatCount(primer?.detail?.cpoib ?? 0)} />
          <DetailRow label="CDOIB" value={formatCount(primer?.detail?.cdoib ?? 0)} />
          <DetailRow label="CPIB Kapal" value={formatCount(primer?.detail?.cpibKapal ?? 0)} />
        </div>
      </article>

      {/* 4. Total Sertifikasi Nasional */}
      <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-slate-500">{scopeLimited ? 'Total Sertifikasi Wilayah UPT' : 'Total Sertifikasi Nasional'}</p>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
            <Layers className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
        </div>
<div className="mt-4">
          <p className="text-3xl font-bold tabular-nums text-slate-900">
            {formatCount(totalNasional)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            9 sertifikasi mutu (SKP + HACCP + SPDI + 6 layanan primer)
          </p>
        </div>
        {/*
         * `totalNasional` dihitung ulang di frontend. Nilai
         * `kpi.totalSertifikasiNasional` dari backend tidak dipakai lagi karena
         * dihitung dari `pascaPanen.totalSertifikatTerbit` yang masih
         * memasukkan SMKHP, sehingga tidak lagi cocok dengan aturan 9 sertifikasi.
         * Karena itu baris "Selisih terhadap jumlah pilar" juga dihapus — ia
         * selalu menunjukkan selisih sebesar jumlah SMKHP dan akan terlihat
         * seperti bug, bukan seperti informasi.
         */}
        <div className="mt-4 flex flex-1 flex-col gap-2">
          <DetailRow label="Kontribusi Pasca Panen" value={formatCount(totalPascaPanen)} />
          <DetailRow label="Kontribusi Primer" value={formatCount(totalPrimer)} />
        </div>
      </article>
    </div>
  );
}