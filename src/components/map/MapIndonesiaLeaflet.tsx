import { useEffect, useMemo, useState } from 'react';
import { GeoJSON, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { MapPin } from 'lucide-react';
import type { Feature, Geometry } from 'geojson';
import type { Layer, Path, PathOptions } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
  indonesiaGeoJson,
  type ProvinceFeatureProperties,
} from '../../constants/indonesiaGeoJson';
import { fetchUptMarkers } from '../../services/landingService';
import type { ProvinsiSebaran, UptMarker } from '../../types/petaSebar';

export interface MapIndonesiaLeafletProps {
  /** Data sebaran per provinsi dari `GET /api/v1/landing/peta-sebar`. */
  data: ProvinsiSebaran[];
  /** Tahun aktif, dipakai pada panel detail dan sebagai kunci render ulang. */
  selectedYear: string;
}

/** Titik tengah awal peta (perkiraan tengah kepulauan Indonesia). */
const INDONESIA_CENTER: [number, number] = [-2.2, 118];

/** Batas geser peta agar tidak keluar jauh dari Indonesia. */
const INDONESIA_BOUNDS: [[number, number], [number, number]] = [
  [-13, 92],
  [9, 143],
];

/** Warna provinsi tanpa data. */
const NO_DATA_COLOR = '#e2e8f0';

/** Skala warna koroplet dari volume kecil ke besar. */
const SCALE_COLORS = ['#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#1d4ed8'];

/**
 * Ikon marker UPT: titik biru berdenyut.
 *
 * Memakai `divIcon` (bukan gambar marker bawaan Leaflet) supaya animasi pulse
 * bisa diatur lewat CSS dan tidak bergantung pada aset marker Leaflet yang
 * sering rusak di bundler. Keyframes-nya ada di `src/index.css`
 * (`@keyframes upt-pulse`), bukan `<style>` di dalam HTML ikon — kalau
 * ditanam per ikon, blok `@keyframes` yang identik akan terduplikasi untuk
 * setiap marker (46 kali).
 */
