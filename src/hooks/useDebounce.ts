import { useEffect, useState } from 'react';

/**
 * Menunda propagasi sebuah nilai sampai tidak ada perubahan baru selama `delay`.
 *
 * Dipakai untuk input pencarian agar API tidak dipanggil pada setiap ketukan
 * keyboard: nilai mentah tetap dipakai untuk menampilkan teks di input, sedangkan
 * nilai hasil debounce yang dikirim ke API.
 *
 * @param value Nilai mentah yang berubah cepat (mis. isi input).
 * @param delay Jeda dalam milidetik; default 400.
 * @returns Nilai yang sudah stabil setelah `delay`.
 *
 * @example
 * const debounced = useDebounce(searchInput, 400);
 * useEffect(() => { void fetchData(debounced); }, [debounced]);
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Setiap perubahan baru membatalkan timer sebelumnya, sehingga nilai hanya
    // diteruskan setelah pengguna berhenti mengetik.
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
