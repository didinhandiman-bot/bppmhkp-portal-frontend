import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  fetchMasterUptOptions,
  fetchTopDestinationsByProduct,
  fetchTopProductsByDestination,
  fetchUptBreakdown,
} from '../../services/smkhpService';
import { getApiMessage, type ApiErrorResponse } from '../../types/api';
import type {
  MatrixDestinationRow,
  MatrixProductRow,
  Periode,
  SmkhpFilters,
} from '../../types/smkhp';
import type { UptBreakdownRow, UptOption } from '../../types/upt';

type MatrixMode = 'produk-per-negara' | 'negara-per-produk';

const rupiah = (value: number): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

const juta = (value: number): string =>
  `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)} Jt`;

/** Warna tanda YoY: hijau positif, merah negatif. */
const yoyClass = (value: number): string =>
  value > 0 ? 'text-emerald-600' : value < 0 ? 'text-red-600' : 'text-slate-400';

const PeriodeBadge: React.FC<{ periode?: Periode; previous?: Periode }> = ({
  periode,
  previous,
}) => {
  if (!periode) return null;
  return (
    <p className="text-xs text-slate-500">
      Periode {periode.startDate} s/d {periode.endDate}
      {previous && (
        <span className="ml-2">
          (banding {previous.startDate} s/d {previous.endDate})
        </span>
      )}
    </p>
  );
};

/**
 * Halaman uji SMKHP: dropdown filter UPT + matriks hasil fetch dari backend.
 *
 * Dropdown memakai master `GET /api/v1/options/upt` (46 UPT aktif), bukan
 * `/upt-breakdown`, supaya UPT yang belum punya transaksi pada periode terpilih
 * tetap muncul sebagai opsi filter. Tabel rekap di bawah tetap memakai
 * `/upt-breakdown` karena hanya endpoint itu yang punya angka.
 */
