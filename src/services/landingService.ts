/**
 * Service untuk endpoint publik landing page (`/api/v1/landing/*`).
 *
 * Dua endpoint yang dipakai peta sebaran:
 *  - `GET /peta-sebar?tahun=YYYY` -> array provinsi (envelope `{ success, message, data }`)
 *  - `GET /upt-marker`            -> array titik UPT
 *
 * Karena endpointnya publik, service ini tidak butuh token. Namun responsnya
 * tetap dinormalisasi (angka -> number, string kosong -> null) supaya komponen
 * peta tidak perlu mempertahankan `unknown`, mengikuti pola `skpService.ts`.
 */

import { LANDING_API } from './api';
import { isApiSuccess, type ApiResponse } from '../types/api';
import type {
  ProvinsiSebaran,
  SebaranHaccp,
  SebaranPascaPanen,
  SebaranPrimer,
  UptMarker,
} from '../types/petaSebar';

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/** Ambil angka aman, default 0 (menyaring `NaN` dari nilai tak terduga). */
const pickNumber = (source: Record<string, unknown>, key: string): number => {
  const parsed = Number(source[key]);
  return Number.isFinite(parsed) ? parsed : 0;
};

const pickString = (value: unknown): string | null => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
};

/**
 * Teks satu baris yang sudah bersih.
 *
 * Kolom master UPT (`Nama`, `ALAMAT_UNIT`) kadang membawa CR/LF; semuanya
 * dirapikan jadi spasi tunggal supaya tidak merusak tata letak popup.
 */
const toCleanText = (value: unknown): string =>
  String(value ?? '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Koordinat jadi angka, atau `null` bila tidak valid.
 *
 * `Number(null)` dan `Number('')` menghasilkan `0` — nilai yang tetap "finite"
 * sehingga lolos `Number.isFinite`. Tanpa penjagaan eksplisit, marker tanpa
 * koordinat akan nyangkut di (0, 0) di lepas pantai Afrika.
 */
const toCoordinate = (value: unknown): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Buka `data` dari envelope backend, lempar error bila `success !== true`. */
const unwrap = <T>(envelope: ApiResponse<T>, context: string): T => {
  if (!isApiSuccess(envelope)) {
    throw new Error(envelope.message || `${context} gagal dimuat`);
  }
  return envelope.data;
};

const mapPrimer = (value: unknown): SebaranPrimer => {
  const record = asRecord(value);
  return {
    cpib: pickNumber(record, 'cpib'),
    cbib: pickNumber(record, 'cbib'),
    cppib: pickNumber(record, 'cppib'),
    cpoib: pickNumber(record, 'cpoib'),
    cpibKapal: pickNumber(record, 'cpibKapal'),
    cdoib: pickNumber(record, 'cdoib'),
  };
};

const mapHaccp = (value: unknown): SebaranHaccp => {
  const record = asRecord(value);
  return {
    gradeA: pickNumber(record, 'gradeA'),
    gradeB: pickNumber(record, 'gradeB'),
    gradeC: pickNumber(record, 'gradeC'),
  };
};

const mapPascaPanen = (value: unknown): SebaranPascaPanen => {
  const record = asRecord(value);
  return {
    skp: pickNumber(record, 'skp'),
    haccp: mapHaccp(record.haccp),
    jumlahUpi: pickNumber(record, 'jumlahUpi'),
  };
};

const mapProvinsi = (value: unknown): ProvinsiSebaran => {
  const record = asRecord(value);
  return {
    // `padStart` menjaga kontrak 2 digit walau backend mengirim "5".
    kodeProvinsi: String(record.kodeProvinsi ?? '').padStart(2, '0'),
    namaProvinsi: pickString(record.namaProvinsi),
    primer: mapPrimer(record.primer),
    pascaPanen: mapPascaPanen(record.pascaPanen),
  };
};

/** `GET /api/v1/landing/peta-sebar?tahun=YYYY` — sebaran per provinsi. */
export const fetchPetaSebaran = async (tahun: string): Promise<ProvinsiSebaran[]> => {
  const response = await LANDING_API.get<ApiResponse<unknown>>('/peta-sebar', {
    params: { tahun },
  });
  return asArray(unwrap(response.data, 'Data peta sebaran')).map(mapProvinsi);
};

/** `GET /api/v1/landing/upt-marker` — titik lokasi UPT untuk marker peta. */
export const fetchUptMarkers = async (): Promise<UptMarker[]> => {
  const response = await LANDING_API.get<ApiResponse<unknown>>('/upt-marker');
  const rows = asArray(unwrap(response.data, 'Data titik UPT'));

  // Baris tanpa koordinat valid dibuang; jangan biarkan marker nyangkut di (0,0).
  return rows
    .map((row): UptMarker | null => {
      const record = asRecord(row);
      const latitude = toCoordinate(record.latitude);
      const longitude = toCoordinate(record.longitude);
      if (latitude === null || longitude === null) {
        return null;
      }
      return {
        kodeUpt: toCleanText(record.kodeUpt),
        nama: toCleanText(record.nama),
        nmUnit: toCleanText(record.nmUnit),
        kota: toCleanText(record.kota),
        alamat: toCleanText(record.alamat),
        latitude,
        longitude,
      };
    })
    .filter((marker): marker is UptMarker => marker !== null);
};
