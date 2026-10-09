export const Header = () => {
  return (
    <header className="bg-white shadow-xs border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-lg">
            BPPMHKP
          </div>
          <span className="font-semibold text-slate-700 hidden sm:inline">
            Official Portal
          </span>
        </div>
        <nav className="flex gap-6 text-sm font-medium text-slate-600">
          <a href="#beranda" className="hover:text-blue-600 transition-colors">Beranda</a>
          <a href="#layanan" className="hover:text-blue-600 transition-colors">Layanan</a>
          <a href="#tentang" className="hover:text-blue-600 transition-colors">Tentang</a>
          <a href="#kontak" className="hover:text-blue-600 transition-colors">Kontak</a>
        </nav>
      </div>
    </header>
  );
};