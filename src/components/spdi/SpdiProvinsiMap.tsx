import { useMemo, useState } from 'react';
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet';
import type { Feature, Geometry } from 'geojson';
import type { Layer, Path, PathOptions } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
  indonesiaGeoJson,
  type ProvinceFeatureProperties,
} from '../../constants/indonesiaGeoJson';
import type { SpdiProvinsiItem } from '../../types/spdi';

export interface SpdiProvinsiMapProps {
  /** Sebaran `{ kd_provinsi, total }` dari `GET /dashboard` (`byProvinsi`). */
  data: SpdiProvinsiItem[] | null;
  isLoading: boolean;
  /** Kunci render ulang layer; ubah saat data/filter berganti. */
  dataKey: string;
  /** Dipanggil saat provinsi diklik; nilai `''` berarti semua provinsi. */
  onSelectProvinsi?: (kdProvinsi: string) => void;
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

/** Skala warna koroplet dari volume kecil ke besar (aksen cyan SPDI). */
const SCALE_COLORS = ['#cffafe', '#a5f3fc', '#67e8f9', '#22d3ee', '#0891b2'];

/**
 * Peta sebaran unit SPDI per provinsi.
 *
 * Memakai GeoJSON 38 provinsi yang sama dengan peta landing
 * (`constants/indonesiaGeoJson.ts`), tetapi koropletnya digerakkan kolom
 * `total` dari `byProvinsi` dan pencocokan memakai `kd_provinsi` (kode BPS
 * 2 digit, sama seperti `properties.KODE_PROV`). Mengklik provinsi ikut
 * memasang filter `kd_provinsi` lewat `onSelectProvinsi`.
 */
export default function SpdiProvinsiMap({
  data,
  isLoading,
  dataKey,
  onSelectProvinsi,
}: SpdiProvinsiMapProps) {
  const [hoverInfo, setHoverInfo] = useState<{ kode: string; nama: string; total: number } | null>(
    null
  );

  /** Index cepat `kode -> baris`; kode dinormalkan 2 digit agar pasti cocok. */
  const byCode = useMemo(() => {
    const map = new Map<string, SpdiProvinsiItem>();
    for (const row of data ?? []) {
      if (row.kd_provinsi) {
        map.set(String(row.kd_provinsi).padStart(2, '0'), row);
      }
    }
    return map;
  }, [data]);

  const maxTotal = useMemo(
    () => (data ?? []).reduce((max, row) => Math.max(max, row.total), 0),
    [data],
  );

  const hasAnyData = maxTotal > 0;

  /** Memilih warna berdasarkan total relatif terhadap provinsi terbesar. */
  const colorForTotal = (total: number): string => {
    if (total <= 0) return NO_DATA_COLOR;
    if (maxTotal <= 0) return SCALE_COLORS[0];
    const index = Math.min(SCALE_COLORS.length - 1, Math.floor((total / maxTotal) * SCALE_COLORS.length));
    return SCALE_COLORS[index];
  };

  const styleForFeature = (feature?: Feature<Geometry, ProvinceFeatureProperties>): PathOptions => {
    const kode = String(feature?.properties?.KODE_PROV ?? '').padStart(2, '0');
    const total = byCode.get(kode)?.total ?? 0;
    return {
      color: '#ffffff',
      weight: 0.8,
      fillColor: colorForTotal(total),
      fillOpacity: 0.85,
    };
  };

  const onEachFeature = (
    feature: Feature<Geometry, ProvinceFeatureProperties>,
    layer: Layer,
  ): void => {
    const kode = String(feature.properties?.KODE_PROV ?? '').padStart(2, '0');
    const sebaran = byCode.get(kode);
    const info = {
      kode,
      nama: sebaran?.nama_provinsi ?? feature.properties?.PROVINSI ?? '',
      total: sebaran?.total ?? 0,
    };

    layer.on({
      click: () => onSelectProvinsi?.(kode),
      mouseover: (event) => {
        const target = event.target as Path;
        target.setStyle({ weight: 2, color: '#0e7490', fillOpacity: 0.95 });
        target.bringToFront();
        setHoverInfo(info);
      },
      mouseout: (event) => {
        (event.target as Path).setStyle(styleForFeature(feature));
        setHoverInfo(null);
      },
    });
  };

  return (
    <section
      aria-labelledby="spdi-peta-title"
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-2 flex flex-col gap-1">
        <h3 id="spdi-peta-title" className="text-base font-semibold text-slate-900">
          Peta Sebaran Provinsi
        </h3>
        <p className="text-xs text-slate-500">
          Jumlah unit SPDI per provinsi — klik provinsi untuk memfilter
        </p>
      </div>

      <div className="relative z-0 h-[320px] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        <MapContainer
          center={INDONESIA_CENTER}
          zoom={5}
          minZoom={4}
          maxZoom={12}
          maxBounds={INDONESIA_BOUNDS}
          maxBoundsViscosity={1}
          scrollWheelZoom={false}
          // Atribusi visual disembunyikan; TileLayer tetap membawa attribution
          // sebagai pemenuhan lisensi OpenStreetMap (sama seperti peta landing).
          attributionControl={false}
          className="h-full w-full bg-slate-100"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          <GeoJSON key={dataKey} data={indonesiaGeoJson} style={styleForFeature} onEachFeature={onEachFeature} />
        </MapContainer>

        {isLoading ? (
          <div className="pointer-events-none absolute inset-0 z-[550] flex animate-pulse items-center justify-center bg-white/60">
            <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-md">
              Memuat sebaran provinsi…
            </span>
          </div>
        ) : null}

        {!isLoading && !hasAnyData ? (
          <div className="pointer-events-none absolute inset-0 z-[550] flex items-center justify-center">
            <span className="rounded-lg bg-white/90 px-4 py-2 text-center text-sm text-slate-400 shadow-md">
              Belum ada data provinsi untuk filter yang dipilih.
            </span>
          </div>
        ) : null}

        {/* Info hover provinsi, mengikuti pola panel landing tapi lebih ringkas. */}
        {hoverInfo ? (
          <div className="pointer-events-none absolute left-3 top-3 z-[600] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-md">
            <p className="text-xs font-semibold text-slate-800">{hoverInfo.nama}</p>
            <p className="text-xs text-slate-500">
              {new Intl.NumberFormat('id-ID').format(hoverInfo.total)} unit
            </p>
          </div>
        ) : null}

        {/* Legenda koroplet. */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-md">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Jumlah unit SPDI
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">Rendah</span>
            <div className="flex overflow-hidden rounded-sm">
              {SCALE_COLORS.map((color) => (
                <span key={color} className="h-3 w-5" style={{ backgroundColor: color }} />
              ))}
            </div>
            <span className="text-[10px] text-slate-500">Tinggi</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm border border-slate-300"
              style={{ backgroundColor: NO_DATA_COLOR }}
            />
            <span className="text-[10px] text-slate-500">Tidak ada data</span>
          </div>
        </div>
      </div>
    </section>
  );
}
