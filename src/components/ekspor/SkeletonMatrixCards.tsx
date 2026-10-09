/** Placeholder shimmer saat data kartu matriks masih dimuat. */
export default function SkeletonMatrixCards() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5"
      aria-hidden="true"
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div className="h-11 bg-blue-600" />
          <div className="space-y-3 p-4">
            <div className="h-2 w-1/3 rounded bg-slate-100" />
            <div className="h-6 w-1/2 rounded bg-slate-100" />
            <div className="h-2 w-2/3 rounded bg-slate-100" />
            {[0, 1, 2, 3].map((bar) => (
              <div key={bar} className="h-2 w-full rounded bg-slate-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
