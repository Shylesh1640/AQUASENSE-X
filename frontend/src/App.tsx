import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import Layout from './components/layout/Layout';
import Overview from './pages/Overview';
import LiveMonitoring from './pages/LiveMonitoring';
import SensorSimulator from './pages/SensorSimulator';
import WaterQuality from './pages/WaterQuality';
import { TreatmentControl } from './pages/TreatmentControl';
import { FilterIntelligence } from './pages/FilterIntelligence';
import { RORecovery } from './pages/RORecovery';
import { AlertsEvents } from './pages/AlertsEvents';
import { HistoricalAnalytics } from './pages/HistoricalAnalytics';
import { SystemSettings } from './pages/SystemSettings';
import About from './pages/About';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 2000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Overview />} />
            <Route path="/monitoring" element={<LiveMonitoring />} />
            <Route path="/simulator" element={<SensorSimulator />} />
            <Route path="/quality" element={<WaterQuality />} />
            <Route path="/treatment" element={<TreatmentControl />} />
            <Route path="/filters" element={<FilterIntelligence />} />
            <Route path="/recovery" element={<RORecovery />} />
            <Route path="/alerts" element={<AlertsEvents />} />
            <Route path="/analytics" element={<HistoricalAnalytics />} />
            <Route path="/settings" element={<SystemSettings />} />
            <Route path="/about" element={<About />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
