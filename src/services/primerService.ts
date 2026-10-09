import { isApiSuccess, type ApiResponse } from '../types/api';
import { PRIMER_API as api } from './api';

export type PrimerIzinType = 'semua' | 'cpib' | 'cbib' | 'cppib' | 'cpoib' | 'cbib-kapal' | 'cdoib';

export interface PrimerOverviewFilters {
  jenisIzin?: PrimerIzinType | string;
  startDate?: string;
  endDate?: string;
  search?: string;
  kdIzin?: string;
  kdDaerah?: string;
}

export interface PrimerRingkasan {
  totalSertifikat: number;
  /**
   * Jumlah entitas. Hanya dikirim pada jalur primer reguler; branch kapal
   * mengirim `totalAktif` sebagai gantinya.
   */
  totalEntitas?: number;
  rataEntitasPerSertifikat?: number;
  rataMinor?: number;
  rataMayor?: number;
  rataKritis?: number;
  tglSyncTerakhir: string | null;
  /** Kapal yang masa berlakunya belum habis (khusus modul kapal). */
  totalAktif?: number;
  /** Total Gross Tonnage armada (khusus modul kapal). */
  totalGT?: number;
  /** Total Awak Kapal / ABK (khusus modul kapal). */
  totalABK?: number;
}

/** Distribusi grade SCP-IB; hanya dikirim pada branch kapal. */
export interface PrimerDistribusiGradeItem {
  rank: number;
  grade: string;
  total: number;
}

/** Bucket tonase armada: `<10 GT`, `10-30 GT`, `31-100 GT`, `>100 GT`. */
export interface PrimerTonaseArmadaItem {
  label: string;
  total: number;
}

/** Alat tangkap yang paling dominan di armada. */
export interface PrimerAlatTangkapItem {
  nama: string;
  total: number;
}

/** Sebaran kapal per Wilayah Pengelolaan Sumber Daya (WPP). */
export interface PrimerSebaranWppItem {
  wpp: string;
  total: number;
}

export interface PrimerTrenBulananItem {
  bulan: number;
  labelBulan: string;
  total: number;
}

export interface PrimerDistribusiWilayahItem {
  provinsi: string;
  total: number;
}

export interface PrimerDistribusiKomoditasItem {
  komoditas: string;
  total: number;
}

export interface PrimerBreakdownHasil {
  sangatBaik: number;
  baik: number;
  cukup: number;
  perbaikan: number;
  tidakLayak: number;
}

export interface PrimerOverviewData {
  ringkasan: PrimerRingkasan;
  breakdownHasil: PrimerBreakdownHasil;
  trenBulanan: PrimerTrenBulananItem[];
  distribusiWilayah: PrimerDistribusiWilayahItem[];
  distribusiKomoditas: PrimerDistribusiKomoditasItem[];
  filterEfektif?: Record<string, unknown> | null;
  /**
   * Widget khusus kapal. Backend menaruhnya di dalam objek `stats`, bukan di
   * root, jadi mapper menyalinnya ke sini agar frontend tidak perlu tahu
   * bentuk envelope itu.
   */
  tonaseArmada?: PrimerTonaseArmadaItem[];
  alatTangkap?: PrimerAlatTangkapItem[];
  sebaranWpp?: PrimerSebaranWppItem[];
  /** Distribusi Grade SCP-IB; branch kapal tidak mengisi `breakdownHasil`. */
  distribusiGrade?: PrimerDistribusiGradeItem[];
}

export interface PrimerCertificateItem {
  id: number;
  noIzin: string | null;
  tglIzin: string | null;
  nib: string | null;
  namaPerseroan: string | null;
  komoditas: string | null;
  provinsi: string | null;
  jenisIzin: string | null;
  kdIzin: string | null;
  kdDaerah: string | null;
  hasilKelayakan?: string | null;
  statusChecklist?: string | null;
  /** Armada kapal; tidak dikirim untuk primer non-kapal. */
  namaKapal?: string | null;
  noSertifikat?: string | null;
  namaPemilik?: string | null;
  gt?: number | null;
  alatTangkap?: string | null;
  namaPelabuhan?: string | null;
  daerahTangkap?: string | null;
  grade?: string | null;
  upt?: string | null;
  tglTerbit?: string | null;
  tglKadaluarsa?: string | null;
  masaBerlaku?: string | null;
  /**
   * Backend mengirim boolean. Dipertahankan apa adanya — jangan diubah jadi
   * string, karena `"false"` tetap truthy di JS.
   */
  statusAktif?: boolean;
  /** Label status siap tampil dari backend (`Aktif` / `Tidak Aktif`). */
  stsAktif?: string | null;
  totalSesuai?: number | null;
  totalMinor?: number | null;
  totalMayor?: number | null;
  totalKritis?: number | null;
  totalHasil?: number | null;
  uraianUsaha?: string | null;
  alamat?: string | null;
  [key: string]: unknown;
}

