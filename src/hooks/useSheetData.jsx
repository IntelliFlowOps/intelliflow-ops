import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { fetchAllTabs, fetchTabs } from '../services/sheetsService.js';
import { STALE_THRESHOLD_MS, AUTO_REFRESH_INTERVAL_MS } from '../config/sheets.js';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [data, setData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const prevDataRef = useRef(null);
  const hasLoadedOnce = useRef(false);
  const autoRefreshRef = useRef(null);
  const accessedTabsRef = useRef(new Set());

  function trackTab(tabKey) {
    accessedTabsRef.current.add(tabKey);
  }

  const applyResults = useCallback((results) => {
    const tabErrors = {};
    let hasAnyData = false;

    Object.keys(results).forEach((key) => {
      if (key === '_timestamp') return;
      if (results[key].error) tabErrors[key] = results[key].error;
      if (results[key].data && (Array.isArray(results[key].data) ? results[key].data.length > 0 : true)) hasAnyData = true;
    });

    if (hasAnyData) {
      const newData = {};
      // Merge with previous data so tabs not in this fetch are preserved
      if (prevDataRef.current) {
        Object.keys(prevDataRef.current).forEach((key) => {
          newData[key] = prevDataRef.current[key];
        });
      }
      Object.keys(results).forEach((key) => {
        if (key === '_timestamp') return;
        newData[key] = results[key].data;
      });
      setData(newData);
      prevDataRef.current = newData;
    } else if (prevDataRef.current) {
      setData(prevDataRef.current);
    }

    setErrors(tabErrors);
    setLastUpdated(results._timestamp);
  }, []);

  const refresh = useCallback(async () => {
    if (hasLoadedOnce.current) {
      setRefreshing(true);
    } else {
      setInitialLoading(true);
    }

    try {
      const results = await fetchAllTabs();
      applyResults(results);
    } catch (err) {
      console.error('Failed to refresh data:', err);
      if (prevDataRef.current) setData(prevDataRef.current);
      setErrors({ _global: err.message });
    } finally {
      hasLoadedOnce.current = true;
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [applyResults]);

  const refreshActiveTabs = useCallback(async () => {
    const activeTabs = Array.from(accessedTabsRef.current);
    if (activeTabs.length === 0) return;

    setRefreshing(true);
    try {
      const results = await fetchTabs(activeTabs);
      applyResults(results);
    } catch (err) {
      console.error('Failed to refresh active tabs:', err);
      if (prevDataRef.current) setData(prevDataRef.current);
      setErrors({ _global: err.message });
    } finally {
      setRefreshing(false);
    }
  }, [applyResults]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!AUTO_REFRESH_INTERVAL_MS || AUTO_REFRESH_INTERVAL_MS <= 0) return;
    autoRefreshRef.current = setInterval(() => { refreshActiveTabs(); }, AUTO_REFRESH_INTERVAL_MS);
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, [refreshActiveTabs]);

  const isStale = lastUpdated ? Date.now() - lastUpdated > STALE_THRESHOLD_MS : false;
  const loading = initialLoading || refreshing;

  return (
    <DataContext.Provider value={{ data, loading, initialLoading, refreshing, errors, lastUpdated, isStale, refresh, trackTab }}>
      {children}
    </DataContext.Provider>
  );
}

export function useSheetData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useSheetData must be used inside <DataProvider>');
  return ctx;
}

export function useTabData(tabKey) {
  const { data, loading, initialLoading, refreshing, errors, trackTab } = useSheetData();
  useEffect(() => { trackTab(tabKey); }, [tabKey, trackTab]);
  return {
    rows: data?.[tabKey] ?? [],
    loading,
    initialLoading,
    refreshing,
    error: errors?.[tabKey] ?? null,
  };
}
