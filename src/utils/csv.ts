/**
 * Telemetry CSV Exporter for QuantumLab Experiments
 */
import { TelemetryDataPoint, TelemetryKey } from '../types/physics';

export function exportTelemetryToCSV(
  experimentName: string,
  keys: TelemetryKey[],
  data: TelemetryDataPoint[]
): void {
  if (data.length === 0) return;

  const headerRow = ['Time (s)', ...keys.map((k) => `${k.label} (${k.unit})`)].join(',');

  const rows = data.map((point) => {
    const timeVal = point.time.toFixed(3);
    const metrics = keys.map((k) => {
      const val = point[k.key];
      return typeof val === 'number' && !isNaN(val) ? val.toFixed(4) : '0.0000';
    });
    return [timeVal, ...metrics].join(',');
  });

  const csvContent = [headerRow, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const sanitizedName = experimentName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  link.setAttribute('href', url);
  link.setAttribute('download', `${sanitizedName}_telemetry_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
