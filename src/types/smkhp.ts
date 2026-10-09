import type { UptBreakdownRow } from './upt';

/**
 * Tipe untuk data SMKHP (Sistem Informasi Kendali Mutu dan Harga Produk).
 *
 * Seluruh bentuk di bawah diambil dari response backend yang sedang berjalan,
 * bukan dari tebakan. Semua endpoint modul ini memakai envelope
 * `sendResponse()` yaitu `{ success, message, data, meta? }` — CATATAN: ini
 * key `success`, bukan `status` seperti modul auth. `isApiSuccess()` di
 * `types/api.ts` sudah menangani keduanya.
 */

/** Rentang tanggal hasil resolusi periode backend. */
export interface Periode {
  startDate: string;
  endDate: string;
}

/** Rentang periode pembanding untuk perhitungan YoY. */
export interface PeriodePair {
  periode: Periode;
  previousPeriode: Periode;
}

/** Query param yang dipahami `#buildFilters` / `#buildMatrixFilters`. */
export interface SmkhpFilters {
  /** YYYY-MM-DD, rentang `tanggal_berangkat`. */
  startDate?: string;
  endDate?: string;
  /** Kode UPT, mis. `15.0`. Diabaikan bila `upt` diberikan. */
  kdUpt?: string;
  /** Nama UPT; hanya dipakai bila `kdUpt` kosong. */
  upt?: string;
  negaraTujuan?: string;
  /** Untuk endpoint matriks; bila diisi, mengalah pada startDate/endDate. */
  tahun?: string;
  bulan?: string;
}

/** Query param paginasi `GET /transactions`. */
export interface TransactionPagination {
  page?: number;
  limit?: number;
  search?: string;
}

/** `meta` pada `GET /transactions`. */
export interface TransactionMeta {
  totalRecords: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Satu baris `tr_report_ekspor` dari `GET /transactions`. */
export interface SmkhpTransaction {
  nomor_aju: string;
  kode_upt: string;
  nama_upt: string;
  kode_trader: string;
  nama_trader: string;
  alamat_trader: string;
  npwp: string;
  nama_upi: string;
  no_reg_upi: string | null;
  alamat_upi: string;
  kode_partner: string;
  nama_partner: string;
  alamat_partner: string;
  tanggal_aju: string | null;
  tanggal_smkhp: string | null;
  tanggal_berangkat: string | null;
  bulan: string;
  tahun: string;
  /** `K` = konsumsi, `L` = tawar laut. */
  konsumsi: string | null;
  tawar_laut: string | null;
  ket_bentuk: string;
  kode_pel_asal: string | null;
  pel_asal: string | null;
  kode_pel_muat: string | null;
  pel_muat: string | null;
  kode_negara_partner: string | null;
  negara_tujuan: string;
  kode_pel_bongkar: string | null;
  pel_bongkar: string | null;
  hscode: string | null;
  /** Nama jenis ikan. */
  kel_ikan: string | null;
  id_ikan: string;
  nm_dagang: string | null;
  nm_latin: string | null;
  netto: number;
  jumlah: number;
  /** Dikembalikan `null` oleh backend pada sebagian baris. */
  nilai_per_satuan: number | null;
  satuan: string | null;
  nilai_rupiah: number;
  kurs_usd: number | null;
  no_hc: string | null;
  cara_angkut: string | null;
  alat_angkut: string | null;
  voyage: string | null;
  sumber_produk: string | null;
  propinsi_sumber: string | null;
  kota_sumber: string | null;
  area_tangkap: string | null;
  nama_pembudidaya: string | null;
  kapal_pengolah: string | null;
  status: string | null;
}

/** Satu produk di dalam sel matriks. */
export interface MatrixProductCell {
  product_name: string;
  value_usd_juta: number;
  yoy_percentage: number;
  /** Kontribusi produk terhadap total negara tujuan tersebut. */
  share_percentage: number;
}

/** `GET /top-products-by-destination` — baris matriks per negara. */
export interface MatrixDestinationRow {
  destination: string;
  total_value_usd_juta: number;
  yoy_percentage: number;
  /** Kontribusi negara terhadap total nasional. */
  share_negara_percentage: number;
  top_products: MatrixProductCell[];
}

export type TopProductsByDestinationData = PeriodePair & {
  destinations: MatrixDestinationRow[];
};

/** Satu negara di dalam sel matriks produk. */
export interface MatrixDestinationCell {
  destination: string;
  value_usd_juta: number;
  yoy_percentage: number;
  /** Kontribusi negara terhadap total produk tersebut. */
  share_percentage: number;
}

/** `GET /top-destinations-by-product` — baris matriks per produk. */
export interface MatrixProductRow {
  product_name: string;
  total_value_usd_juta: number;
  yoy_percentage: number;
  /** Kontribusi produk terhadap total nasional. */
  share_product_percentage: number;
  top_destinations: MatrixDestinationCell[];
}

export type TopDestinationsByProductData = PeriodePair & {
  products: MatrixProductRow[];
};

export type UptBreakdownResponse = UptBreakdownRow[];
