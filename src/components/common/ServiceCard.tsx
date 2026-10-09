import React from 'react';
import type { ServiceItem } from '../../data/servicesData';

interface ServiceCardProps {
  item: ServiceItem;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ item }) => {
  // Map warna dengan dukungan Dark Mode untuk badge nomor
  const colorMap = {
    blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300',
    amber: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300',
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs hover:shadow-md transition-all">
      {/* Badge Nomor */}
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl mb-4 transition-colors ${colorMap[item.colorScheme]}`}>
        {item.number}
      </div>

      {/* Judul Layanan */}
      <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white transition-colors">
        {item.title}
      </h3>

      {/* Deskripsi Layanan */}
      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed transition-colors">
        {item.description}
      </p>
    </div>
  );
};