import { useState } from 'react';

// Interface Data Layanan
interface ServiceItem {
  id: string;
  namaLayanan: string;
  nomorRegistrasi: string;
  tanggalPengajuan: string;
  kategori: string;
  status: 'Aktif' | 'Selesai' | 'Dalam Tinjauan' | 'Perlu Perbaikan';
}

export const LayananPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');

  // Sample Data Layanan
  const services: ServiceItem[] = [
    {
      id: 'SERV-001',
      namaLayanan: 'Sertifikasi Health Certificate (HC)',
      nomorRegistrasi: 'REG/HC/2026/0812',
      tanggalPengajuan: '15 Agustus 2026',
      kategori: 'Mutu & Keamanan',
      status: 'Dalam Tinjauan',
    },
    {
      id: 'SERV-002',
      namaLayanan: 'Izin Operasional Pengolahan Ikan',
      nomorRegistrasi: 'REG/IPI/2026/0541',
      tanggalPengajuan: '01 Agustus 2026',
      kategori: 'Perizinan',
      status: 'Aktif',
    },
    {
      id: 'SERV-003',
      namaLayanan: 'Pengujian Laboratorium Mikrobiologi',
      nomorRegistrasi: 'REG/LAB/2026/0902',
      tanggalPengajuan: '10 Juli 2026',
      kategori: 'Pengujian',
      status: 'Selesai',
    },
    {
      id: 'SERV-004',
      namaLayanan: 'Inspeksi Cara Budi Daya Ikan yang Baik (CBIB)',
      nomorRegistrasi: 'REG/CBIB/2026/0119',
      tanggalPengajuan: '05 Juni 2026',
      kategori: 'Inspeksi',
      status: 'Perlu Perbaikan',
    },
  ];

  // Logic Filtering
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.namaLayanan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.nomorRegistrasi.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === 'Semua' || service.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // Badge Status Styling
  const getStatusBadge = (status: ServiceItem['status']) => {
    switch (status) {
      case 'Aktif':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Selesai':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Dalam Tinjauan':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Perlu Perbaikan':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Button Ajukan Layanan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Layanan Saya</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola dan pantau seluruh status permohonan layanan BPPMHKP Anda.
          </p>
        </div>
        <button
          onClick={() => alert('Buka form pengajuan baru')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          + Ajukan Layanan Baru
        </button>
      </div>

      {/* Control Panel: Search & Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Cari layanan atau no. registrasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-auto flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            Status:
          </span>
          {['Semua', 'Aktif', 'Dalam Tinjauan', 'Perlu Perbaikan', 'Selesai'].map(
            (status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedStatus === status
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            )
          )}
        </div>
      </div>

      {/* Grid Card Daftar Layanan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServices.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-xl border border-slate-200">
            <p className="text-slate-500 font-medium">
              Tidak ada permohonan layanan yang sesuai kriteria.
            </p>
          </div>
        ) : (
          filteredServices.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header Card: Category & Status */}
                <div className="flex justify-between items-start gap-2 mb-3">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                    {item.kategori}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${getStatusBadge(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Title & Info */}
                <h3 className="font-bold text-slate-800 text-base mb-1">
                  {item.namaLayanan}
                </h3>
                <p className="text-xs font-mono text-slate-500 mb-4">
                  {item.nomorRegistrasi}
                </p>
              </div>

              {/* Footer Card: Date & Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Diajukan: {item.tanggalPengajuan}</span>
                <button
                  onClick={() => alert(`Detail untuk ${item.nomorRegistrasi}`)}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  Lihat Detail →
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};