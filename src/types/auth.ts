import type { AuthUser, AuthTokenPayload } from './api';

/**
 * Kebijakan role untuk akses aplikasi.
 *
 * Cerminkan `ROLES_IZIN` di backend (`authService.js`):
 *   1 = Administrator, 2 = Admin UPT (Executive).
 *
 * Backend sudah menolak role lain saat login dengan 403, jadi daftar di sini
 * bersifat defense-in-depth: ia menutup jalur lain yang tetap punya token valid,
 * mis. token lama yang dibuat sebelum gate ditambahkan, atau storage yang
 * ditulis manual.
 */
export const ALLOWED_ROLES = [1, 2] as const;

export type AllowedRole = (typeof ALLOWED_ROLES)[number];

/** Nama role untuk ditampilkan di pesan penolakan. */
export const ROLE_LABELS: Record<AllowedRole, string> = {
  1: 'Administrator',
  2: 'Admin UPT (Executive)',
};

/** Teks yang diminta untuk ditampilkan saat akses ditolak. */
export const ACCESS_DENIED_MESSAGE =
  'Akses ditolak: Hanya role 1 dan 2 yang diizinkan masuk.';

/**
 * Baca role user secara tahan banting.
 *
 * Backend mengirim `roleId` (camelCase) sekaligus alias `role_id` (snake_case)
 * pada response login dan payload JWT. Keduanya dibaca supaya tetap benar bila
 * salah satu hilang — mis. user lama yang masih tersimpan sebelum alias
 * ditambahkan. `Number(...)` dipakai karena `ROLE` di database bisa tersimpan
 * sebagai string.
 */
export const readRoleId = (
  user: AuthUser | AuthTokenPayload | null | undefined
): number | null => {
  if (!user) return null;

  const raw =
    (user as { roleId?: unknown }).roleId ?? (user as { role_id?: unknown }).role_id;

  if (raw === null || raw === undefined || raw === '') return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

/** True bila user punya role yang memang diizinkan masuk. */
export const hasAllowedRole = (
  user: AuthUser | AuthTokenPayload | null | undefined
): boolean => {
  const roleId = readRoleId(user);
  return roleId !== null && (ALLOWED_ROLES as readonly number[]).includes(roleId);
};

/** Deskripsi singkat role, untuk pesan error. */
export const describeRoles = (): string =>
  ALLOWED_ROLES.map((role) => `${role} (${ROLE_LABELS[role]})`).join(' dan ');
