import { ServiceCard } from '../components/common/ServiceCard';
import { servicesData } from '../data/servicesData';

export const ServicesSection = () => {
  return (
    <section 
      id="layanan" 
      className="bg-slate-50 dark:bg-slate-900/50 py-16 px-4 transition-colors duration-300"
    >
      <div className="max-w-6xl mx-auto w-full">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white transition-colors">
            Layanan Unggulan
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2 transition-colors">
            Kemudahan akses informasi dan sertifikasi dalam satu pintu
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {servicesData.map((service) => (
            <ServiceCard key={service.id} item={service} />
          ))}
        </div>
      </div>
    </section>
  );
};