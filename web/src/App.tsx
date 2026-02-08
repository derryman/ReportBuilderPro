import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import TemplateCreatorPage from './pages/TemplateCreatorPage';
import TemplateLibraryPage from './pages/TemplateLibraryPage';
import MobileCapturePage from './pages/MobileCapturePage';
import ReportsPage from './pages/ReportsPage';
import EditReportPage from './pages/EditReportPage';
import { useMobile } from './utils/useMobile';

// Wrapper component that redirects mobile users away from Template Creator
function TemplateCreatorWrapper() {
  const isMobile = useMobile();
  
  // Redirect mobile users to mobile capture page
  if (isMobile) {
    return <Navigate to="/mobile-capture" replace />;
  }
  
  return <TemplateCreatorPage />;
}

// Main App component - sets up all the routes (pages) for the application
export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Login page - no sidebar */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* All other pages use MainLayout (which includes the sidebar) */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="template-creator" element={<TemplateCreatorWrapper />} />
          <Route path="template-creator/:id" element={<TemplateCreatorWrapper />} />
          <Route path="template-library" element={<TemplateLibraryPage />} />
          <Route path="mobile-capture" element={<MobileCapturePage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/:id/edit" element={<EditReportPage />} />
        </Route>
        
        {/* If user goes to a page that doesn't exist, redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

