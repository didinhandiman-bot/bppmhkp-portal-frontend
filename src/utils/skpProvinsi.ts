import type { SkpListItem } from '../types/skp';

/** Opsi dropdown provinsi: `provinsi_id` backend + nama untuk ditampilkan. */
export interface SkpProvinsiOption {
  /** Dikirim sebagai `provinsiId`; backend mencocokkan `provinsi_id = :provinsiId`. */
  id: string;
  name: string;
}

/**
 * Turunkan opsi provinsi dari baris tabel yang sudah dimuat.
 *
 * Batasan penting: backend belum menyediakan endpoint daftar provinsi, dan
 * `/distribution` hanya mengembalikan 10 wilayah teratas **tanpa**
 * `provinsi_id`. Karena filter backend memakai persamaan
 * `provinsi_id = :provinsiId` (`skpRepository.js`), nama provinsi tidak bisa
 * dipakai sebagai nilai — hanya id. Opsi ini karena itu diambil dari pasangan
 * `provinsi_id` + `provinsi` pada baris tabel, sehingga isinya selalu id yang
 * valid, tapi cakupannya terbatas pada provinsi yang sudah muncul di halaman
 * yang termuat.
 *
 * Solusi tuntas: endpoint master provinsi di backend (mis.
 * `GET /api/v1/options/wilayah`). Sampai itu tersedia, dropdown tidak bisa
 * menampilkan seluruh provinsi.
 *
 * Dipisah dari komponen ke berkas util agar berkas komponen tetap hanya
 * mengekspor komponen (aturan `react-refresh/only-export-components`).
 */
export function deriveProvinsiOptions(rows: SkpListItem[]): SkpProvinsiOption[] {
  if (!Array.isArray(rows)) return [];

  const byId = new Map<string, SkpProvinsiOption>();
  for (const row of rows) {
    const id = row.provinsi_id?.trim();
    const name = row.provinsi?.trim();
    if (id && name && !byId.has(id)) {
      byId.set(id, { id, name });
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, 'id'));
}
