import { broadcastToAll } from '@/config/websocket';
import { logger } from '@/utils/logger';

export type WebSocketEvent = {
  event: string;
  data: any;
  timestamp: Date;
};

export class WebSocketService {
  // VM Status Events
  notifyVMStatusChange(vmName: string, status: string, details?: any) {
    broadcastToAll('vm:status', {
      vmName,
      status,
      details,
      timestamp: new Date(),
    });
    logger.info(`WebSocket: VM status changed - ${vmName} -> ${status}`);
  }

  // VM Operation Progress
  notifyVMOperationProgress(vmName: string, operation: string, progress: number, message?: string) {
    broadcastToAll('vm:progress', {
      vmName,
      operation,
      progress,
      message,
      timestamp: new Date(),
    });
    logger.debug(`WebSocket: VM operation progress - ${vmName} ${operation} ${progress}%`);
  }

  // VM Operation Complete
  notifyVMOperationComplete(vmName: string, operation: string, success: boolean, result?: any) {
    broadcastToAll('vm:operation:complete', {
      vmName,
      operation,
      success,
      result,
      timestamp: new Date(),
    });
    logger.info(
      `WebSocket: VM operation ${operation} ${success ? 'completed' : 'failed'} for ${vmName}`
    );
  }

  // VM List Updated
  notifyVMListUpdated() {
    broadcastToAll('vm:list:updated', {
      timestamp: new Date(),
    });
    logger.debug('WebSocket: VM list updated');
  }

  // VM Created
  notifyVMCreated(vmName: string, details: any) {
    broadcastToAll('vm:created', {
      vmName,
      details,
      timestamp: new Date(),
    });
    logger.info(`WebSocket: VM created - ${vmName}`);
  }

  // VM Deleted
  notifyVMDeleted(vmName: string) {
    broadcastToAll('vm:deleted', {
      vmName,
      timestamp: new Date(),
    });
    logger.info(`WebSocket: VM deleted - ${vmName}`);
  }

  // System Notifications
  notifySystemNotification(message: string, type: 'info' | 'warning' | 'error' | 'success') {
    broadcastToAll('system:notification', {
      message,
      type,
      timestamp: new Date(),
    });
    logger.info(`WebSocket: System notification [${type}] - ${message}`);
  }

  // User joined room (for personalized updates)
  notifyUserJoined(userId: string) {
    broadcastToAll('user:joined', {
      userId,
      timestamp: new Date(),
    });
  }

  // User left room
  notifyUserLeft(userId: string) {
    broadcastToAll('user:left', {
      userId,
      timestamp: new Date(),
    });
  }
}

export const websocketService = new WebSocketService();
