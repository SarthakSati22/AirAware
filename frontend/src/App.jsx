import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import PollutionMapPage from './pages/PollutionMapPage';
import PredictionPage from './pages/PredictionPage';
import InsightsPage from './pages/InsightsPage';
import ModelEvaluationPage from './pages/ModelEvaluationPage';
import DataExplorerPage from './pages/DataExplorerPage';
import AboutPage from './pages/AboutPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="map" element={<PollutionMapPage />} />
          <Route path="prediction" element={<PredictionPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="evaluation" element={<ModelEvaluationPage />} />
          <Route path="explorer" element={<DataExplorerPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
