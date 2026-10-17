/** Penolakan scope 403 mempertahankan sesi; penolakan JWT mengakhiri sesi. */
export function isAuthenticationFailure(status: number | undefined, data: unknown): boolean {
  if (status === 401) return true;
  if (status !== 403 || typeof data !== 'object' || data === null) return false;
  const body = data as { status?: unknown; message?: unknown };
  return body.status === 'error' && body.message === 'Token tidak valid atau kedaluwarsa';
}

/** Galat unduhan dapat diterima sebagai Blob JSON. */
export async function decodeErrorBody(data: unknown): Promise<unknown> {
  if (!(data instanceof Blob)) return data;
  try { return JSON.parse(await data.text()) as unknown; } catch { return data; }
}
