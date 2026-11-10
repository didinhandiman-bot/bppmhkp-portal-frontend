/**
 * Master provinsi statis berbasis GeoJSON 38 provinsi milik proyek.
 *
 * Backend SPDI mengirim `kd_provinsi` sebagai kode BPS 2 digit — persis
 * `properties.KODE_PROV` pada `constants/indonesiaGeoJson.ts` — sehingga
 * dropdown filter bisa dibangun tanpa endpoint master baru (kode yang sama
 * sudah dipakai pembobotan peta landing).
 */

import { indonesiaGeoJson } from '../constants/indonesiaGeoJson';

/** Opsi dropdown `{ value: kode 2 digit, label: nama }`. */
export interface ProvinsiOption {
  value: string;
  label: string;
}

/** Seluruh provinsi, diurutkan berdasarkan kode BPS. */
export const PROVINSI_OPSI: ProvinsiOption[] = indonesiaGeoJson.features
  .map((feature) => ({
    value: String(feature.properties.KODE_PROV ?? '').padStart(2, '0'),
    label: String(feature.properties.PROVINSI ?? '').trim(),
  }))
  .filter((option) => option.value !== '00' && option.label !== '')
  .sort((a, b) => a.value.localeCompare(b.value, 'id-ID'));

/** Index `kode -> nama`, dibangun sekali dari daftar di atas. */
const NAMA_BY_KODE = new Map(PROVINSI_OPSI.map((option) => [option.value, option.label]));

/** Nama provinsi dari kode BPS; `null` bila kode kosong/tidak dikenal. */
export function namaProvinsiDariKode(kode: string | null | undefined): string | null {
  if (kode === null || kode === undefined) return null;
  const normalized = String(kode).trim();
  if (normalized === '') return null;
  return NAMA_BY_KODE.get(normalized.padStart(2, '0')) ?? null;
}
