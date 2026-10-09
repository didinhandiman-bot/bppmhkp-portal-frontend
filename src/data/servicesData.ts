export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  description: string;
  colorScheme: 'blue' | 'emerald' | 'amber';
}

export const servicesData: ServiceItem[] = [
  {
    id: '1',
    number: '01',
    title: 'Sertifikasi Mutu',
    description: 'Pengajuan dan verifikasi dokumen sertifikat mutu hasil perikanan secara digital dan cepat.',
    colorScheme: 'blue',
  },
  {
    id: '2',
    number: '02',
    title: 'Pengujian Laboratorium',
    description: 'Layanan uji mutu organoleptik, mikrobiologi, dan kimia dengan standar terakreditasi.',
    colorScheme: 'emerald',
  },
  {
    id: '3',
    number: '03',
    title: 'Konsultasi & Informasi',
    description: 'Pusat bantuan dan regulasi terkini terkait standar ekspor dan domestik hasil perikanan.',
    colorScheme: 'amber',
  },
];