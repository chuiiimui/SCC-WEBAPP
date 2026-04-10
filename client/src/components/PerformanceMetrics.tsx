import React, { useState, useEffect } from 'react';
import { apiClient } from '../utils/apiClient';
import '../styles/PerformanceMetrics.css';

interface HealthStatus {
  status: string;
  indexStatus: Record<string, number>;
  cacheSize: number;
  uptime: number;
  timestamp: string;
}

const PerformanceMetrics: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await apiClient.health();
        setHealth({
          status: response.status,
          indexStatus: response.indexStatus,
          cacheSize: response.cacheSize,
          uptime: response.uptime,
          timestamp: response.timestamp,
        });
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();

    // Refresh every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="performance-metrics loading">Checking backend...</div>;
  }

  if (error) {
    return <div className="performance-metrics error">⚠️ Backend offline</div>;
  }

  if (!health) {
    return null;
  }

  const totalIndexed = Object.values(health.indexStatus).reduce((a, b) => a + b, 0);

  if (compact) {
    return (
      <div className="performance-metrics compact">
        <span className="status-dot healthy"></span>
        <span className="status-text">
          {totalIndexed.toLocaleString()} cases • {health.cacheSize} cached
        </span>
      </div>
    );
  }

  return (
    <div className="performance-metrics full">
      <div className="metrics-header">
        <h3>Backend Status</h3>
        <span className={`status-indicator ${health.status}`}>
          {health.status === 'healthy' ? '✓' : '!'}
        </span>
      </div>

      <div className="metrics-content">
        <div className="metric-item">
          <label>Total Cases Indexed</label>
          <span className="metric-value">{totalIndexed.toLocaleString()}</span>
        </div>

        <div className="metric-item">
          <label>Countries</label>
          <div className="countries-list">
            {Object.entries(health.indexStatus).map(([country, count]) => (
              <div key={country} className={`country-badge ${count > 0 ? 'active' : 'pending'}`}>
                <span className="country-name">{country}</span>
                <span className="country-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="metric-item">
          <label>Query Cache</label>
          <span className="metric-value">{health.cacheSize} queries</span>
        </div>

        <div className="metric-item">
          <label>Uptime</label>
          <span className="metric-value">{Math.round(health.uptime)}s</span>
        </div>

        <div className="metric-item">
          <label>Last Check</label>
          <span className="metric-value">
            {new Date(health.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
