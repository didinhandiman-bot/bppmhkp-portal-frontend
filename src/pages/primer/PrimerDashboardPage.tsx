import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, Search, CalendarDays } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { useLocation } from 'react-router-dom';

import {
  getPrimerCertificates,
  getPrimerOverview,
  exportPrimerCertificates,
  type PrimerCertificateItem,
  type PrimerOverviewData,
  type PrimerIzinType,
} from '../../services/primerService';

/** Kode `ur_izin` backend untuk tiap sub-menu Primer. */
const KD_IZIN_BY_PATH: Record<string, string> = {
  '/primer/cpib': '032000000034',
  '/primer/cbib': '032000000068',
  '/primer/cppib': '032000000014',
  '/primer/cpoib': '032000000019',
  '/primer/cbib-kapal': '032000000033',
  '/primer/cdoib': '032000000036',
};

/** Sub-menu aktif -> nilai dropdown "Jenis Izin". */
const JENIS_BY_PATH: Record<string, PrimerIzinType> = {
  '/primer/cpib': 'cpib',
  '/primer/cbib': 'cbib',
  '/primer/cppib': 'cppib',
  '/primer/cpoib': 'cpoib',
  '/primer/cbib-kapal': 'cbib-kapal',
  '/primer/cdoib': 'cdoib',
};

const IZIN_OPTIONS: Array<{ value: PrimerIzinType; label: string }> = [
  { value: 'semua', label: 'Semua Primer' },
  { value: 'cpib', label: 'CPIB' },
  { value: 'cbib', label: 'CBIB' },
  { value: 'cppib', label: 'CPPIB' },
  { value: 'cpoib', label: 'CPOIB' },
  { value: 'cbib-kapal', label: 'CPIB Kapal' },
  { value: 'cdoib', label: 'CDOIB' },
];

// Mapping warna sesuai status hasil kelayakan
const STATUS_COLORS: Record<string, string> = {
  'Sangat Baik': '#10b981', // Emerald
  'Baik': '#3b82f6',        // Blue
  'Cukup': '#f59e0b',       // Amber
  'Belum Dinilai': '#94a3b8', // Slate / Gray
};

const FALLBACK_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#94a3b8', '#ef4444', '#8b5cf6'];

const toISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
};

const defaultRange = () => {
  const end = new Date();
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return { startDate: toISO(start), endDate: toISO(end) };
};

const fmtNum = (v: number | null | undefined) => {
  if (v === null || v === undefined) return '-';
  const n = Number(v);
  return Number.isFinite(n) ? new Intl.NumberFormat('id-ID').format(Math.trunc(n)) : '-';
};

/**
 * Tanggal MySQL bisa berupa `YYYY-MM-DD` atau ISO penuh. `new Date(...)`
 * menafsirkan tanggal tanpa zona waktu sebagai UTC, sehingga di WIB tanggal
 * bisa bergeser sehari ke belakang. Karena itu bagian tanggal diambil dari
 * teksnya sendiri, tanpa melewati parsing waktu.
 */
const fmtTgl = (v: string | null | undefined) => {
  if (!v) return '-';
  const s = String(v).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return s;
  return `${m[3]}/${m[2]}/${m[1]}`;
};

const fmtNum2 = (v: number | null | undefined) => {
  if (v === null || v === undefined) return '-';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2).replace('.', ',') : '-';
};

function BadgeHasil({ v }: { v: string | null | undefined }) {
  const s = (v ?? '').trim().toLowerCase();
  if (s.includes('sangat') || s.includes('p1') || s === 'sangat baik') {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
        Sangat Baik
      </span>
    );
  }
  if (s.includes('baik') || s.includes('p2')) {
    return (
      <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200">
        Baik
      </span>
    );
  }
  if (s.includes('cukup') || s.includes('p3')) {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
        Cukup
      </span>
    );
  }
  return <span className="text-slate-600">{v || '-'}</span>;
}

