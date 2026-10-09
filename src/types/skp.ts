/**
 * Tipe data modul SKP (Standar Kompetensi Producer).
 *
 * Seluruh nama field mengikuti respons riil backend `/api/v1/skp/*` secara
 * literal — backend memakai `snake_case`, jadi tidak ada alias yang perlu
 * ditebak di lapisan service.
 */

/**
 * Filter status pada tabel.
 *
 * `semua` hanya nilai UI: backend tidak mengenalnya, jadi service membuangnya
 * sebelum request (lihat `toParams` di `services/skpService.ts`).
 */
export type SkpStatusFilter = 'semua' | 'aktif' | 'expired';

/** Parameter query bersama untuk keempat endpoint SKP. */
export interface SkpFilterParams {
  /** Tahun data; default backend adalah tahun berjalan. */
  year?: number;
  /** ID provinsi (bukan nama). Dikirim sebagai `provinsi_id`. */
  provinsiId?: string;
  /** Skala usaha; dikirim sebagai `skala_usaha`. */
  skalaUsaha?: string;
  /** Peringkat Grade A/B/C. */
  peringkat?: string;
  /** Halaman saat ini, mulai 1. */
  page?: number;
  /** Jumlah baris per halaman. */
  limit?: number;
  /** Filter status khusus endpoint `/list`. */
  status?: SkpStatusFilter;
  /** Kata kunci pencarian (UPI, NIB, nomor SKP). */
  search?: string;
}

/** Filter yang benar-benar terpakai backend, seperti echoed di `/summary`. */
export interface SkpAppliedFilters {
  provinsiId: string | null;
  skalaUsaha: string | null;
  peringkat: string | null;
}

/** Isi `data` pada `GET /api/v1/skp/summary`. */
export interface SkpSummaryData {
  /** Tahun periode berjalan. */
  year: number;
  /** Tahun pembanding YoY. */
  previousYear: number;
  /** Jumlah SKP terbit pada `year`. */
  totalTerbit: number;
  /** Jumlah SKP terbit pada `previousYear`. */
  totalTerbitPrevYear: number;
  /** Persentase pertumbuhan; sudah dihitung backend terhadap tahun sebelumnya. */
  yoyGrowth: number;
  /** Sertifikat masih berlaku. */
  totalAktif: number;
  /** Sertifikat melewati masa berlaku. */
  totalExpired: number;
  /** Jumlah UPI unik tersertifikasi. */
  totalUpi: number;
  filters: SkpAppliedFilters;
}

/** Satu titik tren bulanan dari `GET /api/v1/skp/trends`. */
export interface SkpTrendPoint {
  /** Nomor bulan 1-12. */
  month: number;
  /** Label bulan ringkas dari backend ("Jan"). */
  monthName: string;
  /** Jumlah terbit pada tahun berjalan. */
  currentYear: number;
  /** Jumlah terbit pada tahun sebelumnya. */
  previousYear: number;
}

/** Isi `data` pada `GET /api/v1/skp/trends`. */
export interface SkpTrendsData {
  year: number;
  previousYear: number;
  totalCurrentYear: number;
  totalPreviousYear: number;
  data: SkpTrendPoint[];
}

/** Pasangan label-total generik untuk seluruh grafik distribusi. */
export interface SkpLabelTotal {
  label: string;
  total: number;
}

/** Isi `data` pada `GET /api/v1/skp/distribution`. */
export interface SkpDistributionData {
  year: number;
  /** Distribusi Grade A/B/C. */
  byPeringkat: SkpLabelTotal[];
  /** Distribusi skala usaha; dapat memuat label "Tidak Diisi". */
  bySkalaUsaha: SkpLabelTotal[];
  /** 10 jenis olahan teratas. */
  topJenisOlahan: SkpLabelTotal[];
  /** 10 wilayah (provinsi) teratas. */
  topWilayah: SkpLabelTotal[];
}

/** Satu baris tabel pada `GET /api/v1/skp/list`. */
export interface SkpListItem {
  id: number;
  nama_upi: string;
  nib: string | null;
  provinsi_id: string | null;
  provinsi: string | null;
  regency_id: string | null;
  kota_kabupaten: string | null;
  alamat: string | null;
  skala_usaha: string | null;
  /** Permohonan "baru" atau perpanjangan; bukan kolom tabel. */
  jenis_permohonan: string | null;
  tanggal_pengajuan: string | null;
  tanggal_rekomendasi: string | null;
  /** Format YYYY-MM-DD. */
  tanggal_terbit: string | null;
  /** Format YYYY-MM-DD. */
  tanggal_kadaluarsa: string | null;
  nomor_skp: string | null;
  nama_produk: string | null;
  jenis_olahan: string | null;
  peringkat: string | null;
  status: string | null;
}

/** Paginasi pada `meta.pagination` (dipakai `/list`). */
export interface SkpPagination {
  totalRows: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

/** Bentuk respons `/list`: array data + meta terpisah. */
export interface SkpListData {
  items: SkpListItem[];
  pagination: SkpPagination;
}

/**
 * Bucket skala usaha yang diterima backend (`BUCKET_SKALA_USAHA`).
 *
 * Nilai harus persis berupa label, bukan "UsahaMikro": backend membandingkan
 * dengan `BUCKET_SKALA_USAHA.includes(...)` dan diam-diam mengabaikan filter
 * yang tidak cocok. Baris kosong tidak ada di bucket ini — backend mengelompokkan
 *-nya sebagai "Tidak Diisi" pada endpoint distribution.
 */
export const SKP_SKALA_USAHA_OPTIONS = ['Mikro', 'Kecil', 'Menengah', 'Besar'] as const;

/** Label untuk bucket "Tidak Diisi" pada grafik distribusi skala usaha. */
export const SKP_SKALA_KOSONG = 'Tidak Diisi';

/** Opsi grade untuk dropdown filter; backend memvalidasi satu huruf A-Z. */
export const SKP_PERINGKAT_OPTIONS = ['A', 'B', 'C'] as const;

/**
 * Nilai `status` yang diterima backend (`#VALID_STATUS`).
 * `expiring_soon` sengaja tidak dipakai UI karena modul ini hanya
 * menyediakan tab Semua/Aktif/Expired.
 */
export const SKP_STATUS_BACKEND = ['aktif', 'expired', 'expiring_soon'] as const;
