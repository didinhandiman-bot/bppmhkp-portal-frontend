import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import rawGeoJson from './38-Provinsi-Indonesia.json?raw';

/**
 * Loader GeoJSON 38 provinsi.
 *
 * Berkas dibaca lewat `?raw` (bukan `import ... from '.json'`) dengan dua
 * alasan:
 * - `resolveJsonModule` tidak aktif di `tsconfig.app.json`, sehingga impor JSON
 *   langsung akan gagal di `tsc`.
 * - Walaupun diaktifkan, TypeScript akan menyimpulkan tipe literal dari ~850 KB
 *   koordinat dan itu memperlambat/menggembungkan proses build.
 *
 * `JSON.parse` dijalankan sekali saat modul dimuat. `vite/client` sudah
 * mendeklarasikan `*?raw` sebagai `string`, jadi hasilnya langsung bertipe.
 */

/** Properti tiap feature GeoJSON; inilah yang dipakai mencocokkan data backend. */
export interface ProvinceFeatureProperties {
  KODE_PROV: string;
  PROVINSI: string;
}

/** Tipe FeatureCollection GeoJSON provinsi Indonesia. */
export type ProvinceFeatureCollection = FeatureCollection<
  Polygon | MultiPolygon,
  ProvinceFeatureProperties
>;

export const indonesiaGeoJson = JSON.parse(rawGeoJson) as ProvinceFeatureCollection;