export const SmkhpView: React.FC = () => {
  const navigate = useNavigate();

  const [uptOptions, setUptOptions] = useState<UptOption[]>([]);
  const [uptBreakdown, setUptBreakdown] = useState<UptBreakdownRow[]>([]);
  const [kdUpt, setKdUpt] = useState<string>('');
  const [tahun, setTahun] = useState<string>('');
  const [bulan, setBulan] = useState<string>('');
  const [mode, setMode] = useState<MatrixMode>('produk-per-negara');

  const [destinations, setDestinations] = useState<MatrixDestinationRow[]>([]);
  const [products, setProducts] = useState<MatrixProductRow[]>([]);
  const [periode, setPeriode] = useState<Periode | undefined>();
  const [previousPeriode, setPreviousPeriode] = useState<Periode | undefined>();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => String(currentYear - i));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1));

  const buildFilters = useCallback((): SmkhpFilters => {
    const filters: SmkhpFilters = {};
    if (kdUpt) filters.kdUpt = kdUpt;
    if (tahun) filters.tahun = tahun;
    if (bulan) filters.bulan = bulan;
    return filters;
  }, [kdUpt, tahun, bulan]);

  // Opsi dropdown diambil dari master: tidak ikut ter-filter tahun/bulan/UPT,
  // sehingga daftar UPT tetap lengkap meski periode tertentu belum ada data.
  useEffect(() => {
    let active = true;

    fetchMasterUptOptions()
      .then((options) => {
        if (active) setUptOptions(options);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setErrorMessage(
          axios.isAxiosError<ApiErrorResponse>(err)
            ? getApiMessage(err.response?.data, 'Gagal memuat master UPT')
            : 'Gagal memuat master UPT'
        );
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    // Rekap angka per UPT mengikuti filter yang aktif. Kegagalan di sini
    // sengaja dibuang: matriks tetap tampil, hanya tabel rekap kosong.
    fetchUptBreakdown(buildFilters())
      .then((rows) => {
        if (active) setUptBreakdown(rows);
      })
      .catch(() => {
        if (active) setUptBreakdown([]);
      });

    return () => {
      active = false;
    };
  }, [buildFilters]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const filters = buildFilters();

        if (mode === 'produk-per-negara') {
          const data = await fetchTopProductsByDestination(filters, { products: 5 });
          if (!active) return;
          setDestinations(data.destinations);
          setProducts([]);
          setPeriode(data.periode);
          setPreviousPeriode(data.previousPeriode);
        } else {
          const data = await fetchTopDestinationsByProduct(filters, {
            products: 5,
            destinations: 5,
          });
          if (!active) return;
          setProducts(data.products);
          setDestinations([]);
          setPeriode(data.periode);
          setPreviousPeriode(data.previousPeriode);
        }
      } catch (err: unknown) {
        if (!active) return;
        setErrorMessage(
          axios.isAxiosError<ApiErrorResponse>(err)
            ? getApiMessage(err.response?.data, 'Gagal memuat data SMKHP')
            : 'Gagal memuat data SMKHP'
        );
        setDestinations([]);
        setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [mode, buildFilters]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Uji Data SMKHP</h1>
          <p className="text-sm text-slate-600 mt-1">
            Matriks Toleransi Kontrol Mutu dan Harga Produk — data riil dari backend.          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          Kembali ke Dashboard
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label
              htmlFor="upt"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              UPT
            </label>
            <select
              id="upt"
              value={kdUpt}
              onChange={(e) => setKdUpt(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none bg-white"
            >
              <option value="">Semua UPT ({uptOptions.length})</option>
              {uptOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value} — {option.label}
                  {option.kota ? ` (${option.kota})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="tahun"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Tahun
            </label>
            <select
              id="tahun"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none bg-white"
            >
              <option value="">Semua (YTD)</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="bulan"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Bulan
            </label>
            <select
              id="bulan"
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none bg-white"
            >
              <option value="">Semua</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 flex-wrap">
          <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden text-sm">
            <button
              onClick={() => setMode('produk-per-negara')}
              className={`px-3 py-1.5 transition-colors cursor-pointer ${
                mode === 'produk-per-negara'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Produk per Negara
            </button>
            <button
              onClick={() => setMode('negara-per-produk')}
              className={`px-3 py-1.5 transition-colors cursor-pointer ${
                mode === 'negara-per-produk'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Negara per Produk
            </button>
          </div>
          <PeriodeBadge periode={periode} previous={previousPeriode} />
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {loading && (
        <p className="text-sm text-slate-500">Memuat data…</p>
      )}

      {/* Matriks 1: produk utama per negara tujuan */}
      {!loading && mode === 'produk-per-negara' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left font-semibold text-slate-700 px-4 py-3">
                  Negara Tujuan
                </th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">
                  Total (USD Jt)
                </th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">YoY</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">
                  Share Nasional
                </th>
                <th className="text-left font-semibold text-slate-700 px-4 py-3">
                  Top Produk
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {destinations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada data untuk filter ini.
                  </td>
                </tr>
              )}
              {destinations.map((row) => (
                <tr key={row.destination} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{row.destination}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {juta(row.total_value_usd_juta)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums font-medium ${yoyClass(
                      row.yoy_percentage
                    )}`}
                  >
                    {row.yoy_percentage > 0 ? '+' : ''}
                    {row.yoy_percentage.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {row.share_negara_percentage.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3">
                    <ul className="space-y-1">
                      {row.top_products.map((product) => (
                        <li key={product.product_name} className="flex justify-between gap-3">
                          <span className="text-slate-700">
                            {product.product_name}
                            <span className="text-slate-400 ml-1">
                              ({product.share_percentage.toFixed(1)}%)
                            </span>
                          </span>
                          <span className="tabular-nums text-slate-600">
                            {juta(product.value_usd_juta)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Matriks 2: pasar utama per produk */}
      {!loading && mode === 'negara-per-produk' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left font-semibold text-slate-700 px-4 py-3">Produk</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">
                  Total (USD Jt)
                </th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">YoY</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">
                  Share Nasional
                </th>
                <th className="text-left font-semibold text-slate-700 px-4 py-3">
                  Top Negara Tujuan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada data untuk filter ini.
                  </td>
                </tr>
              )}
              {products.map((row) => (
                <tr key={row.product_name} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{row.product_name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {juta(row.total_value_usd_juta)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums font-medium ${yoyClass(
                      row.yoy_percentage
                    )}`}
                  >
                    {row.yoy_percentage > 0 ? '+' : ''}
                    {row.yoy_percentage.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {row.share_product_percentage.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3">
                    <ul className="space-y-1">
                      {row.top_destinations.map((destination) => (
                        <li
                          key={destination.destination}
                          className="flex justify-between gap-3"
                        >
                          <span className="text-slate-700">
                            {destination.destination}
                            <span className="text-slate-400 ml-1">
                              ({destination.share_percentage.toFixed(1)}%)
                            </span>
                          </span>
                          <span className="tabular-nums text-slate-600">
                            {juta(destination.value_usd_juta)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rekap angka per UPT. Bedanya dengan dropdown: angka hanya ada untuk
          UPT yang punya transaksi pada filter aktif. */}
      {!loading && uptBreakdown.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">
              Rekap Kontribusi per UPT ({uptBreakdown.length} dari {uptOptions.length} UPT punya
              transaksi)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Diambil dari <code className="font-mono">GET /upt-breakdown</code> dengan filter yang
              aktif. Opsi dropdown di atas memakai master{' '}
              <code className="font-mono">GET /api/v1/options/upt</code> ({uptOptions.length} UPT
              aktif), sehingga UPT tanpa transaksi tetap bisa dipilih.
            </p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left font-semibold text-slate-700 px-4 py-3">Kode</th>
                <th className="text-left font-semibold text-slate-700 px-4 py-3">Nama UPT</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">Dokumen</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">Netto (Ton)</th>
                <th className="text-right font-semibold text-slate-700 px-4 py-3">Nilai (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {uptBreakdown.map((row) => (
                <tr key={row.kode_upt} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-slate-700">{row.kode_upt}</td>
                  <td className="px-4 py-2.5 text-slate-800">{row.nama_upt}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                    {new Intl.NumberFormat('id-ID').format(row.totalDokumenAju)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                    {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(
                      row.totalNettoTon
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                    {rupiah(row.totalNilaiRupiah)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SmkhpView;
