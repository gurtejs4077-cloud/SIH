import React from 'react';
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

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 selection:bg-blue-600 selection:text-white">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
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
      </div>
    </BrowserRouter>
  );
};

export default App;
