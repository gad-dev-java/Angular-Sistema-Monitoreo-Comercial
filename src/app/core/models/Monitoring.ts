export interface MonitoringKpiResponse {
  performanceCompliance: number;
  timeElapsedPercentage: number;
}

export interface StoreKpi {
  storeId: number;
  label: string;
  pc: number;
  pt: number;
  status: 'ok' | 'warning' | 'critical';
}