const uptMarkerIcon = divIcon({
  className: 'upt-pulse-marker',
  html: '<span class="upt-pulse-ring"></span><span class="upt-pulse-core"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

/** Provinsi yang sedang dipilih untuk ditampilkan di panel detail. */
interface SelectedProvinceInfo {
  /**
   * Tahun data saat provinsi diklik.
   *
   * Dipakai untuk mendeteksi pilihan yang sudah kedaluwarsa: bila tahun aktif
   * berubah, panel otomatis tertutup TANPA perlu `setState` di dalam
   * `useEffect` (yang dilarang `react-hooks/set-state-in-effect`).
   */
  year: string;
  nama: string;
  kode: string;
}

/**
 * Ganti `src` logo saat gagal dimuat, bertingkat:
 * `/images/provinsi/…` -> `/images/propinsi/…` -> `/images/logo-kkp.svg`.
 *
 * Dipakai bersama oleh panel detail (React `onError`) agar logika cadangan
 * tidak terduplikasi.
 */
const handleLogoError = (img: HTMLImageElement, kode: string): void => {
  if (img.dataset.logoStage === 'alt') {
    img.onerror = null;
    img.src = '/images/logo-kkp.svg';
    return;
  }
  img.dataset.logoStage = 'alt';
  img.src = `/images/propinsi/${kode}.png`;
};

/** Total seluruh metrik satu provinsi, dipakai untuk pewarnaan koroplet. */
const provinceTotal = (provinsi: ProvinsiSebaran): number => {
  const { primer, pascaPanen } = provinsi;
  return (
    primer.cpib +
    primer.cbib +
    primer.cppib +
    primer.cpoib +
    primer.cdoib +
    primer.cpibKapal +
    pascaPanen.skp +
    pascaPanen.haccp.gradeA +
    pascaPanen.haccp.gradeB +
    pascaPanen.haccp.gradeC
  );
};

/** Memilih warna berdasarkan total relatif terhadap provinsi terbesar. */
const colorForTotal = (total: number, max: number): string => {
  if (total <= 0) {
    return NO_DATA_COLOR;
  }
  if (max <= 0) {
    return SCALE_COLORS[0];
  }
  const index = Math.min(SCALE_COLORS.length - 1, Math.floor((total / max) * SCALE_COLORS.length));
  return SCALE_COLORS[index];
};

/**
 * Satu baris metrik pada panel detail.
 *
 * `valueClass` dipisah agar tiap metrik bisa memakai warna aksen berbeda
 * (biru untuk primer, hijau/amber/merah untuk grade HACCP, dst).
 */
const MetricRow = ({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: number;
  valueClass: string;
}) => (
  <div className="flex justify-between">
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
    <span className={`font-bold ${valueClass}`}>{value.toLocaleString('id-ID')}</span>
  </div>
);

/**
 * Peta sebaran Indonesia berbasis Leaflet (Vite + React 19).
 *
 * Komponen ini:
 * - merender GeoJSON 38 provinsi dan mewarnainya sesuai volume penerbitan;
 * - membuka panel detail di pojok kanan atas saat provinsi diklik (BUKAN
 *   `layer.bindPopup`) sehingga tidak ada lagi popup yang terpotong border
 *   container bagian atas;
 * - menampilkan marker UPT dari `GET /api/v1/landing/upt-marker`.
 *
 * Marker UPT diambil di dalam komponen supaya pemanggil cukup mengirim `data`
 * dan `selectedYear`. Kegagalan pengambilan marker tidak mematikan peta.
 */
export default function MapIndonesiaLeaflet({ data, selectedYear }: MapIndonesiaLeafletProps) {
  const [markers, setMarkers] = useState<UptMarker[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<SelectedProvinceInfo | null>(null);

  useEffect(() => {
    let active = true;
    fetchUptMarkers()
      .then((rows) => {
        if (active) setMarkers(rows);
      })
      .catch(() => {
        // Marker bersifat pelengkap; biarkan peta tetap tampil bila gagal.
        if (active) setMarkers([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const byCode = useMemo(() => {
    const map = new Map<string, ProvinsiSebaran>();
    for (const provinsi of data) {
      map.set(provinsi.kodeProvinsi, provinsi);
    }
    return map;
  }, [data]);

  const maxTotal = useMemo(
    () => data.reduce((max, provinsi) => Math.max(max, provinceTotal(provinsi)), 0),
    [data],
  );

  /**
   * Kunci render ulang GeoJSON.
   *
   * Leaflet hanya memakai `style`/`onEachFeature` saat layer dibuat, sehingga
   * perubahan data tidak memperbarui pewarnaan. Kunci ini memaksa layer
   * dibangun ulang begitu tahun atau datanya berubah.
   */
  const geoKey = useMemo(() => {
    let checksum = 0;
    for (const provinsi of data) {
      checksum = (checksum * 31 + provinceTotal(provinsi)) % 2147483647;
    }
    return `${selectedYear}-${data.length}-${checksum}`;
  }, [data, selectedYear]);

  /**
   * Provinsi yang panelnya boleh tampil.
   *
   * Pilihan disimpan bersama `year`-nya, jadi saat filter tahun berganti
   * pilihan lama otomatis dianggap kedaluwarsa dan panel tertutup sendiri.
   * Pendekatan turunan ini menggantikan `useEffect(() => setSelected(null))`
   * yang melanggar `react-hooks/set-state-in-effect`.
   */
  const activeProvince =
    selectedProvince && selectedProvince.year === selectedYear ? selectedProvince : null;
  const activeData = activeProvince ? byCode.get(activeProvince.kode) : undefined;

  const styleForFeature = (feature?: Feature<Geometry, ProvinceFeatureProperties>): PathOptions => {
    const kode = String(feature?.properties?.KODE_PROV ?? '').padStart(2, '0');
    const total = byCode.has(kode) ? provinceTotal(byCode.get(kode) as ProvinsiSebaran) : 0;
    return {
      color: '#ffffff',
      weight: 0.8,
      fillColor: colorForTotal(total, maxTotal),
      fillOpacity: 0.85,
    };
  };

  const onEachFeature = (
    feature: Feature<Geometry, ProvinceFeatureProperties>,
    layer: Layer,
  ): void => {
    const kode = String(feature.properties?.KODE_PROV ?? '').padStart(2, '0');
    const sebaran = byCode.get(kode);

    layer.on({
      click: () => {
        setSelectedProvince({
          year: selectedYear,
          nama: sebaran?.namaProvinsi ?? feature.properties?.PROVINSI ?? '',
          kode,
        });
      },
      mouseover: (event) => {
        const target = event.target as Path;
        target.setStyle({ weight: 2, color: '#1d4ed8', fillOpacity: 0.95 });
        target.bringToFront();
      },
      mouseout: (event) => {
        (event.target as Path).setStyle(styleForFeature(feature));
      },
    });
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={INDONESIA_CENTER}
        zoom={5}
        minZoom={4}
        maxZoom={12}
        maxBounds={INDONESIA_BOUNDS}
        maxBoundsViscosity={1}
        scrollWheelZoom={false}
        // Atribusi Leaflet/OpenStreetMap disembunyikan sesuai kebutuhan tampilan.
        // Prop `attribution` pada `TileLayer` tetap dipertahankan sebagai
        // pemenuhan lisensi, hanya kontrol visualnya yang tidak dirender.
        attributionControl={false}
        className="h-full w-full bg-slate-100 dark:bg-slate-800"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <GeoJSON
          key={geoKey}
          data={indonesiaGeoJson}
          style={styleForFeature}
          onEachFeature={onEachFeature}
        />

        {markers.map((marker) => (
          <Marker
            key={marker.kodeUpt}
            position={[marker.latitude, marker.longitude]}
            icon={uptMarkerIcon}
          >
            <Popup className="custom-upt-popup" maxWidth={280} minWidth={240}>
              <div className="font-sans text-slate-800">
                <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Unit Pelaksana Teknis
                </span>
                <h4 className="mb-2 text-sm font-extrabold leading-snug text-slate-900">
                  {marker.nama || marker.nmUnit || marker.kodeUpt}
                </h4>

                <div className="space-y-1 border-t border-slate-100 pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-rose-500" aria-hidden="true" />
                    <span>{marker.kota || '-'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    {marker.alamat || 'Alamat belum tersedia.'}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legenda koroplet, diposisikan di atas tile tapi di bawah kontrol Leaflet. */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-md dark:border-slate-700 dark:bg-slate-900/95">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Volume penerbitan
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Rendah</span>
          <div className="flex overflow-hidden rounded-sm">
            {SCALE_COLORS.map((color) => (
              <span key={color} className="h-3 w-5" style={{ backgroundColor: color }} />
            ))}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Tinggi</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm border border-slate-300 dark:border-slate-600"
            style={{ backgroundColor: NO_DATA_COLOR }}
          />
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Tidak ada data</span>
        </div>
      </div>

      {/* PANEL DETAIL MENGAMBANG — slide-in dari kanan, di pojok kanan atas peta. */}
      <div
        className={`absolute right-4 top-4 z-[1000] w-80 max-w-[calc(100%-2rem)] rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xl shadow-slate-900/10 backdrop-blur-md transition-all duration-300 ease-out dark:border-slate-700/80 dark:bg-slate-900/95 ${
          activeProvince ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-8 opacity-0'
        }`}
        role="dialog"
        aria-label="Rincian sertifikasi provinsi"
        aria-hidden={activeProvince ? undefined : true}
      >
        {activeProvince ? (
          <div className="text-slate-800 dark:text-slate-100">
            {/* Header: logo provinsi, nama, tombol tutup */}
            <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src={`/images/provinsi/${activeProvince.kode}.png`}
                  onError={(event) => handleLogoError(event.currentTarget, activeProvince.kode)}
                  alt={`Logo ${activeProvince.nama}`}
                  className="h-10 w-10 object-contain"
                />
                <div className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Provinsi
                  </span>
                  <h4 className="text-sm font-extrabold leading-tight text-slate-900 dark:text-white">
                    {activeProvince.nama}
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProvince(null)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Tutup panel rincian"
              >
                ✕
              </button>
            </div>

            {/* Rincian Sertifikasi Mutu Primer */}
            <div className="mb-3">
              <div className="mb-2 rounded-md bg-slate-100/80 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800/80 dark:text-slate-300">
                Sertifikasi Mutu Primer
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-1 text-xs">
                <MetricRow
                  label="CPIB"
                  value={activeData?.primer.cpib ?? 0}
                  valueClass="text-blue-600 dark:text-blue-400"
                />
                <MetricRow
                  label="CBIB"
                  value={activeData?.primer.cbib ?? 0}
                  valueClass="text-blue-600 dark:text-blue-400"
                />
                <MetricRow
                  label="CPPIB"
                  value={activeData?.primer.cppib ?? 0}
                  valueClass="text-blue-600 dark:text-blue-400"
                />
                <MetricRow
                  label="CPOIB"
                  value={activeData?.primer.cpoib ?? 0}
                  valueClass="text-blue-600 dark:text-blue-400"
                />
                <MetricRow
                  label="CDOIB"
                  value={activeData?.primer.cdoib ?? 0}
                  valueClass="text-blue-600 dark:text-blue-400"
                />
                <MetricRow
                  label="CPIB Kapal"
                  value={activeData?.primer.cpibKapal ?? 0}
                  valueClass="text-blue-600 dark:text-blue-400"
                />
              </div>
            </div>

            {/* Rincian Sertifikasi Mutu Pasca Panen */}
            <div>
              <div className="mb-2 rounded-md bg-slate-100/80 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800/80 dark:text-slate-300">
                Sertifikasi Mutu Pasca Panen
              </div>
              <div className="space-y-1 px-1 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-1 font-semibold dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-200">SKP</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {(activeData?.pascaPanen.skp ?? 0).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="pt-1 text-[11px] font-semibold text-slate-400">HACCP:</div>
                <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-100 bg-slate-50 py-1 text-center dark:border-slate-700 dark:bg-slate-800/60">
                  <div>
                    <span className="block text-[10px] text-slate-400">Grade A</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {activeData?.pascaPanen.haccp.gradeA ?? 0}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">Grade B</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {activeData?.pascaPanen.haccp.gradeB ?? 0}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">Grade C</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {activeData?.pascaPanen.haccp.gradeC ?? 0}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between pt-1 font-semibold">
                  <span className="text-slate-700 dark:text-slate-200">Jumlah UPI</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {(activeData?.pascaPanen.jumlahUpi ?? 0).toLocaleString('id-ID')}
                  </span>
                </div>

                {activeData ? null : (
                  <div className="pt-1 text-[10px] text-slate-400">
                    Belum ada penerbitan pada tahun ini.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
