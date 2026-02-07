import promClient from 'prom-client';

// Enable default metrics (CPU, memory, etc.)
const collectDefaultMetrics = promClient.collectDefaultMetrics;

// Default metrics collection
collectDefaultMetrics({
  prefix: 'kvm_ui_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// Custom metrics

// HTTP Request duration histogram
export const httpRequestDuration = new promClient.Histogram({
  name: 'kvm_ui_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
});

// HTTP Request counter
export const httpRequestsTotal = new promClient.Counter({
  name: 'kvm_ui_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
});

// VM Operations duration histogram
export const vmOperationDuration = new promClient.Histogram({
  name: 'kvm_ui_vm_operation_duration_seconds',
  help: 'Duration of VM operations in seconds',
  labelNames: ['operation', 'vm_name', 'status'] as const,
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
});

// VM Operations counter
export const vmOperationsTotal = new promClient.Counter({
  name: 'kvm_ui_vm_operations_total',
  help: 'Total number of VM operations',
  labelNames: ['operation', 'status'] as const,
});

// Active WebSocket connections gauge
export const websocketConnections = new promClient.Gauge({
  name: 'kvm_ui_websocket_connections_active',
  help: 'Number of active WebSocket connections',
});

// Database connection pool gauge
export const dbPoolConnections = new promClient.Gauge({
  name: 'kvm_ui_db_pool_connections',
  help: 'Number of database connections in pool',
  labelNames: ['state'] as const, // idle, total, waiting
});

// Active VMs gauge
export const activeVMs = new promClient.Gauge({
  name: 'kvm_ui_vms_active',
  help: 'Number of active VMs',
  labelNames: ['status'] as const,
});

// Export registry for use in routes
export const register = promClient.register;

// Utility function to update DB pool metrics
export function updateDBPoolMetrics(pool: any) {
  if (pool && pool.totalCount !== undefined) {
    dbPoolConnections.set({ state: 'total' }, Number(pool.totalCount));
    dbPoolConnections.set({ state: 'idle' }, Number(pool.idleCount));
    dbPoolConnections.set({ state: 'waiting' }, Number(pool.waitingCount));
  }
}

// Utility function to update active VMs metrics
export function updateActiveVMsMetrics(vms: any[]) {
  // Reset all status gauges first
  activeVMs.reset();

  // Count VMs by status
  const statusCounts = vms.reduce(
    (acc, vm) => {
      const status = vm.status?.toLowerCase() || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Set gauges for each status
  Object.entries(statusCounts).forEach(([status, count]) => {
    activeVMs.set({ status }, Number(count));
  });
}
