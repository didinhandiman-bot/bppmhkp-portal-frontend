import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ACCOUNT_NAVIGATION,
  MODULE_NAVIGATION,
  isNavGroup,
  isNavPathActive,
  type NavEntry,
  type NavGroup,
  type NavLeaf,
} from '../../config/navigation';
import { useAuth } from '../../hooks/useAuth';

const CHEVRON_CLASS =
  'w-4 h-4 shrink-0 transition-transform duration-200';

const Badge: React.FC = () => (
  <span className="ml-auto rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300 whitespace-nowrap">
    Segera
  </span>
);

interface SidebarProps {
  /** Dipanggil setiap kali item diklik, untuk menutup drawer di tampilan mobile. */
  onNavigate: () => void;
}

/**
 * Sidebar dashboard dengan sub-menu accordion.
 *
 * Seluruh isi menu berasal dari `config/navigation.ts`, jadi komponen ini tidak
 * perlu diubah saat modul baru ditambah.
 *
 * Item `coming-soon` sengaja tetap bisa diklik dan mengarah ke halaman
 * `ComingSoon`, bukan dinonaktifkan: begini pengguna tetap mendapat penjelasan
 * why modul belum tersedia, dan URL-nya tidak jatuh ke route 404.
 */
export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const groupHasActiveChild = (group: NavGroup): boolean =>
    group.children.some((child) => isNavPathActive(child.path, pathname));

  // Grup yang sedang memuat rute aktif dibuka otomatis, jadi pengguna tidak
  // perlu klik untuk melihat halaman yang sedang dia lihat.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      MODULE_NAVIGATION.filter(isNavGroup).map((group) => [
        group.label,
        groupHasActiveChild(group),
      ])
    )
  );

  /*
   * Penyesuaian saat render, bukan di dalam `useEffect`.
   *
   * Tujuannya sama dengan memakai effect (grup ikut terbuka saat pengguna
   * berpindah ke sub-menu grup yang tadinya tertutup), tetapi memanggil
   * `setState` langsung di body effect memicu render berlapis. Pola yang
   * disarankan React adalah menyesuaikan state ketika props berubah: bandingkan
   * `pathname` sebelumnya, dan hanya set state bila memang berubah.
   */
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);

    const activeGroup = MODULE_NAVIGATION.filter(isNavGroup).find(
      groupHasActiveChild
    );

    if (activeGroup) {
      setOpenGroups((prev) =>
        prev[activeGroup.label] ? prev : { ...prev, [activeGroup.label]: true }
      );
    }
  }

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const leafClasses = (isActive: boolean, isSoon: boolean) =>
    [
      'flex items-center gap-2 rounded-lg py-2 pl-3 pr-2 text-sm transition-colors',
      isActive
        ? 'bg-blue-600 text-white font-semibold shadow-sm'
        : isSoon
          ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white',
    ].join(' ');

  const renderLeaf = (leaf: NavLeaf, indent = false) => {
    const isActive = isNavPathActive(leaf.path, pathname);
    const isSoon = leaf.status === 'coming-soon';

    return (
      <Link
        key={leaf.path}
        to={leaf.path}
        onClick={onNavigate}
        aria-current={isActive ? 'page' : undefined}
        className={`${leafClasses(isActive, isSoon)} ${indent ? 'pl-4' : 'px-3'}`}
      >
        <span className="truncate">{leaf.label}</span>
        {isSoon && <Badge />}
      </Link>
    );
  };

  const renderEntry = (entry: NavEntry) => {
    if (!isNavGroup(entry)) return renderLeaf(entry);

    const isOpen = openGroups[entry.label] ?? false;

    return (
      <div key={entry.label}>
        <button
          type="button"
          onClick={() => toggleGroup(entry.label)}
          aria-expanded={isOpen}
          aria-controls={`nav-group-${entry.label}`}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold uppercase tracking-wide text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200 cursor-pointer"
        >
          <span className="truncate">{entry.label}</span>
          <svg
            className={`${CHEVRON_CLASS} ml-auto ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div
            id={`nav-group-${entry.label}`}
            className="mt-1 space-y-0.5 border-l border-slate-700 pl-2"
          >
            {entry.children.map((child) => renderLeaf(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 space-y-6 overflow-y-auto">
        <div className="space-y-0.5">
          {ACCOUNT_NAVIGATION.map((leaf) => renderLeaf(leaf))}
        </div>

        <div className="space-y-0.5">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Modul
          </p>
          {MODULE_NAVIGATION.map(renderEntry)}
        </div>
      </nav>

      <div className="mt-4 border-t border-slate-800 pt-4">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {user?.nama ? user.nama.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {user?.nama || 'Pengguna'}
            </p>
            <p className="truncate text-xs text-slate-400">
              {user?.roleName || user?.username || 'username'}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Keluar"
            aria-label="Keluar"
            className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-300 cursor-pointer"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
