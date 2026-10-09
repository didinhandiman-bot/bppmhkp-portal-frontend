/**
 * Sumber kebenaran tunggal untuk navigasi sidebar.
 *
 * Sidebar, penanda rute aktif, dan halaman `ComingSoon` semuanya membaca dari
 * berkas ini, sehingga menambah modul baru cukup mengedit satu tempat — tidak
 * ada daftar rute yang disalin di komponen maupun di `App.tsx`.
 */

export type NavStatus = 'active' | 'coming-soon';

/** Item yang bisa diklik langsung. */
export interface NavLeaf {
  label: string;
  path: string;
  status: NavStatus;
  /** Kalimat singkat yang menjelaskan modulnya; dipakai `ComingSoon`. */
  description?: string;
}

/**
 * Grup dengan sub-menu (accordion). Grup sendiri tidak punya `path` — rute
 * selalu milik leaf di dalamnya, agar tidak ada URL yatim untuk grup.
 */
export interface NavGroup {
  label: string;
  children: NavLeaf[];
}

export type NavEntry = NavLeaf | NavGroup;

/** Penegas tipe untuk membedakan grup dari leaf. */
export const isNavGroup = (entry: NavEntry): entry is NavGroup =>
  'children' in entry;

/** Navigasi akun (aktif, sudah diimplementasikan). */
export const ACCOUNT_NAVIGATION: NavLeaf[] = [
  {
    label: 'DASHBOARD',
    path: '/dashboard',
    status: 'active',
    description: 'Ringkasan aktivitas dan akses cepat Anda.',
  },
  // {
  //   label: 'Layanan Saya',
  //   path: '/layanan',
  //   status: 'active',
  //   description: 'Daftar layanan yang pernah Anda ajukan.',
  // },
  // {
  //   label: 'Profil Saya',
  //   path: '/profil',
  //   status: 'active',
  //   description: 'Kelola data akun dan informasi Anda.',
  // },
];

/** Modul operasional, dikelompokkan mengikuti alur bisnis. */
export const MODULE_NAVIGATION: NavEntry[] = [
  {
    label: 'EKSPOR',
    path: '/ekspor',
    status: 'active',
    description: 'Pengelolaan data ekspor yang Anda Ajukan.',
  },
  {
    label: 'PASCA PANEN',
    children: [
      {
        label: 'SMKHP',
        path: '/pascapanen/smkhp',
        status: 'active',
        description: 'Sistem Monitoring dan Kendali Harga Pascapanen.',
      },
      {
        /*
         * Path memakai `pascapanen` (dengan huruf 'n') agar seragam dengan
         * SMKHP, HACCP, dan SPDI di grup ini. Sebelumnya module ini memakai
         * `pascapane`, yang tidak pernah menjadi rute aktif karena halamannya
         * masih placeholder.
         */
        label: 'SKP',
        path: '/pascapanen/skp',
        status: 'active',
        description: 'Standar Kompetensi Producer.',
      },
      {
        label: 'HACCP',
        path: '/pascapanen/haccp',
        status: 'active',
        description: 'Hazard Analysis and Critical Control Point.',
      },
      {
        label: 'SPDI',
        path: '/pascapanen/spdi',
        status: 'coming-soon',
        description: 'Sistem pengawasan proses di tingkat industri.',
      },
    ],
  },
  {
    label: 'PRIMER',
    children: [
      {
        label: 'CPIB',
        path: '/primer/cpib',
        status: 'active',
        description: 'Standar cara produksi dan inspeksi.',
      },
      {
        label: 'CBIB',
        path: '/primer/cbib',
        status: 'active',
        description: 'Cara Budidaya Ikan yang Baik.',
      },
      {
        label: 'CPPIB',
        path: '/primer/cppib',
        status: 'active',
        description: 'Standar pengemasan dan pelestarian produk.',
      },
      {
        label: 'CPOIB',
        path: '/primer/cpoib',
        status: 'active',
        description: 'Standar proses pengolahan dan pengawinan produk.',
      },
      {
        label: 'CPIB Kapal',
        path: '/primer/cbib-kapal',
        status: 'active',
        description: 'Cara Budidaya Ikan yang Baik di kapal.',
      },
      {
        label: 'CDOIB',
        path: '/primer/cdoib',
        status: 'active',
        description: 'Standar pengujian dan pelaporan.',
      },
    ],
  },
  {
    label: 'PNBP',
    path: '/pnbp',
    status: 'coming-soon',
    description: 'Penerimaan Negara Bukan Pajak.',
  },
];

/** Seluruh leaf dari `MODULE_NAVIGATION`, sudah diratakan. */
export const collectModuleLeaves = (
  entries: NavEntry[] = MODULE_NAVIGATION
): NavLeaf[] =>
  entries.flatMap((entry) => (isNavGroup(entry) ? entry.children : [entry]));

/** Cari leaf berdasarkan path persis. */
export const findLeafByPath = (
  pathname: string,
  entries: NavEntry[] = MODULE_NAVIGATION
): NavLeaf | undefined =>
  collectModuleLeaves(entries).find((leaf) => leaf.path === pathname);

/**
 * Apakah `path` sedang dikunjungi?
 *
 * Cocok persis ATAU sebagai segmen-awal (`/layanan/123` menyalakan
 * `/layanan`). Batasanya memakai garis miring agar `/layanan` tidak ikut
 * menyala saat pengguna berada di `/layanan-detail`.
 */
export const isNavPathActive = (path: string, pathname: string): boolean =>
  pathname === path || pathname.startsWith(`${path}/`);
