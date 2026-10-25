import axios from 'axios';

const API_BASE = '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'API Request Failed';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

export const api = {
  getHealth: () => apiClient.get('/health'),
  getCities: () => apiClient.get('/cities'),
  getStations: (cityId) => apiClient.get('/stations', { params: { city_id: cityId } }),
  getDashboardSummary: (params) => apiClient.get('/dashboard/summary', { params }),
  getLatestReadings: (cityId) => apiClient.get('/air-quality/latest', { params: { city_id: cityId } }),
  getHistoricalTrends: (params) => apiClient.get('/air-quality/history', { params }),
  getCityComparisons: (params) => apiClient.get('/air-quality/comparison', { params }),
  getAQICategories: (params) => apiClient.get('/air-quality/categories', { params }),
  getCorrelations: (cityId) => apiClient.get('/air-quality/correlations', { params: { city_id: cityId } }),
  getHotspots: (params) => apiClient.get('/hotspots', { params }),
  getForecasts: (cityId = 'DEL', horizonDays = 7) => 
    apiClient.get('/forecasts', { params: { city_id: cityId, horizon_days: horizonDays } }),
  generateForecast: (cityId, horizonDays) =>
    apiClient.post('/forecasts/generate', { city_id: cityId, horizon_days: horizonDays }),
  getInsights: () => apiClient.get('/insights'),
  getModelMetrics: () => apiClient.get('/model/metrics'),
  getDataQuality: () => apiClient.get('/data-quality'),
  getExplorerData: (params) => apiClient.get('/data/explorer', { params }),
  getExportUrl: (params) => {
    const query = new URLSearchParams(params).toString();
    return `/api/data/export?${query}`;
  }
};

export default api;
