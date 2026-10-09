/**
 * Utilitas rentang tanggal untuk filter dashboard.
 * Semua fungsi murni (pure) dan mengembalikan format YYYY-MM-DD sesuai
 * kontrak API (`startDate` / `endDate`).
 */

/** Rentang tanggal siap kirim ke API. */
export interface DateRange {
  /** Tanggal awal, format YYYY-MM-DD. */
  startDate: string;
  /** Tanggal akhir, format YYYY-MM-DD. */
  endDate: string;
}

/** Mengubah objek Date menjadi string YYYY-MM-DD memakai waktu lokal. */
function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Rentang default dashboard: 1 Januari tahun berjalan sampai hari ini.
 *
 * Mengapa bukan "bulan berjalan"? Data `tr_report_ekspor` bersifat batch dan
 * selalu tertinggal dari tanggal kalender. Saat request sinkron terakhir
 * 2026-09-25 sementara tanggal sistem 2026-10-01, default "bulan berjalan"
 * menghasilkan rentang 2026-10-01 s/d 2026-10-31 yang berisi 0 baris, sehingga
 * seluruh KPI tampil nol padahal database penuh data.
 *
 * "Tahun berjalan sampai hari ini" aman karena data tumbuh kontinu sejak
 * 2025-01-01: rentang ini selalu mencakup periode yang sudah terisi, dan
 * berakhir di hari ini (bukan masa depan) sehingga tidak meminta data yang
 * belum bisa ada.
 *
 * Catatan: rentang ini sengaja berada dalam SATU tahun kalender. Endpoint
 * `monthly-trends` melakukan `GROUP BY bulan` tanpa menyertakan tahun, sehingga
 * rentang lintas tahun akan menggabungkan, misalnya, Januari 2025 + Januari 2026
 * pada satu titik "1". Default satu tahun menghindari ambiguitas itu.
 *
 * @param reference Tanggal acuan; default `new Date()`.
 * @example getDefaultDateRange(new Date('2026-08-15')) // { startDate: '2026-01-01', endDate: '2026-08-15' }
 */
export function getDefaultDateRange(reference: Date = new Date()): DateRange {
  const start = new Date(reference.getFullYear(), 0, 1);
  // `toIsoDate` memakai waktu lokal, jadi batas akhirnya "hari ini" lokal —
  // konsisten dengan cara tanggal lain dibentuk di modul ini.
  const end = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());

  return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
}
