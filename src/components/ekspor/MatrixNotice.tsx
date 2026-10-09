import { Search, TriangleAlert } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

/** Tampilan galat matriks dengan tombol "Coba Lagi". */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-12 text-center"
      role="alert"
    >
      <TriangleAlert className="h-8 w-8 text-rose-500" aria-hidden="true" />
      <p className="max-w-md text-sm text-slate-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        Coba Lagi
      </button>
    </div>
  );
}

/** Tampilan data kosong untuk halaman matriks. */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
      <Search className="h-8 w-8 text-slate-300" aria-hidden="true" />
      <p className="max-w-md text-sm text-slate-500">{message}</p>
    </div>
  );
}
