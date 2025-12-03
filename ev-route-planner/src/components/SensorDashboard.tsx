import React from 'react';
import { useLatestSensorData } from '../hooks/useLatestSensorData';

export function SensorDashboard() {
  const { data, error, loading } = useLatestSensorData();

  return (
    <section className="card sensor-dashboard">
      <h2 style={{ marginTop: 0 }}>Sensor Telemetry</h2>
      {loading && <div className="loading">Loading sensor data…</div>}
      {error && <div className="error">Error: {error}</div>}
      {!loading && !error && !data && (
        <div className="loading">No data yet. Waiting for the device to post…</div>
      )}
      {data && (
        <div className="grid" style={{ marginTop: 12 }}>
          <div className="metric">
            <div className="label">Voltage</div>
            <div className="value">{data.voltage.toFixed(2)} V</div>
          </div>
          <div className="metric">
            <div className="label">Current</div>
            <div className="value">{data.current.toFixed(2)} A</div>
          </div>
          <div className="metric">
            <div className="label">Temperature</div>
            <div className="value">{data.temperature.toFixed(2)} °C</div>
          </div>
          <div className="metric">
            <div className="label">Latitude</div>
            <div className="value">{data.latitude.toFixed(6)}</div>
          </div>
          <div className="metric">
            <div className="label">Longitude</div>
            <div className="value">{data.longitude.toFixed(6)}</div>
          </div>
        </div>
      )}
    </section>
  );
}
