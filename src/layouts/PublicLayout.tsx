import { Outlet } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Header />
      <main className="flex-grow">
        <Outlet /> {/* Halaman Landing Page akan muncul di sini */}
      </main>
      <Footer />
    </div>
  );
};