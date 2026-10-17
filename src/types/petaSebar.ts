/**
 * Tipe untuk fitur Peta Sebaran landing page.
 *
 * Bentuknya mengikuti payload `GET /api/v1/landing/peta-sebar` (lihat
 * `src/services/mapService.js` di backend). `kodeProvinsi` sengaja 2 digit
 * karena dipakai untuk mencocokkan `properties.KODE_PROV` pada GeoJSON
 * `38-Provinsi-Indonesia.json`.
 */

/** Rincian sertifikasi mutu primer per provinsi. */
export interface SebaranPrimer {
  cpib: number;
  cbib: number;
  cppib: number;
  cpoib: number;
  /** Sertifikat CPIB Kapal, sumbernya `report_kapal.tb_cbib_kapal`. */
  cpibKapal: number;
  cdoib: number;
}

/** Jumlah sertifikat HACCP per grade. */
export interface SebaranHaccp {
  gradeA: number;
  gradeB: number;
  gradeC: number;
}

/** Rincian pasca panen (SKP + HACCP) per provinsi. */
export interface SebaranPascaPanen {
  skp: number;
  haccp: SebaranHaccp;
  jumlahUpi: number;
}

/** Satu provinsi pada payload peta sebaran. */
export interface ProvinsiSebaran {
  kodeProvinsi: string;
  namaProvinsi: string | null;
  primer: SebaranPrimer;
  pascaPanen: SebaranPascaPanen;
}

/**
 * Titik lokasi UPT untuk marker peta.
 *
 * `latitude`/`longitude` sudah dinormalkan backend dari kolom master
 * `BUJUR`/`LINTANG` (yang namanya tertukar di database, dan pada sebagian baris
 * pasangannya benar-benar terbalik), jadi frontend cukup memakainya apa adanya.
 */
export interface UptMarker {
  kodeUpt: string;
  /** Label pendek resmi, mis. `Stasiun PPMHKP Pontianak`. */
  nama: string;
  /** Nama panjang (`NM_UNIT`), dipakai sebagai cadangan bila `nama` kosong. */
  nmUnit: string;
  kota: string;
  /** Alamat lengkap, sudah dirapikan dari CR/LF. */
  alamat: string;
  latitude: number;
  longitude: number;
}
