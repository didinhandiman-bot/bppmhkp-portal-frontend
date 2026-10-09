/**
 * Tipe untuk modul Dashboard Ekspor.
 *
 * Hanya berisi tipe yang BELUM ada di `types/smkhp.ts` dan `types/upt.ts`:
 * matriks ekspor dan opsi UPT sudah didefinisikan di sana (kontraknya identik
 * dengan yang dipakai modul SMKHP), jadi sengaja tidak diduplikasi di sini.
 */

/**
 * Parameter filter global.
 *
 * Nama key mengikuti yang dibaca `smkhpController.#buildFilters`: tanggal tetap
 * camelCase (`startDate`/`endDate`), sedangkan kode UPT dan negara tujuan
 * snake_case (`kd_upt`, `negara_tujuan`).
 */
export interface FilterParams {
  /** Tanggal awal rentang (YYYY-MM-DD). */
  startDate?: string;
  /** Tanggal akhir rentang (YYYY-MM-DD). */
  endDate?: string;
  /** Kode unit UPT kanonik dari master `hc.tb_r_upt` (mis. "15.0"). */
  kd_upt?: string;
  /** Kata kunci pencarian bebas (eksportir, komoditas, nomor aju). */
  search?: string;
  /** Jumlah baris untuk endpoint berpaginasi/ranking. */
  limit?: number;
}

/** Metrik utama pada kartu hero: total devisa. */
export interface HeroInsight {
  /** Total nilai ekspor dalam Rupiah. */
  totalNilaiRupiah: number;
  /** Total nilai ekspor dalam USD. */
  totalNilaiUsd: number;
  /** Persentase pertumbuhan dibanding periode pembanding. */
  growthPercent: number;
}

/** Kartu indikator ringkas. */
export interface KpiCards {
  /** Total tonase bersih (metrik ton). */
  totalNettoTon: number;
  /** Total Health Certificate yang terbit. */
  totalDokumenHc: number;
  /** Jumlah eksportir/trader aktif. */
  totalEksportirAktif: number;
  /** Jumlah negara tujuan ekspor. */
  totalNegaraTujuan: number;
  /**
   * Persentase YoY per metrik. Properti opsional karena `undefined` (backend
   * tidak mengirim) berbeda dari `0` (tidak berubah) — badge disembunyikan
   * hanya untuk yang `undefined`.
   */
  yoy?: {
    tonase?: number;
    dokumenHc?: number;
    eksportirAktif?: number;
    negaraTujuan?: number;
  };
}

/** Respons `GET /kpi-summary`. */
export interface KpiSummaryResponse {
  heroInsight: HeroInsight;
  kpiCards: KpiCards;
}

/** Satu titik pada deret tren bulanan. */
export interface MonthlyTrendItem {
  /** Kode bulan ("1".."12"), dikirim backend sebagai string. */
  bulan: string;
  totalNettoTon: number;
  totalNilaiRupiah: number;
  totalDokumenHc: number;
}

/** Satu baris peringkat negara tujuan. */
export interface TopDestinationItem {
  /** Kode ISO-3 negara mitra (mis. "US", "JP"). */
  kode_negara_partner: string;
  negara_tujuan: string;
  totalNilaiRupiah: number;
  /** Tonase dalam kilogram. */
  totalNettoKg: number;
  /** Pangsa terhadap total, persen. */
  sharePersentase: number;
}