export const PrimerDashboardPage: React.FC = () => {
  const location = useLocation();
  const r = defaultRange();

  const [jenisIzin, setJenisIzin] = useState<PrimerIzinType>(
    JENIS_BY_PATH[location.pathname] ?? 'semua'
  );
  const [startDate, setStartDate] = useState(r.startDate);
  const [endDate, setEndDate] = useState(r.endDate);
  const [search, setSearch] = useState('');
  const dSearch = useDebounce(search, 400);

  const [ov, setOv] = useState<PrimerOverviewData | null>(null);
  const [items, setItems] = useState<PrimerCertificateItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exp, setExp] = useState(false);
  const [detail, setDetail] = useState<PrimerCertificateItem | null>(null);

  const reqOv = useRef(0);
  const reqCert = useRef(0);

  const kdIzinDefault = KD_IZIN_BY_PATH[location.pathname] || undefined;
  const currentKdIzin = kdIzinDefault;
  const isKapal = (currentKdIzin || '').trim() === '032000000033';

  // `jenisIzin` mengikuti sub-menu yang aktif, tapi tetap bisa diubah user lewat
  // dropdown. Nilai default dihitung ulang saat pathname berubah, lalu
  // disimpan sebagai state supaya render berikutnya tidak ikut menimpanya lagi.
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setJenisIzin(JENIS_BY_PATH[location.pathname] ?? 'semua');
    setPage(1);
  }

  const fmtLast = ov?.ringkasan?.tglSyncTerakhir
    ? new Date(ov.ringkasan.tglSyncTerakhir).toLocaleString('id-ID')
    : '-';

  useEffect(() => {
    const id = ++reqOv.current;
    void (async () => {
      try {
        const res = await getPrimerOverview({
          kdIzin: kdIzinDefault,
          jenisIzin,
          startDate,
          endDate,
          search: dSearch,
        } as Record<string, unknown>);
        if (id === reqOv.current) {
          setOv(res);
        }
      } catch {
        // silent
      }
    })();
  }, [jenisIzin, kdIzinDefault, startDate, endDate, dSearch, location.pathname]);

  useEffect(() => {
    const id = ++reqCert.current;
    void (async () => {
      setLoading(true);
      try {
        const res = await getPrimerCertificates({
          kdIzin: kdIzinDefault,
          jenisIzin,
          startDate,
          endDate,
          search: dSearch,
          page,
          limit,
        });
        if (id === reqCert.current) {
          setItems(res.items);
          setTotalPages(res.meta.totalPages);
          setTotalRows(res.meta.totalRows);
        }
      } finally {
        if (id === reqCert.current) setLoading(false);
      }
    })();
  }, [jenisIzin, kdIzinDefault, startDate, endDate, dSearch, page, limit, location.pathname]);

  

  const handleExport = useCallback(async (fmt: 'excel' | 'csv') => {
    try {
      setExp(true);
      const { blob, filename } = await exportPrimerCertificates({
        kdIzin: kdIzinDefault,
        jenisIzin,
        startDate,
        endDate,
        search: dSearch,
        format: fmt,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExp(false);
    }
  }, [jenisIzin, kdIzinDefault, startDate, endDate, dSearch]);

  /**
   * Donut hasil kelayakan untuk jalur primer reguler.
   *
   * `mapBreakdown` di service sudah menormalkan kedua bentuk backend (array
   * `{statusHasil,total}` maupun object) menjadi satu objek bertipe tetap,
   * jadi di sini tidak perlu menebak bentuk respons lagi.
   */
  const donut = useMemo(() => {
    const b = ov?.breakdownHasil;
    if (!b) return [];

    return [
      { name: 'Sangat Baik', value: b.sangatBaik },
      { name: 'Baik', value: b.baik },
      { name: 'Cukup', value: b.cukup },
      { name: 'Perbaikan', value: b.perbaikan },
      { name: 'Tidak Layak', value: b.tidakLayak },
    ].filter((x) => x.value > 0);
  }, [ov]);

  /**
   * Donut grade SCP-IB.
   *
   * Branch kapal backend mengosongkan `breakdownHasil` dan mengisi
   * `distribusiGrade`, jadi donatnya harus dialihkan; kalau tidak, kapal selalu
   * menampilkan "Data hasil kelayakan belum tersedia".
   */
  const gradeDonut = useMemo(
    () =>
      (ov?.distribusiGrade ?? [])
        .map((g) => ({ name: g.grade || 'Non Grade', value: g.total }))
        .filter((g) => g.value > 0),
    [ov]
  );

  const donutData = isKapal ? gradeDonut : donut;

  const cols = isKapal
    ? [
        'No. Sertifikat',
        'Nama Kapal',
        'Pemilik',
        'GT',
        'Alat Tangkap',
        'Pelabuhan',
        'Grade',
        'UPT',
        'Tgl Terbit',
        'Masa Berlaku',
        'Status',
      ]
    : [
        'No Izin',
        'Tgl Izin',
        'NIB & Nama Perseroan',
        'Komoditas',
        'Provinsi',
        'Hasil Kelayakan',
        'Aksi',
      ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Primer</h1>
        <p className="mt-1 text-sm text-slate-600">
          Terintegrasi CPIB, CBIB, CPPIB, CPOIB, CPIB Kapal, dan CDOIB.
        </p>
      </header>

      {/* FILTER BAR */}
      <section className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex min-w-[180px] flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Jenis Izin</label>
          <select
            value={jenisIzin}
            onChange={(e) => {
              setJenisIzin(e.target.value as PrimerIzinType);
              setPage(1);
            }}
            className="appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
          >
            {IZIN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tanggal Mulai</label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm shadow-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tanggal Akhir</label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm shadow-sm"
            />
          </div>
        </div>

        <div className="flex min-w-[260px] flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pencarian</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={isKapal ? "Cari No Sertifikat, Nama Kapal, Pemilik" : "Cari NIB, No Izin, Nama Perseroan, Komoditas"}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm shadow-sm"
            />
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Terakhir diperbarui: {fmtLast}</span>
          <div className="flex gap-1">
            <button
              disabled={exp}
              onClick={() => handleExport('excel')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> Export Excel
            </button>
            <button
              disabled={exp}
              onClick={() => handleExport('csv')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>
      </section>

      {/* KPI METRICS CARD */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isKapal
          ? [
              ['Total Sertifikat Kapal', fmtNum(ov?.ringkasan?.totalSertifikat)],
              ['Total Kapal Aktif', fmtNum(ov?.ringkasan?.totalAktif)],
              ['Total Gross Tonnage (GT)', fmtNum(ov?.ringkasan?.totalGT)],
              ['Total Awak Kapal (ABK)', fmtNum(ov?.ringkasan?.totalABK)],
            ].map(([label, val]) => (
              <div key={label as string} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{val}</p>
              </div>
            ))
          : [
              ['Total Sertifikat', fmtNum(ov?.ringkasan?.totalSertifikat)],
              ['Total NIB Unik', fmtNum(ov?.ringkasan?.totalEntitas)],
              [
                'Rata-rata Temuan (Minor/Mayor/Kritis)',
                `${fmtNum2(ov?.ringkasan?.rataMinor)} / ${fmtNum2(ov?.ringkasan?.rataMayor)} / ${fmtNum2(ov?.ringkasan?.rataKritis)}`,
              ],
              ['Rata-rata Entitas/Sertifikat', fmtNum2(ov?.ringkasan?.rataEntitasPerSertifikat)],
            ].map(([label, val]) => (
              <div key={label as string} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{val}</p>
              </div>
            ))}
      </div>

      {/* CHART ROW 1: TREN BULANAN & DISTRIBUSI KELAYAKAN */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Kiri: Tren Penerbitan Bulanan */}
        <div className="xl:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-base font-semibold text-slate-900">Tren Penerbitan Bulanan</h3>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ov?.trenBulanan || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="labelBulan" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" name="Total Sertifikat" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Kanan: Distribusi Hasil Kelayakan */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-base font-semibold text-slate-900">
            {isKapal ? 'Distribusi Grade SCP-IB (Grade A, B, C, D, Non Grade)' : 'Distribusi Hasil Kelayakan'}
          </h3>
          <div className="h-[320px] w-full flex items-center justify-center">
            {donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4}>
                    {donutData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={STATUS_COLORS[entry.name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center">
                <p className="text-sm font-medium text-slate-400">
                  {isKapal ? 'Data grade SCP-IB belum tersedia' : 'Data hasil kelayakan belum tersedia'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {isKapal ? 'Kolom grade_scpib pada armada masih kosong' : 'Status kelayakan di database masih kosong'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CHART ROW 2 */}
      {isKapal ? (
        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-base font-semibold text-slate-900">Segmentasi Tonase Armada (&lt;10 GT, 10-30 GT, 31-100 GT, &gt;100 GT)</h3>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ov?.tonaseArmada ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-base font-semibold text-slate-900">Top Alat Tangkap Dominan</h3>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ov?.alatTangkap ?? []} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="nama" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-base font-semibold text-slate-900">Sebaran Daerah Tangkapan (WPP) & Top Pelabuhan Pangkalan</h3>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ov?.sebaranWpp ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="wpp" angle={-30} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-base font-semibold text-slate-900">Top 10 Provinsi Terbanyak</h3>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(ov?.distribusiWilayah || []).slice(0, 10)} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="provinsi" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-base font-semibold text-slate-900">Top Komoditas Terbanyak</h3>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(ov?.distribusiKomoditas || []).slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="komoditas" angle={-30} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TABEL DATA SERTIFIKAT */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-900">Data Sertifikat</h2>
          <span className="text-xs text-slate-500">
            {fmtNum(totalRows)} data • Halaman {page}/{totalPages}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {cols.map((c) => (
                  <th key={c} className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-slate-600">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: cols.length }).map((__, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-2 w-full animate-pulse rounded bg-slate-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={cols.length} className="px-3 py-10 text-center text-slate-400">
                    Tidak ada data
                  </td>
                </tr>
              ) : isKapal ? (
                items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/60">
                    <td className="max-w-[220px] truncate px-3 py-2.5 font-mono text-xs">
                      {it.noSertifikat || it.noIzin || '-'}
                    </td>
                    <td className="px-3 py-2.5">{it.namaKapal || '-'}</td>
                    <td className="px-3 py-2.5">{it.namaPemilik ?? '-'}</td>
                    <td className="px-3 py-2.5 tabular-nums">
                      {it.gt === null || it.gt === undefined ? '-' : fmtNum(it.gt)}
                    </td>
                    <td className="px-3 py-2.5">{it.alatTangkap || '-'}</td>
                    <td className="px-3 py-2.5">
                      <div>{it.namaPelabuhan || '-'}</div>
                      {it.daerahTangkap && (
                        <div className="text-xs text-slate-500">{it.daerahTangkap}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">{it.grade || '-'}</td>
                    <td className="px-3 py-2.5">{it.upt || it.kdDaerah || '-'}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{fmtTgl(it.tglTerbit ?? it.tglIzin)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      {fmtTgl(it.masaBerlaku || it.tglKadaluarsa)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                          it.statusAktif
                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-600'
                            : 'border border-rose-200 bg-rose-50 text-rose-600'
                        }`}
                      >
                        {it.statusAktif ? 'Aktif' : 'Kedaluwarsa'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/60">
                    <td className="max-w-[220px] truncate px-3 py-2.5 font-mono text-xs">{it.noIzin || '-'}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{it.tglIzin || '-'}</td>
                    <td className="max-w-[280px] px-3 py-2.5">
                      <div className="truncate font-medium">{it.namaPerseroan || '-'}</div>
                      {it.nib && <div className="text-xs text-slate-500">NIB: {it.nib}</div>}
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-2.5">{it.komoditas || '-'}</td>
                    <td className="px-3 py-2.5">{it.provinsi || '-'}</td>
                    <td className="px-3 py-2.5">
                      <BadgeHasil v={it.hasilKelayakan} />
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => setDetail(it)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs shadow-sm hover:bg-slate-50"
                      >
                        View Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <div className="text-xs text-slate-500">
            Halaman {page} dari {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DETAIL */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-base font-semibold">Detail Sertifikat</h3>
              <button onClick={() => setDetail(null)} className="text-slate-500 hover:text-slate-700">
                ✕
              </button>
            </div>
            <div className="grid gap-3 p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-slate-500">No Izin</p>
                <p className="font-medium">{detail.noIzin || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">Tgl Izin</p>
                <p>{detail.tglIzin || '-'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-slate-500">Nama Perseroan</p>
                <p className="font-medium">{detail.namaPerseroan || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">NIB</p>
                <p>{detail.nib || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">Provinsi</p>
                <p>{detail.provinsi || '-'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-slate-500">Alamat</p>
                <p className="whitespace-pre-wrap">{detail.alamat || '-'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-slate-500">Uraian Usaha</p>
                <p className="whitespace-pre-wrap">{detail.uraianUsaha || '-'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-slate-500">Komoditas</p>
                <p>{detail.komoditas || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">Hasil Kelayakan</p>
                <BadgeHasil v={detail.hasilKelayakan} />
              </div>
              <div>
                <p className="text-slate-500">Status Checklist</p>
                <p>{detail.statusChecklist || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">Total Sesuai</p>
                <p>{fmtNum(detail.totalSesuai)}</p>
              </div>
              <div>
                <p className="text-slate-500">Minor</p>
                <p>{fmtNum(detail.totalMinor)}</p>
              </div>
              <div>
                <p className="text-slate-500">Mayor</p>
                <p>{fmtNum(detail.totalMayor)}</p>
              </div>
              <div>
                <p className="text-slate-500">Kritis</p>
                <p>{fmtNum(detail.totalKritis)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrimerDashboardPage;