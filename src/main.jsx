import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './hooks/useSheetData.jsx';
import AppLayout from './layout/AppLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CustomersPage from './pages/CustomersPage.jsx';
import MarketersPage from './pages/MarketersPage.jsx';
import CampaignsPage from './pages/CampaignsPage.jsx';
import CreativeInsightsPage from './pages/CreativeInsightsPage.jsx';
import CommissionsPage from './pages/CommissionsPage.jsx';
import ActivityPage from './pages/ActivityPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import BusinessHealthPage from './pages/BusinessHealthPage.jsx';
import TaxPage from './pages/TaxPage.jsx';
import SalesPage from './pages/SalesPage.jsx';
import AdAssistantPage from './pages/AdAssistantPage.jsx';
import MarketerAssistantPage from './pages/MarketerAssistantPage.jsx';
import PayrollPage from './pages/PayrollPage.jsx';
import CursorTrail from './components/CursorTrail.jsx';
import { ToastProvider } from './components/Toast.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <DataProvider>
        <CursorTrail />
        <ToastProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="marketers" element={<MarketersPage />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="creative" element={<CreativeInsightsPage />} />
            <Route path="founder-assistant" element={<AdAssistantPage />} />
            <Route path="marketer-assistant" element={<MarketerAssistantPage />} />
            <Route path="ledger" element={<CommissionsPage />} />
            <Route path="payroll" element={<PayrollPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="health" element={<BusinessHealthPage />} />
            <Route path="tax" element={<TaxPage />} />
            <Route path="sales" element={<SalesPage />} />
          </Route>
        </Routes>
        </ToastProvider>
      </DataProvider>
    </BrowserRouter>
  </React.StrictMode>
);
