import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { ScanPage } from './pages/ScanPage';
import { HistoryPage } from './pages/HistoryPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { EnforcementDashboard } from './pages/EnforcementDashboard';
import { EvaluationPage } from './pages/EvaluationPage';
import { VideoBackground } from './components/ui/VideoBackground';
import { LabelGuardProvider } from './context/LabelGuardContext';

function App() {
  return (
    <LabelGuardProvider>
      <Router>
        <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
          <VideoBackground variant="aurora" />
          <Navbar />
          <main className="relative z-10">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/enforce" element={<EnforcementDashboard />} />
              <Route path="/evaluate" element={<EvaluationPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </LabelGuardProvider>
  );
}

export default App;
