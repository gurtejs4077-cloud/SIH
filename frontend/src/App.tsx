import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { DashboardPage } from './pages/DashboardPage';
import { RoutesPage } from './pages/RoutesPage';
import { RouteDetailPage } from './pages/RouteDetailPage';
import { PriceIndexPage } from './pages/PriceIndexPage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { DataCollectionPage } from './pages/DataCollectionPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { CPITransmissionPage } from './pages/CPITransmissionPage';
import { ForecastPage } from './pages/ForecastPage';
import { WarRoomPage } from './pages/WarRoomPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { WhatsAppDispatchModal } from './components/WhatsAppDispatchModal';

export const App: React.FC = () => {
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsWhatsAppOpen(true);
    window.addEventListener('open-whatsapp-modal', handleOpen);
    return () => window.removeEventListener('open-whatsapp-modal', handleOpen);
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen w-full flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
        <Navbar />
        <main className="flex-1 w-full">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/war-room" element={<WarRoomPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/forecast" element={<ForecastPage />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/routes/:routeCode" element={<RouteDetailPage />} />
            <Route path="/index" element={<PriceIndexPage />} />
            <Route path="/cpi-transmission" element={<CPITransmissionPage />} />
            <Route path="/sources" element={<DataSourcesPage />} />
            <Route path="/data-collection" element={<DataCollectionPage />} />
            <Route path="/methodology" element={<MethodologyPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
        <WhatsAppDispatchModal
          isOpen={isWhatsAppOpen}
          onClose={() => setIsWhatsAppOpen(false)}
        />
      </div>
    </BrowserRouter>
  );
};

export default App;
