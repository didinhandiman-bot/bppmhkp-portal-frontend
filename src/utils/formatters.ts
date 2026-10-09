/**
 * Kumpulan fungsi formatting untuk kebutuhan tampilan dashboard ekspor.
 * Semua fungsi bersifat murni (pure) dan tidak memiliki efek samping.
 */

/** Format angka desimal gaya Indonesia: pemisah ribuan "." dan desimal ",". */
const idNumber = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Nama bulan dalam Bahasa Indonesia, indeks 0 = Januari. */
const NAMA_BULAN_ID: readonly string[] = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/** Memastikan nilai yang diterima selalu berupa angka terbatas (finite). */
function toFiniteNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

/**
 * Format mata uang Rupiah secara ringkas dengan satuan bertingkat.
 *
 * @example formatRupiah(168962499312758.1) // "Rp 168,96 T"
 * @example formatRupiah(2589000000)        // "Rp 2,59 M"
 */
export function formatRupiah(value: number): string {
  const nominal = toFiniteNumber(value);
  const sign = nominal < 0 ? '-' : '';
  const abs = Math.abs(nominal);

  const tiers: ReadonlyArray<{ readonly threshold: number; readonly suffix: string }> = [
    { threshold: 1_000_000_000_000, suffix: 'T' },
    { threshold: 1_000_000_000, suffix: 'M' },
    { threshold: 1_000_000, suffix: 'jt' },
    { threshold: 1_000, suffix: 'rb' },
  ];

  for (const { threshold, suffix } of tiers) {
    if (abs >= threshold) {
      const scaled = abs / threshold;
      return `${sign}Rp ${scaled.toFixed(2).replace('.', ',')} ${suffix}`;
    }
  }

  return `${sign}Rp ${idNumber.format(abs)}`;
}

/**
 * Format nilai USD secara ringkas dengan satuan bertingkat (gaya internasional).
 *
 * @example formatUsd(9979484405.22) // "$9.98 B"
 * @example formatUsd(240500000)     // "$240.50 M"
 */
export function formatUsd(value: number): string {
  const nominal = toFiniteNumber(value);
  const sign = nominal < 0 ? '-' : '';
  const abs = Math.abs(nominal);

  const tiers: ReadonlyArray<{ readonly threshold: number; readonly suffix: string }> = [
    { threshold: 1_000_000_000, suffix: 'B' },
    { threshold: 1_000_000, suffix: 'M' },
    { threshold: 1_000, suffix: 'K' },
  ];

  for (const { threshold, suffix } of tiers) {
    if (abs >= threshold) {
      const scaled = abs / threshold;
      return `${sign}$${scaled.toFixed(2)} ${suffix}`;
    }
  }

  return `${sign}$${abs.toFixed(2)}`;
}

/**
 * Format tonase dengan satuan "Ton".
 * Kolom `netto` pada database tersimpan dalam kilogram, sehingga nilai Kg
 * dikonversi terlebih dahulu (1 Ton = 1000 Kg).
 *
 * @param value     Nilai tonase.
 * @param inputUnit Satuan masukan, default "kg".
 * @example formatTon(2252662.22, 'ton') // "2.252.662,22 Ton"
 * @example formatTon(2252662215.33)     // "2.252.662,22 Ton"
 */
export function formatTon(value: number, inputUnit: 'kg' | 'ton' = 'kg'): string {
  const nominal = toFiniteNumber(value);
  const ton = inputUnit === 'ton' ? nominal : nominal / 1_000;

  return `${idNumber.format(ton)} Ton`;
}

/**
 * Mengubah kode bulan numerik menjadi nama bulan Bahasa Indonesia.
 *
 * @param kodeBulan Kode bulan ("1" - "12", boleh dengan nol di depan, atau angka).
 * @example formatBulan('01') // "Januari"
 * @example formatBulan(12)   // "Desember"
 */
export function formatBulan(kodeBulan: string | number): string {
  const parsed = Number.parseInt(String(kodeBulan).trim(), 10);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 12) {
    // Nilai di luar rentang diteruskan apa adanya agar tidak menghilangkan data.
    return String(kodeBulan).trim();
  }

  return NAMA_BULAN_ID[parsed - 1];
}

/**
 * Format nilai yang sudah dinyatakan dalam Juta USD.
 *
 * @param value Nilai ekspor dalam Juta USD.
 * @example formatUsdJuta(1886.97) // "1.886,97"
 */
export function formatUsdJuta(value: number): string {
  return idNumber.format(toFiniteNumber(value));
}

/**
 * Format persentase dengan simbol "%".
 *
 * @param value Nilai persen (mis. 34.2).
 * @example formatPersen(34.2) // "34,2%"
 */
export function formatPersen(value: number): string {
  return `${toFiniteNumber(value)}%`;
}

/** Mengurai tanggal ISO (YYYY-MM-DD) menjadi komponen tahun dan bulan. */
function parseIsoDate(value?: string | null): { tahun: number; bulan: number } | null {
  if (value === undefined || value === null) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
  if (!match) {
    return null;
  }
  const bulan = Number(match[2]);
  if (!Number.isInteger(bulan) || bulan < 1 || bulan > 12) {
    return null;
  }
  return { tahun: Number(match[1]), bulan };
}

/**
 * Menyusun label periode yang ramah pengguna, misalnya untuk header matriks.
 *
 * @param startDate Tanggal awal (YYYY-MM-DD) — opsional.
 * @param endDate   Tanggal akhir (YYYY-MM-DD) — opsional.
 * @example formatPeriodeLabel('2026-01-01', '2026-05-31') // "Januari - Mei 2026"
 * @example formatPeriodeLabel('2026-01-01', '2026-01-31') // "Januari 2026"
 */
export function formatPeriodeLabel(startDate?: string | null, endDate?: string | null): string {
  const start = parseIsoDate(startDate ?? null);
  const end = parseIsoDate(endDate ?? null);

  if (!start && !end) {
    return '';
  }
  if (start && !end) {
    return `${NAMA_BULAN_ID[start.bulan - 1]} ${start.tahun}`;
  }
  if (!start && end) {
    return `${NAMA_BULAN_ID[end.bulan - 1]} ${end.tahun}`;
  }
  if (start === null || end === null) {
    return '';
  }
  if (start.bulan === end.bulan) {
    return `${NAMA_BULAN_ID[start.bulan - 1]} ${start.tahun}`;
  }
  if (start.tahun === end.tahun) {
    return `${NAMA_BULAN_ID[start.bulan - 1]} - ${NAMA_BULAN_ID[end.bulan - 1]} ${start.tahun}`;
  }
  return `${NAMA_BULAN_ID[start.bulan - 1]} ${start.tahun} - ${NAMA_BULAN_ID[end.bulan - 1]} ${end.tahun}`;
}
