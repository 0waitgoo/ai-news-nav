import React, { useState, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import BentoGrid from './components/BentoGrid';
import DarkVeil from './components/DarkVeil';

const NewsPage = React.lazy(() => import('./components/pages/NewsPage'));
const NavPage = React.lazy(() => import('./components/pages/NavPage'));

export default function App() {
  const [bgImage, setBgImage] = useState('https://picsum.photos/seed/bg/2564/1920');
  const [currentPage, setCurrentPage] = useState('home');

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <BentoGrid onBgChange={setBgImage} onNavigate={handlePageChange} />;
      case 'news':
        return <NewsPage />;
      case 'nav':
        return <NavPage />;
      default:
        return <BentoGrid onBgChange={setBgImage} onNavigate={handlePageChange} />;
    }
  };

  return (
    <div className="relative min-h-screen w-full text-white bg-black">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 z-0 transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[8px]"></div>
        {/* DarkVeil Background */}
        <div className="absolute inset-0 z-1">
          <DarkVeil
            hueShift={0}
            noiseIntensity={0}
            scanlineIntensity={0}
            speed={1}
            scanlineFrequency={0}
            warpAmount={2}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen w-full p-3 sm:p-4 md:p-6 gap-4 sm:gap-6 max-w-[1600px] mx-auto">
        <Sidebar onPageChange={handlePageChange} currentPage={currentPage} />
        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto pb-20 sm:pb-6">
            <Suspense fallback={<div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            </div>}>
              {renderCurrentPage()}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
