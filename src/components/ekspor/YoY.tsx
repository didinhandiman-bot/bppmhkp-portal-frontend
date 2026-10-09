interface YoYProps {
  /** Nilai pertumbuhan Year-over-Year dalam persen. */
  value: number;
  /** Kelas tambahan untuk mengatur penempatan/layout. */
  className?: string;
}

/**
 * Label pertumbuhan Year-over-Year (YoY) dengan pewarnaan:
 * positif hijau (awalan "+"), negatif merah, nol abu-abu.
 */
export default function YoY({ value, className = '' }: YoYProps) {
  const parsed = Number(value);
  const normalized = Number.isFinite(parsed) ? parsed : 0;
  const tone =
    normalized > 0
      ? 'text-emerald-600'
      : normalized < 0
        ? 'text-rose-600'
        : 'text-slate-500';
  const sign = normalized > 0 ? '+' : '';

  return (
    <span
      className={`font-semibold tabular-nums ${tone} ${className}`}
      title="Year-over-Year"
    >
      {sign}
      {normalized}%
    </span>
  );
}
