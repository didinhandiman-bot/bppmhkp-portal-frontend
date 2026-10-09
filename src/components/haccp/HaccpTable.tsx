import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { HACCP_KOSONG, HACCP_STATUS_LABEL } from '../../types/haccp';
import type { HaccpPagination, HaccpTableItem } from '../../types/haccp';

export interface HaccpTableProps {
  items: HaccpTableItem[] | null;
  pagination: HaccpPagination | null;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  /** Nilai input pencarian (dikendalikan halaman agar bisa didebounce). */
  search: string;
  onSearchChange: (value: string) => void;
}

/** Opsi jumlah baris per halaman. */
const OPSI_LIMIT = [10, 25, 50];

/** Warna badge grade; di luar A-C tetap abu-abu agar tidak disalahartikan. */
const WARNA_GRADE: Record<string, string> = {
  A: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  B: 'bg-amber-50 text-amber-700 ring-amber-200',
  C: 'bg-rose-50 text-rose-700 ring-rose-200',
};

/**
 * Warna badge status.
 *
 * Backend membandingkan `status_sert` secara literal dalam huruf besar, jadi
 * pencocokan juga dilakukan setelah `toUpperCase()`. Nilai lain (bila view
 * punya status tambahan) tetap ditampilkan tanpa warna hijau/merah.
 */
function badgeStatus(status: string | null): string {
  const value = (status ?? '').trim().toUpperCase();
  if (value === 'BERLAKU') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (value === 'KADALUARSA') return 'bg-rose-50 text-rose-700 ring-rose-200';
  return 'bg-slate-50 text-slate-600 ring-slate-200';
}

/** Ubah `status_sert` menjadi label yang enak dibaca. */
function labelStatus(status: string | null): string {
  const value = (status ?? '').trim().toUpperCase();
  if (value === '') return '-';
  return HACCP_STATUS_LABEL[value] ?? value;
}

/**
 * Tanggal sudah dinormalkan service ke `YYYY-MM-DD`, tapi sumbernya bisa ISO
 * lengkap. Ambil bagian tanggalnya saja; kalau tidak ter-parse, kirim apa
 * adanya agar tidak jadi "Invalid Date".
 */
function formatTanggal(value: string | null): string {
  const text = (value ?? '').trim();
  if (text === '') return '-';
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString().slice(0, 10);
}

/** Grade kosong disimpan backend sebagai bucket "Tidak Ada". */
function formatGrade(grade: string | null): string {
  const value = (grade ?? '').trim();
  if (value === '') return HACCP_KOSONG;
  return value;
}

const KOLOM = [
  'Nomor HACCP',
  'Nama UPI',
  'Produk',
  'Kategori',
  'Grade',
  'UPT',
  'Tgl Terbit',
  'Tgl Akhir',
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

/**
 * Tabel daftar sertifikat HACCP: pencarian, pilihan limit, dan paginasi.
 *
 * Kolom dibuat horizontal-scrollable karena totalnya 9; di layar sempit tabel
 * digeser, bukan dipotong.
 */
export default function HaccpTable({
  items,
  pagination,
  isLoading,
  onPageChange,
  onLimitChange,
  search,
  onSearchChange,
}: HaccpTableProps) {
  const rows = Array.isArray(items) ? items : [];

  const totalRows = pagination?.totalRows ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const currentPage = pagination?.currentPage ?? 1;
  const limit = pagination?.limit ?? 10;

  const halamanAwal = totalRows === 0 ? 0 : (currentPage - 1) * limit + 1;
  const halamanAkhir = Math.min(currentPage * limit, totalRows);

  return (
    <section
      aria-label="Daftar HACCP"
      className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-slate-900">Daftar Sertifikat HACCP</h2>
          <span className="text-xs text-slate-500">
            Menampilkan {halamanAwal.toLocaleString('id-ID')}–{halamanAkhir.toLocaleString('id-ID')} dari{' '}
            {totalRows.toLocaleString('id-ID')} data
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <label htmlFor="haccp-table-search" className="sr-only">
              Cari HACCP berdasarkan UPI, produk, kategori, nomor HACCP, atau UPT
            </label>
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="haccp-table-search"
              type="search"
              value={search}
              placeholder="Cari UPI, Produk, Nomor HACCP"
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-64 rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-2.5 text-xs text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="relative">
            <label htmlFor="haccp-table-limit" className="sr-only">
              Jumlah baris per halaman
            </label>
            <select
              id="haccp-table-limit"
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
            Daftar sertifikat HACCP beserta UPI, produk, kategori, dan masa berlaku
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
                  Tidak ada data HACCP untuk filter yang dipilih.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const grade = formatGrade(row.grade);
                return (
                  // `no_haccp` bisa null dan tidak dijamin unik, jadi indeks
                  // digabung agar baris dengan key sama tidak tertukar.
                  <tr
                    key={`${row.no_haccp ?? 'haccp'}-${index}`}
                    className="align-top transition hover:bg-slate-50/70"
                  >
                    <td className="max-w-[200px] break-words px-3 py-2.5 font-medium text-slate-900">
                      {row.no_haccp ?? '-'}
                    </td>
                    <td className="max-w-[240px] break-words px-3 py-2.5 text-slate-800">
                      {row.upi_name ?? '-'}
                    </td>
                    <td className="max-w-[220px] break-words px-3 py-2.5 text-slate-700">
                      {row.nama_produk ?? '-'}
                    </td>
                    <td className="max-w-[180px] break-words px-3 py-2.5 text-slate-700">
                      {row.nama_kategori ?? '-'}
                    </td>
                    <td className="px-3 py-2.5">
                      {grade !== HACCP_KOSONG ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                            WARNA_GRADE[grade.toUpperCase()] ??
                            'bg-slate-50 text-slate-600 ring-slate-200'
                          }`}
                        >
                          {grade}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">{HACCP_KOSONG}</span>
                      )}
                    </td>
                    <td className="max-w-[200px] break-words px-3 py-2.5 text-slate-700">
                      {row.upt ?? '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-slate-700">
                      {formatTanggal(row.tgl_terbit)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-slate-700">
                      {formatTanggal(row.tgl_akhir)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeStatus(
                          row.status_sert
                        )}`}
                      >
                        {labelStatus(row.status_sert)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
        <p className="text-xs text-slate-500">
          Halaman {currentPage} dari {Math.max(totalPages, 1)}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isLoading || currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Sebelumnya
          </button>
          <button
            type="button"
            disabled={isLoading || currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
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