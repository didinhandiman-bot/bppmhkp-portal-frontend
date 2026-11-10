import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { SpdiListItem, SpdiPagination } from '../../types/spdi';

export interface SpdiTableProps {
  items: SpdiListItem[] | null;
  pagination: SpdiPagination | null;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  /** Nilai input pencarian (dikendalikan halaman agar bisa didebounce). */
  search: string;
  onSearchChange: (value: string) => void;
}

/** Opsi jumlah baris per halaman (backend membatasi `limit` di 100). */
const OPSI_LIMIT = [10, 25, 50];

/**
 * Warna badge status unit.
 *
 * Kolom `status` adalah teks bebas dari sumber data, jadi pemetaan dilakukan
 * berdasar kata kunci yang lazim; nilai lain tetap tampil abu-abu netral.
 */
function badgeStatus(status: string | null): string {
  const value = (status ?? '').trim().toLowerCase();
  if (value === '') return 'bg-slate-50 text-slate-500 ring-slate-200';
  if (value.includes('cabut') || value.includes('tolak') || value.includes('kadaluarsa')) {
    return 'bg-rose-50 text-rose-700 ring-rose-200';
  }
  if (value.includes('proses') || value.includes('-review') || value.includes('verifikasi')) {
    return 'bg-amber-50 text-amber-700 ring-amber-200';
  }
  if (value.includes('terbit') || value.includes('valid') || value.includes('aktif')) {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  }
  return 'bg-slate-50 text-slate-600 ring-slate-200';
}

/** Angka dengan satu desimal bila perlu (skor DB DESIMAL(5,2)). */
function formatSkor(value: number | null): string {
  if (value === null) return '-';
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(safe);
}

const KOLOM = [
  'No',
  'Nama Unit',
  'Nomor Sertifikat',
  'UPT',
  'Provinsi / Kab-Kota',
  'SLA (Hari)',
  'Skor Inspeksi / CDIB',
  'Status',
];

function RowSkeleton() {
  return (
    <tr className="animate-pulse" aria-hidden="true">
      {Array.from({ length: KOLOM.length }).map((_, index) => (
        <td key={index} className="border-b border-slate-100 px-3 py-3">
          <div className="h-3 w-full rounded bg-slate-200" />
        </td>
      ))}
    </tr>
  );
}

/** Label status: kosong/null menjadi strip agar sel tidak render `null`. */
function labelStatus(status: string | null): string {
  const text = (status ?? '').trim();
  return text === '' ? '-' : text;
}

/**
 * Direktori unit SPDI: pencarian, pilihan limit, dan paginasi dari `meta`
 * endpoint `/list` (`{ total, page, limit, totalPages }`).
 */
export default function SpdiTable({
  items,
  pagination,
  isLoading,
  onPageChange,
  onLimitChange,
  search,
  onSearchChange,
}: SpdiTableProps) {
  const rows = Array.isArray(items) ? items : [];

  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const page = pagination?.page ?? 1;
  const limit = pagination?.limit ?? 10;

  const barisAwal = total === 0 ? 0 : (page - 1) * limit + 1;
  const barisAkhir = Math.min(page * limit, total);

  return (
    <section
      aria-label="Direktori Unit SPDI"
      className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-slate-900">Direktori Unit SPDI</h2>
          <span className="text-xs text-slate-500">
            Menampilkan {barisAwal.toLocaleString('id-ID')}–{barisAkhir.toLocaleString('id-ID')} dari{' '}
            {total.toLocaleString('id-ID')} data
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <label htmlFor="spdi-table-search" className="sr-only">
              Cari unit berdasarkan Nama Unit atau Nomor Sertifikat
            </label>
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="spdi-table-search"
              type="search"
              value={search}
              placeholder="Cari Nama Unit / Nomor Sertifikat"
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-64 rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-2.5 text-xs text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="relative">
            <label htmlFor="spdi-table-limit" className="sr-only">
              Jumlah baris per halaman
            </label>
            <select
              id="spdi-table-limit"
              value={limit}
              onChange={(event) => onLimitChange(Number(event.target.value))}
              className="appearance-none rounded-lg border border-slate-300 bg-white py-1.5 pl-2.5 pr-7 text-xs font-medium text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {OPSI_LIMIT.map((option) => (
                <option key={option} value={option}>
                  {option}/halaman
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <caption className="sr-only">
            Direktori unit SPDI beserta sertifikat, UPT, lokasi, SLA, skor, dan status
          </caption>
          <thead className="bg-slate-50">
            <tr>
              {KOLOM.map((kolom) => (
                <th
                  key={kolom}
                  scope="col"
                  className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  {kolom}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => <RowSkeleton key={index} />)
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={KOLOM.length} className="px-3 py-12 text-center text-sm text-slate-400">
                  Tidak ada unit SPDI untuk filter yang dipilih.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id > 0 ? row.id : `spdi-${index}`}
                  className="align-top transition hover:bg-slate-50/70"
                >
                  <td className="px-3 py-2.5 tabular-nums text-slate-500">
                    {barisAwal + index}
                  </td>
                  <td className="max-w-[240px] break-words px-3 py-2.5 font-medium text-slate-900">
                    {row.nama_unit ?? '-'}
                  </td>
                  <td className="max-w-[200px] break-words px-3 py-2.5 text-slate-700">
                    {row.nomor_sertifikat ?? (
                      <span className="text-xs italic text-slate-400">Belum terbit</span>
                    )}
                  </td>
                  <td className="max-w-[200px] break-words px-3 py-2.5 text-slate-700">
                    {row.nama_upt ?? '-'}
                  </td>
                  <td className="max-w-[220px] break-words px-3 py-2.5 text-slate-700">
                    <span className="block">{row.kab_kota ?? '-'}</span>
                    <span className="block text-xs text-slate-400">
                      {row.kd_provinsi ? `Kode ${row.kd_provinsi}` : 'Provinsi tidak diisi'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-slate-700">
                    {row.sla_hari === null ? '-' : row.sla_hari}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-slate-700">
                    <span className="block">{formatSkor(row.skor_inspeksi)}</span>
                    <span className="block text-xs text-slate-400">{formatSkor(row.skor_cdib)}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeStatus(
                        row.status
                      )}`}
                    >
                      {labelStatus(row.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
        <p className="text-xs text-slate-500">
          Halaman {page} dari {Math.max(totalPages, 1)}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isLoading || page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Sebelumnya
          </button>
          <button
            type="button"
            disabled={isLoading || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Berikutnya
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
