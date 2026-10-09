/**
 * Tipe untuk master UPT.
 *
 * Endpoint master `GET /api/v1/options/upt` sudah ada di backend
 * (`src/modules/options/`), dilayani `UptMasterService.getOptions()`.
 * Inilah sumber yang dipakai dropdown filter.
 *
 * Bandingkan dengan `UptBreakdownRow`: angka itu dari agregat transaksi, jadi
 * hanya memuat UPT yang punya transaksi pada periode berjalan. Jangan dipakai
 * untuk dropdown, atau UPT tanpa transaksi akan hilang dari opsi filter.
 */

/** Bentuk master UPT dari `GET /api/v1/options/upt`. */
export interface UptOption {
  /** `KD_UNIT` kanonik mis. `15.0`. Dipakai sebagai nilai filter `kd_upt`. */
  value: string;
  /** `NM_PENDEK_BARU` mis. `Balai PPMHKP Jakarta`. */
  label: string;
  kota: string;
}

/** Satu baris master mentah, sesuai `UptMasterService.getEntries()`. */
export interface UptEntry {
  kdUnit: string;
  label: string;
  kota: string;
}

/**
 * Baris `GET /upts`. Endpoint legacy ini membaca `DISTINCT nama_upt` dari
 * tabel transaksi — BUKAN master — sehingga tidak punya `kode_upt` dan
 * jumlahnya berbeda dari master (85 vs 46 saat diverifikasi).
 */
export interface LegacyUptName {
  nama_upt: string;
}

/** Baris rekap per UPT dari `GET /upt-breakdown`. */
export interface UptBreakdownRow {
  /** Sudah dinormalkan oleh backend, mis. `01.00` menjadi `15.0`. */
  kode_upt: string;
  nama_upt: string;
  totalNettoKg: number;
  totalNettoTon: number;
  totalNilaiRupiah: number;
  totalDokumenAju: number;
}
