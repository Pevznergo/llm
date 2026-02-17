import Header from '../components/Header';
import Hero from '../components/Hero';
import UpdatesSection from '../components/UpdatesSection';
import ModelsGrid from '../components/ModelsGrid'; // New component
import FeaturesSection from '../components/FeaturesSection';
import Footer from '../components/Footer';

import { Suspense } from 'react';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F2F2F7] relative">
      <Header />
      <Suspense fallback={null}>
        <Hero />
      </Suspense>
      <UpdatesSection /> {/* Recent Blog Posts */}
      <ModelsGrid />
      <FeaturesSection />
      <Footer />
    </main>
  );
}