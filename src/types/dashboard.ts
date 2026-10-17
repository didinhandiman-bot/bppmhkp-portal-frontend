/**
 * Tipe untuk dashboard ringkasan eksekutif.
 *
 * Sesuai respons riil `GET /api/v1/dashboard/overview`
 * (`services/dashboardOverviewService.js`), yang memakai `camelCase` — berbeda
 * dari modul pascapanen yang `snake_case`.
 *
 * Tren, distribusi UPT, aktivitas, dan scope berasal dari hasil query backend.
 */

/** Ringkasan sektor ekspor (`EksporRepository.getAggregatedSummary`). */
export interface DashboardEksporKpi {
  /** Jumlah baris transaksi pada periode & filter aktif. */
  totalFrekuensi: number;
  /** Jumlah nomor aju unik. */
  totalPengajuan: number;
  /** Volume bersih total dalam kilogram. */
  totalVolumeKg: number;
  /** Volume bersih total dalam ton (`totalVolumeKg / 1000`). */
  totalVolumeTon: number;
  /** Nilai ekspor total dalam rupiah. */
  totalNilaiRupiah: number;
}

/**
 * Rincian per modul di dalam sektor pasca panen.
 *
 * Catatan: `pascaPanen` tidak punya objek `detail` — `PascaPanenRepository`
 * mengirim modul datar di root objek, berbeda dengan `primer` yang memakai
 * `detail`.
 */
export interface DashboardPascaPanenModul {
  total: number;
  /** Hanya diisi modul yang punya kolom masa berlaku (SKP, HACCP). */
  berlaku?: number;
}

/**
 * Ringkasan sektor pasca panen.
 *
 * `totalSertifikatTerbit` dari backend = SKP + SMKHP + HACCP, jadi masih
 * termasuk SMKHP. Karena aturan bisnis tidak menghitung SMKHP sebagai
 * sertifikasi pasca panen, angka besar kartu dihitung ulang di frontend
 * (SKP + HACCP + SPDI) dan tidak memakai nilai ini.
 *
 * `spdi` belum ada di backend sehingga selalu 0 sampai repository
 * mengirimkannya; kartu tetap membacanya agar tidak perlu diubah lagi nanti.
 *
 * `totalPending` dan `totalInProgress` masih `0` keras di backend, dan kini
 * tidak lagi ditampilkan di kartu mana pun.
 */
export interface DashboardPascaPanenKpi {
  /** Backend: SKP + SMKHP + HACCP. Termasuk SMKHP — jangan dipakai untuk total. */
  totalSertifikatTerbit: number;
  smkhp: DashboardPascaPanenModul;
  skp: DashboardPascaPanenModul;
  haccp: DashboardPascaPanenModul;
  spdi: number;
  /** Masih `0` keras di backend. */
  totalPending: number;
  totalInProgress: number;
}

/**
 * Rincian penerbitan per jenis izin primer.
 *
 * Key diambil dari `primerRepository.getAggregatedSummary` yang memfilter
 * `kd_izin` per jenis. `cpibKapal` berasal dari basis data berbeda
 * (`tb_cbib_kapal`), jadi tidak selalu terisi.
 */
export interface PrimerDetail {
  cpib: number;
  cbib: number;
  cppib: number;
  cpoib: number;
  cdoib: number;
  cpibKapal: number;
}

/**
 * Ringkasan sektor primer (6 jenis izin: CPIB s.d. CDOIB).
 *
 * Nama field total adalah `totalSertifikat`, bukan `totalSertifikatTerbit`:
 * `DashboardOverviewService` membentuk ulang objek `primer` dengan hanya tiga
 * field ini, jadi `totalSertifikatTerbit` tidak pernah sampai ke frontend
 * meski repository aslinya masih mengirimkannya.
 *
 * `detail` ditandai opsional karena backend bisa mengirim objek tanpa rincian
 * bila sub-query per jenis gagal (repository menutup error dengan
 * `.catch(() => [[],[],[],[],[]])`).
 */
export interface DashboardPrimerKpi {
  totalSertifikat: number;
  /** Masih `0` keras di backend. */
  totalPending: number;
  detail?: PrimerDetail;
}

/** Angka-angka utama dashboard. */
export interface DashboardSummaryKpi {
  ekspor: DashboardEksporKpi;
  pascaPanen: DashboardPascaPanenKpi;
  primer: DashboardPrimerKpi;
  /** Pasca panen terbit + primer terbit, dihitung backend. */
  totalSertifikasiNasional: number;
}

/** Satu titik tren bulanan lintas sektor. */
export interface DashboardMonthlyTrend {
  /** Label bulan; bentukanya belum dijamin backend. */
  month: string | number;
  ekspor: number;
  pascaPanen: number;
  primer: number;
}

/** Sebaran aktivitas per UPT. */
export interface DashboardUptDistribution {
  namaUpt: string;
  ekspor: number;
  pascaPanen: number;
  primer: number;
  grandTotal: number;
}

/** Status yang dikenali badge warna pada tabel aktivitas. */
export type DashboardActivityStatus = 'Disetujui' | 'Diproses' | 'Ditolak' | string;

/** Satu baris feed aktivitas lintas modul. */
export interface DashboardRecentActivity {
  id: number | string;
  /** Pilarasal aktivitas, mis. `Ekspor`, `Pasca Panen`, `Primer`. */
  module: string;
  serviceName: string;
  applicant: string;
  upt: string;
  date: string;
  status: DashboardActivityStatus;
}

/** Isi `data` pada `GET /api/v1/dashboard/overview`. */
export interface DashboardScope {
  primerUpt: string | null;
  primerCities: string[] | null;
  kapalIncluded: boolean;
  primerDistribution: 'upt';
}

export interface DashboardOverview {
  scope: DashboardScope | null;
  summaryKpi: DashboardSummaryKpi;
  /** Masih kosong di backend; lihat catatan di atas. */
  monthlyTrends: DashboardMonthlyTrend[];
  /** Masih kosong di backend; lihat catatan di atas. */
  uptDistribution: DashboardUptDistribution[];
  /** Masih kosong di backend; lihat catatan di atas. */
  recentActivities: DashboardRecentActivity[];
}

/** Parameter query ringkasan dashboard. */
export interface DashboardFilterParams {
  /** Filter tanggal mulai, format `YYYY-MM-DD`. */
  startDate?: string;
  /** Filter tanggal selesai, format `YYYY-MM-DD`. */
  endDate?: string;
  /** Kode UPT dari master `/api/v1/options/upt`, mis. `15.0`. */
  uptId?: string;
}

/** Pilihan rentang tanggal siap pakai pada bar filter. */
export type DashboardDatePreset = 'ytd' | 'bulan-ini' | 'custom';

/** Nilai preset beserta label yang tampil di dropdown. */
export const DASHBOARD_DATE_PRESETS: ReadonlyArray<{
  value: DashboardDatePreset;
  label: string;
}> = [
  { value: 'ytd', label: 'Tahun Ini (YTD)' },
  { value: 'bulan-ini', label: 'Bulan Ini' },
  { value: 'custom', label: 'Rentang Kustom' },
];

/** Label dropdown UPT saat tidak ada UPT spesifik yang dipilih. */
export const DASHBOARD_UPT_SEMUA = 'Semua UPT / Nasional';