export interface PrimerCertificatesMeta {
  totalRows: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface PrimerCertificatesResponse {
  items: PrimerCertificateItem[];
  meta: PrimerCertificatesMeta;
}

const asRecord = (v: unknown): Record<string, unknown> =>
  typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const toInt = (v: unknown, f = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : f;
};

const toNum = (v: unknown, f = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : f;
};

/**
 * Baca boolean dari backend.
 *
 * Penting untuk `statusAktif`: kalau boolean diteruskan lewat `String()`, nilai
 * `false` menjadi string `"false"` yang tetap truthy, sehingga kapal yang sudah
 * kedaluwarsa akan tampil sebagai Aktif.
 */
const toBool = (v: unknown): boolean | undefined => {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const s = String(v).trim().toLowerCase();
  if (s === 'true' || s === '1' || s === 'aktif') return true;
  if (s === 'false' || s === '0' || s === 'tidak aktif' || s === '') return false;
  return undefined;
};

const strOrNull = (v: unknown): string | null => {
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  return t === '' ? null : t;
};

const unwrap = <T>(env: ApiResponse<T>, ctx: string): T => {
  if (!isApiSuccess(env)) throw new Error(env.message || `${ctx} gagal dimuat`);
  return env.data;
};

const mapRingkasan = (r: unknown): PrimerRingkasan => {
  const o = asRecord(r);
  const optNum = (v: unknown) => (v === undefined || v === null ? undefined : toNum(v));
  return {
    totalSertifikat: toInt(o.totalSertifikat),
    totalEntitas: optNum(o.totalEntitas),
    rataEntitasPerSertifikat: optNum(o.rataEntitasPerSertifikat),
    rataMinor: optNum(o.rataMinor),
    rataMayor: optNum(o.rataMayor),
    rataKritis: optNum(o.rataKritis),
    tglSyncTerakhir: strOrNull(o.tglSyncTerakhir),
    totalAktif: optNum(o.totalAktif),
    totalGT: optNum(o.totalGT),
    totalABK: optNum(o.totalABK),
  };
};

const mapTren = (arr: unknown): PrimerTrenBulananItem[] =>
  asArray(arr).map((x) => {
    const o = asRecord(x);
    return {
      bulan: toInt(o.bulan),
      labelBulan: String(o.labelBulan ?? '').trim(),
      total: toInt(o.total),
    };
  });

const mapWilayah = (arr: unknown): PrimerDistribusiWilayahItem[] =>
  asArray(arr).map((x) => {
    const o = asRecord(x);
    return {
      provinsi: String(o.provinsi ?? '').trim(),
      total: toInt(o.total),
    };
  });

const mapKomoditas = (arr: unknown): PrimerDistribusiKomoditasItem[] =>
  asArray(arr).map((x) => {
    const o = asRecord(x);
    return {
      komoditas: String(o.komoditas ?? '').trim(),
      total: toInt(o.total),
    };
  });

const mapDistribusiGrade = (arr: unknown): PrimerDistribusiGradeItem[] =>
  asArray(arr).map((x, i) => {
    const o = asRecord(x);
    return {
      rank: toInt(o.rank, i + 1),
      grade: String(o.grade ?? '').trim(),
      total: toInt(o.total),
    };
  });

const mapTonaseArmada = (arr: unknown): PrimerTonaseArmadaItem[] =>
  asArray(arr).map((x) => {
    const o = asRecord(x);
    return {
      label: String(o.label ?? '').trim(),
      total: toInt(o.total),
    };
  });

const mapAlatTangkap = (arr: unknown): PrimerAlatTangkapItem[] =>
  asArray(arr).map((x) => {
    const o = asRecord(x);
    return {
      nama: String(o.nama ?? '').trim(),
      total: toInt(o.total),
    };
  });

const mapSebaranWpp = (arr: unknown): PrimerSebaranWppItem[] =>
  asArray(arr).map((x) => {
    const o = asRecord(x);
    return {
      wpp: String(o.wpp ?? '').trim(),
      total: toInt(o.total),
    };
  });

const mapBreakdown = (r: unknown): PrimerBreakdownHasil => {
  const res: PrimerBreakdownHasil = {
    sangatBaik: 0,
    baik: 0,
    cukup: 0,
    perbaikan: 0,
    tidakLayak: 0,
  };

  // Jika backend mengembalikan Array: [{ statusHasil: 'Baik', total: 84 }, ...]
  if (Array.isArray(r)) {
    for (const item of r) {
      const label = String(item?.statusHasil || '').trim().toLowerCase();
      const val = toInt(item?.total);

      if (label.includes('sangat') || label === 'p1') {
        res.sangatBaik += val;
      } else if (label.includes('baik') || label === 'p2') {
        res.baik += val;
      } else if (label.includes('cukup') || label === 'p3') {
        res.cukup += val;
      } else if (label.includes('perbaikan')) {
        res.perbaikan += val;
      } else if (label.includes('tidak') || label.includes('tolak')) {
        res.tidakLayak += val;
      }
    }
    return res;
  }

  // Jika backend mengembalikan Object key-value biasa
  const o = asRecord(r);
  return {
    sangatBaik: toInt(o.sangatBaik ?? o.SangatBaik ?? o['Sangat Baik']),
    baik: toInt(o.baik ?? o.Baik),
    cukup: toInt(o.cukup ?? o.Cukup),
    perbaikan: toInt(o.perbaikan ?? o.Perbaikan),
    tidakLayak: toInt(o.tidakLayak ?? o['Tidak Layak']),
  };
};

const toQuery = (f: Record<string, unknown> = {}): Record<string, unknown> => {
  const q: Record<string, unknown> = { ...f };
  if (q.sortField !== undefined && q.sortOrder !== undefined) {
    q.order = `${String(q.sortField)},${String(q.sortOrder)}`;
    delete q.sortField;
    delete q.sortOrder;
  }
  return q;
};


export const getPrimerOverview = async (filters: Record<string, unknown> = {}): Promise<PrimerOverviewData> => {
  const res = await api.get<ApiResponse<unknown>>('/overview', { params: toQuery(filters) });
  const payload = res.data as unknown;
  const env = unwrap(payload as Record<string, unknown>, 'Overview PRIMER');
  const root = asRecord(env as unknown);
  const d = asRecord(root.data ?? root);
  // if still empty, maybe payload is already data root
  const effective = (Object.keys(d).length === 0 ? asRecord(payload) : d);

  // Branch kapal menaruh widget armada di dalam `stats`, bukan di root.
  const stats = asRecord(effective.stats ?? d.stats);

  return {
    ringkasan: mapRingkasan(effective.ringkasan ?? d.ringkasan),
    breakdownHasil: mapBreakdown(effective.breakdownHasil ?? d.breakdownHasil),
    trenBulanan: mapTren(effective.trenBulanan ?? d.trenBulanan),
    distribusiWilayah: mapWilayah(effective.distribusiWilayah ?? d.distribusiWilayah),
    distribusiKomoditas: mapKomoditas(effective.distribusiKomoditas ?? d.distribusiKomoditas),
    filterEfektif: (effective.filterEfektif ?? d.filterEfektif) as Record<string, unknown> | null,
    tonaseArmada: mapTonaseArmada(stats.tonaseArmada ?? effective.tonaseArmada),
    alatTangkap: mapAlatTangkap(stats.alatTangkap ?? effective.alatTangkap),
    sebaranWpp: mapSebaranWpp(stats.sebaranWpp ?? effective.sebaranWpp),
    distribusiGrade: mapDistribusiGrade(effective.distribusiGrade ?? d.distribusiGrade),
  };
};

export const getPrimerCertificates = async (
  params: Record<string, unknown> = {}
): Promise<PrimerCertificatesResponse> => {
  const res = await api.get<ApiResponse<unknown>>('/certificates', { params: toQuery(params) });
  const env = res.data;
  const envelope = asRecord(env);
  const rawData = envelope.data;
  const itemsRawArr: unknown[] = Array.isArray(rawData)
    ? rawData
    : (() => {
        const d = asRecord(rawData);
        return asArray(d.data ?? d.items);
      })();
  let metaRawRec: Record<string, unknown> | null = null;
  if (Array.isArray(rawData)) {
    const metaEnv = envelope.meta ? asRecord(envelope.meta) : null;
    if (metaEnv?.pagination) metaRawRec = asRecord(metaEnv.pagination) as Record<string, unknown>;
  } else {
    const d = asRecord(rawData);
    const dMeta = d.meta ? asRecord(d.meta) : null;
    const eMeta = envelope.meta ? asRecord(envelope.meta) : null;
    const pag = dMeta?.pagination || eMeta?.pagination;
    if (pag) metaRawRec = asRecord(pag) as Record<string, unknown>;
  }
  const itemsArr = itemsRawArr;
  const items: PrimerCertificateItem[] = itemsArr.map((x) => {
    const o = asRecord(x);
    return {
      id: toInt(o.id),
      noIzin: strOrNull(o.noIzin ?? o.nomorIzin),
      tglIzin: strOrNull(o.tglIzin ?? o.tanggalIzin),
      nib: strOrNull(o.nib),
      namaPerseroan: strOrNull(o.namaPerseroan ?? o.nama_perusahaan),
      komoditas: strOrNull(o.komoditas),
      provinsi: strOrNull(o.provinsi),
      jenisIzin: strOrNull(o.jenisIzin ?? o.jenis_izin),
      kdIzin: strOrNull(o.kdIzin),
      kdDaerah: strOrNull(o.kdDaerah),
      hasilKelayakan: strOrNull(o.hasilKelayakan ?? o.hasil),
      statusChecklist: strOrNull(o.statusChecklist),
      totalSesuai: o.totalSesuai === null || o.totalSesuai === undefined ? null : toInt(o.totalSesuai),
      totalMinor: o.totalMinor === null || o.totalMinor === undefined ? null : toInt(o.totalMinor),
      totalMayor: o.totalMayor === null || o.totalMayor === undefined ? null : toInt(o.totalMayor),
      totalKritis: o.totalKritis === null || o.totalKritis === undefined ? null : toInt(o.totalKritis),
      totalHasil: o.totalHasil === null || o.totalHasil === undefined ? null : toInt(o.totalHasil),
      uraianUsaha: strOrNull(o.uraianUsaha),
      alamat: strOrNull(o.alamat),
      // Di mapping ulang setelah spread supaya tipe konsisten dengan interface.
      namaKapal: strOrNull(o.namaKapal),
      noSertifikat: strOrNull(o.noSertifikat),
      namaPemilik: strOrNull(o.namaPemilik),
      gt: o.gt === null || o.gt === undefined ? null : toNum(o.gt),
      alatTangkap: strOrNull(o.alatTangkap),
      namaPelabuhan: strOrNull(o.namaPelabuhan),
      daerahTangkap: strOrNull(o.daerahTangkap),
      grade: strOrNull(o.grade),
      upt: strOrNull(o.upt),
      tglTerbit: strOrNull(o.tglTerbit),
      tglKadaluarsa: strOrNull(o.tglKadaluarsa),
      masaBerlaku: strOrNull(o.masaBerlaku ?? o.tglKadaluarsa),
      statusAktif: toBool(o.statusAktif),
      stsAktif: strOrNull(o.stsAktif),
      // Sisanya diteruskan apa adanya agar kolom baru dari backend tetap tampil.
      ...o,
    };
  });
  const m = asRecord(metaRawRec);
  const meta: PrimerCertificatesMeta = {
    totalRows: toInt(m.totalRows),
    totalPages: toInt(m.totalPages, 1),
    currentPage: toInt(m.currentPage, 1),
    limit: toInt(m.limit, 10),
  };
  if (meta.totalPages < 1 && meta.totalRows > 0 && meta.limit > 0)
    meta.totalPages = Math.ceil(meta.totalRows / meta.limit);
  if (meta.totalPages < 1) meta.totalPages = 1;
  return { items, meta };
};

export const exportPrimerCertificates = async (params: Record<string, unknown> = {}) => {
  const res = await api.get('/export', {
    params: toQuery(params),
    responseType: 'blob',
  });
  const blob = res.data;
  const disposition = res.headers['content-disposition'] as string | undefined;
  let filename = 'primer-export.xlsx';
  if (disposition) {
    const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    if (m?.[1]) filename = decodeURIComponent(m[1]);
  }
  return { blob, filename };
};
