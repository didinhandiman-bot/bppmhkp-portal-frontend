/**
 * Utilitas normalisasi kode UPT.
 *
 * Kode master `hc.tb_r_upt` memuat satu entri "Balai PPMHKP Jakarta" (Jakarta
 * II) dengan `KD_UNIT` `15.0`, sementara data transaksi lama masih menyimpan
 * kode `01.0` (Tangerang / Jakarta I) dan `01.00` untuk entitas yang sama.
 * Frontend menormalkan kode lama menjadi `15.0` agar nilai filter selalu cocok
 * dengan `value` opsi pada dropdown dan konsisten dengan backend.
 */

/** Pemetaan kode legacy UPT ke kode primer yang dikirim sebagai filter. */
export const UPT_CODE_ALIASES: Readonly<Record<string, string>> = {
  '01.0': '15.0',
  '01.00': '15.0',
};

/** Menormalkan kode UPT lama (`01.0` / `01.00`) menjadi kode primer `15.0`. */
export function normalizeKdUpt(code: string | undefined | null): string | undefined {
  if (code === undefined || code === null) {
    return undefined;
  }
  const trimmed = code.trim();
  if (trimmed === '') {
    return undefined;
  }
  return UPT_CODE_ALIASES[trimmed] ?? trimmed;
}