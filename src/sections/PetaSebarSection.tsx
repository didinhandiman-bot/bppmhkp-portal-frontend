import { useEffect, useState } from 'react';

import MapIndonesiaLeaflet from '../components/map/MapIndonesiaLeaflet';
import { fetchPetaSebaran } from '../services/landingService';
import type { ProvinsiSebaran } from '../types/petaSebar';

/** Pilihan tahun pada dropdown, terbaru lebih dulu. */
const TAHUN_OPTIONS = [
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
];

/**
 * Hasil fetch terakhir beserta tahun yang dilayaninya.
 *
 * Menyimpan `year` di dalam state (bukan flag `isLoading` terpisah) membuat
 * status memuat bisa DITURUNKAN: selama `year` belum sama dengan tahun terpilih,
 * artinya permintaan untuk tahun itu masih berjalan. Pola ini menghindari
 * `setState` sinkron di dalam `useEffect`, yang dilarang oleh
 * `react-hooks/set-state-in-effect`.
 */
interface SebaranResult {
  year: string;
  rows: ProvinsiSebaran[];
  error: string | null;
}

/**
 * Section peta sebaran UPT & penerbitan sertifikasi mutu BPPMHKP.
 *
 * Bertindak sebagai section kedua landing page (setelah Hero). Ia memegang
 * state `selectedYear` dan mengambil data dari `GET /api/v1/landing/peta-sebar`
 * setiap kali tahun berubah, lalu meneruskannya ke `MapIndonesiaLeaflet`.
 *
 * Judul dan filter tahun sengaja diletakkan di ATAS peta sebagai header section
 * (alur dokumen biasa), bukan kartu mengambang: overlay sebelumnya menutupi
 * kontrol zoom Leaflet di kiri atas dan bertabrakan dengan popup provinsi.
 */
export const PetaSebarSection = () => {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [result, setResult] = useState<SebaranResult>({ year: '', rows: [], error: null });

  useEffect(() => {
    let active = true;

    fetchPetaSebaran(selectedYear)
      .then((rows) => {
        if (active) setResult({ year: selectedYear, rows, error: null });
      })
      .catch(() => {
        if (active) {
          setResult({
            year: selectedYear,
            rows: [],
            error: 'Gagal memuat data peta sebaran.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [selectedYear]);

  const isLoading = result.year !== selectedYear;
  const data = isLoading ? [] : result.rows;
  const error = isLoading ? null : result.error;

  return (
    <section
      id="peta-sebar"
      className="w-full border-y border-slate-200 bg-slate-50 py-10 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/50"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* HEADER SECTION — judul & filter tahun, di atas peta (bukan overlay) */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-block h-6 w-2 rounded-full bg-blue-600" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Sebaran Nasional
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Peta Sebaran UPT dan Penerbitan Sertifikasi Mutu BPPMHKP
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Klik provinsi untuk melihat rincian sertifikasi mutu primer dan pasca panen.
            </p>
          </div>

          {/* FILTER TAHUN */}
          <div className="flex items-center gap-3 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-xs md:self-auto dark:border-slate-700 dark:bg-slate-800">
            <label
              htmlFor="pilih-tahun"
              className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              Pilih Tahun:
            </label>
            <select
              id="pilih-tahun"
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="cursor-pointer bg-transparent text-sm font-bold text-blue-600 focus:outline-none dark:text-blue-400"
            >
              {TAHUN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="text-slate-800">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <p className="mb-4 text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
        ) : null}

        {/* MAP CONTAINER — `z-0` mengurung z-index pane Leaflet agar tidak
            menutupi navbar sticky di atasnya. */}
        <div className="relative z-0 h-[580px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md sm:h-[640px] dark:border-slate-800 dark:bg-slate-900">
          <MapIndonesiaLeaflet data={data} selectedYear={selectedYear} />

          {/* Indikator proses di tengah peta; `pointer-events-none` supaya
              kontrol peta tetap bisa diklik saat memuat. */}
          {isLoading ? (
            <div className="pointer-events-none absolute inset-0 z-[550] flex items-center justify-center bg-white/40 dark:bg-slate-900/40">
              <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-md dark:bg-slate-800 dark:text-slate-200">
                Memuat data tahun {selectedYear}…
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default PetaSebarSection;
