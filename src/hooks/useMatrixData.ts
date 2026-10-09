import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FilterParams } from '../types/export';
import { toErrorMessage } from '../utils/errors';

/** Kueri matrix: subset filter global yang didukung dua endpoint matriks. */
export interface MatrixQuery {
  /** Tanggal awal rentang (YYYY-MM-DD). */
  startDate?: string;
  /** Tanggal akhir rentang (YYYY-MM-DD). */
  endDate?: string;
  /** Kode UPT (nilai sudah ternormalisasi, mis. "15.0"). */
  kd_upt?: string;
}

/** Hasil pemuatan data via `useMatrixData`. */
export interface MatrixDataResult<T> {
  /** Data hasil fetch; `null` sebelum selesai atau saat gagal. */
  data: T | null;
  /** `true` selama fetch berjalan (tampilkan skeleton/spinner). */
  isLoading: boolean;
  /** Pesan kesalahan bila fetch gagal; `null` saat sukses. */
  errorMessage: string | null;
  /** Memicu ulang fetch (tombol coba lagi). */
  reload: () => void;
}

/** Hasil fetch beserta "kunci" yang sedang diminta. */
interface MatrixState<T> {
  /** Kunci filter + nonce yang menghasilkan data ini. */
  key: string;
  data: T | null;
  errorMessage: string | null;
}

/**
 * Hook pemuatan data untuk halaman matriks ekspor.
 *
 * `isLoading` DITURUNKAN dari perbandingan kunci, bukan disimpan sebagai state
 * terpisah. Alasannya: menyimpan `isLoading` berarti harus memanggil
 * `setIsLoading(true)` di dalam body effect, yang memicu render berlapis dan
 * dilarang aturan `react-hooks/set-state-in-effect`. Dengan menandai hasil
 * fetch dengan kunci permintaannya, "sedang memuat" cukup berarti
 * `hasil?.key !== keySaatIni` — termasuk setelah `reload()` karena nonce ikut
 * berubah. Semua `setState` lalu hanya terjadi di dalam callback promise.
 *
 * Urutan request dijaga memakai penanda urutan agar respons lama tidak
 * menimpa respons terbaru.
 *
 * @param fetcher Fungsi API yang membangun request ke endpoint matriks.
 * @param query   Subset filter global yang sedang aktif.
 */
export function useMatrixData<T>(
  fetcher: (params: FilterParams) => Promise<T>,
  query: MatrixQuery
): MatrixDataResult<T> {
  const [state, setState] = useState<MatrixState<T> | null>(null);
  /** Dinaikkan `reload()` untuk memaksa fetch ulang pada filter yang sama. */
  const [reloadNonce, setReloadNonce] = useState<number>(0);
  const requestSeq = useRef<number>(0);

  const params = useMemo<FilterParams>(() => {
    const result: FilterParams = {};
    if (query.startDate !== undefined && query.startDate !== null && query.startDate.trim() !== '') {
      result.startDate = query.startDate;
    }
    if (query.endDate !== undefined && query.endDate !== null && query.endDate.trim() !== '') {
      result.endDate = query.endDate;
    }
    if (query.kd_upt !== undefined && query.kd_upt !== null && query.kd_upt.trim() !== '') {
      result.kd_upt = query.kd_upt;
    }
    return result;
  }, [query.startDate, query.endDate, query.kd_upt]);

  /** Kunci unik untuk permintaan ini: filter + nonce reload. */
  const key = `${params.startDate ?? ''}|${params.endDate ?? ''}|${params.kd_upt ?? ''}|${reloadNonce}`;

  useEffect(() => {
    const requestId = ++requestSeq.current;

    // Sengaja TIDAK memakai `.then(x, y)` combined form: kegagalan diAbort/
    // pembatalan harus tetap tercakup agar tidak menjadi unhandled rejection.
    void (async () => {
      try {
        const result = await fetcher(params);
        if (requestId === requestSeq.current) {
          setState({ key, data: result, errorMessage: null });
        }
      } catch (error: unknown) {
        if (requestId === requestSeq.current) {
          setState({ key, data: null, errorMessage: toErrorMessage(error) });
        }
      }
    })();
  }, [fetcher, params, key]);

  const reload = useCallback((): void => {
    setReloadNonce((previous) => previous + 1);
  }, []);

  return {
    data: state?.key === key ? state.data : null,
    // Belum ada hasil untuk kunci saat ini (belum selesai, atau gagal).
    isLoading: state?.key !== key,
    errorMessage: state?.key === key ? state.errorMessage : null,
    reload,
  };
}
