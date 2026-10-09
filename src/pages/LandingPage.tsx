import { Navbar } from '../components/layout/Navbar';
import { HeroSection } from '../sections/HeroSection';
import { ServicesSection } from '../sections/ServicesSection';
import { Footer } from '../components/layout/Footer';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 1. Header / Top Navbar */}
      <Navbar />

      {/* 2. Konten Utama Landing Page */}
      <main className="flex-1">
        <HeroSection />
        <ServicesSection />
      </main>

      {/* 3. Footer */}
      <Footer />
    </div>
  );
};