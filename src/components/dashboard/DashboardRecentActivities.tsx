import type {
  DashboardActivityStatus,
  DashboardRecentActivity,
} from '../../types/dashboard';

export interface DashboardRecentActivitiesProps {
  items: DashboardRecentActivity[] | null;
  isLoading: boolean;
}

const KOLOM = ['Modul', 'Layanan', 'Pemohon', 'UPT', 'Tanggal', 'Status'];

/**
 * Warna badge status.
 *
 * Backend mengirim status sebagai teks bebas, jadi pencocokan dilakukan
 * lowered-case dan berdasarkan kata kunci. Nilai yang tidak dikenali tetap
 * ditampilkan abu-abu — lebih baik terlihat tanpa warna daripada disembunyikan.
 */
function badgeStatus(status: DashboardActivityStatus): string {
  const value = status.toLowerCase();
  if (value.includes('setuju') || value.includes('approve') || value.includes('selesai')) {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  }
  if (value.includes('tolak') || value.includes('reject') || value.includes('batal')) {
    return 'bg-rose-50 text-rose-700 ring-rose-200';
  }
  if (value.includes('proses') || value.includes('pending') || value.includes('tunggu')) {
    return 'bg-amber-50 text-amber-700 ring-amber-200';
  }
  return 'bg-slate-50 text-slate-600 ring-slate-200';
}

/** `Disetujui_` / `disetujui` -> `Disetujui`. */
function formatStatus(status: DashboardActivityStatus): string {
  const text = status.trim();
  if (text === '') return '-';
  return text.replace(/[_-]+/g, ' ');
}

function RowSkeleton() {
  return (
    <tr className="animate-pulse" aria-hidden="true">
      {Array.from({ length: KOLOM.length }).map((_, index) => (
        <td key={index} className="border-b border-slate-100 px-4 py-3">
          <div className="h-3 w-full rounded bg-slate-200" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Feed aktivitas terbaru lintas modul.
 *
 * Kolom dibuat horizontal-scrollable; di layar sempit tabel digeser, bukan
 * dipotong.
 */
export default function DashboardRecentActivities({
  items,
  isLoading,
}: DashboardRecentActivitiesProps) {
  const rows = Array.isArray(items) ? items : [];

  return (
    <section
      aria-label="Aktivitas terbaru"
      className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Aktivitas Pengajuan Terbaru</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Feed lintas modul untuk periode dan cakupan UPT yang dipilih
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <caption className="sr-only">
            Daftar aktivitas pengajuan terbaru lintas modul pada portal BPPMHKP
          </caption>
          <thead className="bg-slate-50">
            <tr>
              {KOLOM.map((kolom) => (
                <th
                  key={kolom}
                  scope="col"
                  className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  {kolom}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => <RowSkeleton key={index} />)
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={KOLOM.length} className="px-4 py-12 text-center text-sm text-slate-400">
                  Belum ada aktivitas pengajuan untuk filter yang dipilih.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="transition hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {row.module}
                    </span>
                  </td>
                  <td className="max-w-[220px] break-words px-4 py-2.5 font-medium text-slate-800">
                    {row.serviceName}
                  </td>
                  <td className="max-w-[200px] break-words px-4 py-2.5 text-slate-700">
                    {row.applicant}
                  </td>
                  <td className="max-w-[180px] break-words px-4 py-2.5 text-slate-600">
                    {row.upt}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-slate-600">
                    {row.date}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${badgeStatus(
                        row.status
                      )}`}
                    >
                      {formatStatus(row.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}