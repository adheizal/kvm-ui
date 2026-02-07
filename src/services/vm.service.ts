import { vmRepository } from '@/repositories/vm.repository';
import { sshService } from '@/utils/ssh';
import { logger } from '@/utils/logger';
import { config } from '@/config/env';
import { websocketService } from '@/services/websocket.service';
import { vmOperationDuration, vmOperationsTotal, updateActiveVMsMetrics } from '@/config/metrics';
import { pool } from '@/config/database';
import { VMInstance } from '@/types';

export class VMBusinessService {
  async updateIP(
    vmName: string,
    osName: string,
    newIP: string,
    hostname?: string
  ): Promise<{ success: boolean; message: string }> {
    const start = Date.now();
    try {
      // Validate input
      if (!newIP || !vmName || !osName) {
        vmOperationsTotal.labels('update-ip', 'failed').inc();
        return {
          success: false,
          message: 'Missing required fields: vmName, osName, and newIP are required',
        };
      }

      // Check if VM or IP already exists
      const existingVM = await vmRepository.findByVMName(vmName);
      const existingIP = await vmRepository.findByIPAddress(newIP);

      if (existingIP && existingIP.vm_name !== vmName) {
        vmOperationsTotal.labels('update-ip', 'failed').inc();
        return { success: false, message: 'IP address already used by another VM' };
      }

      websocketService.notifyVMOperationProgress(vmName, 'update-ip', 10, 'Starting IP update...');

      const result = await sshService.updateIP(vmName, osName, newIP, hostname);
      if (!result.success) {
        vmOperationsTotal.labels('update-ip', 'failed').inc();
        vmOperationDuration
          .labels('update-ip', vmName, 'failed')
          .observe((Date.now() - start) / 1000);
        websocketService.notifyVMOperationComplete(vmName, 'update-ip', false, {
          error: result.error,
        });
        return { success: false, message: result.error || 'Failed to update IP' };
      }

      websocketService.notifyVMOperationProgress(vmName, 'update-ip', 80, 'Updating database...');

      if (existingVM) {
        // Update existing VM IP
        await pool.query('UPDATE instances SET ip_address = $1 WHERE vm_name = $2', [
          newIP,
          vmName,
        ]);
      } else {
        // Insert new VM (adopt unmanaged VM)
        await vmRepository.create({ vmName, ipAddress: newIP, osName });
      }

      vmOperationsTotal.labels('update-ip', 'success').inc();
      vmOperationDuration
        .labels('update-ip', vmName, 'success')
        .observe((Date.now() - start) / 1000);
      websocketService.notifyVMOperationComplete(vmName, 'update-ip', true, { newIP, hostname });
      websocketService.notifyVMListUpdated();
      logger.info(
        `IP updated successfully: ${vmName} -> ${newIP}${hostname ? `, hostname: ${hostname}` : ''}`,
        { vmName, operation: 'update-ip', duration: Date.now() - start }
      );
      return {
        success: true,
        message: `IP Address${hostname ? ' and Hostname' : ''} Updated Successfully`,
      };
    } catch (error: any) {
      vmOperationsTotal.labels('update-ip', 'error').inc();
      vmOperationDuration.labels('update-ip', vmName, 'error').observe((Date.now() - start) / 1000);
      logger.error('Error updating IP:', error);
      websocketService.notifyVMOperationComplete(vmName, 'update-ip', false, {
        error: error.message,
      });
      return { success: false, message: 'An error occurred while updating IP address' };
    }
  }

  async deleteVM(vmName: string): Promise<{ success: boolean; message: string }> {
    const start = Date.now();
    try {
      websocketService.notifyVMOperationProgress(vmName, 'delete', 10, 'Deleting VM...');

      const deleted = await vmRepository.delete(vmName);
      if (!deleted) {
        vmOperationsTotal.labels('delete', 'failed').inc();
        vmOperationDuration.labels('delete', vmName, 'failed').observe((Date.now() - start) / 1000);
        websocketService.notifyVMOperationComplete(vmName, 'delete', false, {
          error: 'Instance not found',
        });
        return { success: false, message: 'Instance not found' };
      }

      vmOperationsTotal.labels('delete', 'success').inc();
      vmOperationDuration.labels('delete', vmName, 'success').observe((Date.now() - start) / 1000);
      websocketService.notifyVMOperationComplete(vmName, 'delete', true, {});
      websocketService.notifyVMDeleted(vmName);
      websocketService.notifyVMListUpdated();
      logger.info(`Instance deleted successfully: ${vmName}`, {
        vmName,
        operation: 'delete',
        duration: Date.now() - start,
      });
      return { success: true, message: 'Instance deleted successfully' };
    } catch (error: any) {
      vmOperationsTotal.labels('delete', 'error').inc();
      vmOperationDuration.labels('delete', vmName, 'error').observe((Date.now() - start) / 1000);
      logger.error('Error deleting instance:', error);
      websocketService.notifyVMOperationComplete(vmName, 'delete', false, { error: error.message });
      return { success: false, message: 'Internal Server Error' };
    }
  }

  async resizeDisk(
    vmName: string,
    ipAddress: string,
    newSize: number
  ): Promise<{ success: boolean; message: string }> {
    const start = Date.now();
    try {
      websocketService.notifyVMOperationProgress(
        vmName,
        'resize-disk',
        10,
        'Starting disk resize...'
      );

      const vm = await vmRepository.findByVMName(vmName);
      let updatedDiskSize: number;

      if (!vm) {
        // Unmanaged VM - adopt it
        const currentDiskSize = 30;
        updatedDiskSize = currentDiskSize + newSize;
        logger.info(`Adopting unmanaged VM with disk size: ${updatedDiskSize}`);
      } else {
        const currentDiskSize = vm.disk_size || 30;
        updatedDiskSize = currentDiskSize + newSize;
      }

      websocketService.notifyVMOperationProgress(
        vmName,
        'resize-disk',
        30,
        'Resizing disk via SSH...'
      );

      const result = await sshService.resizeDisk(vmName, ipAddress, newSize.toString());
      if (!result.success) {
        vmOperationsTotal.labels('resize-disk', 'failed').inc();
        vmOperationDuration
          .labels('resize-disk', vmName, 'failed')
          .observe((Date.now() - start) / 1000);
        websocketService.notifyVMOperationComplete(vmName, 'resize-disk', false, {
          error: result.error,
        });
        return { success: false, message: result.error || 'Failed to resize disk' };
      }

      websocketService.notifyVMOperationProgress(vmName, 'resize-disk', 80, 'Updating database...');

      if (!vm) {
        // Create VM record (adopt unmanaged VM)
        await vmRepository.create({ vmName, ipAddress, osName: '' });
      }
      await vmRepository.updateDiskSize(vmName, updatedDiskSize);

      vmOperationsTotal.labels('resize-disk', 'success').inc();
      vmOperationDuration
        .labels('resize-disk', vmName, 'success')
        .observe((Date.now() - start) / 1000);
      websocketService.notifyVMOperationComplete(vmName, 'resize-disk', true, {
        newSize: updatedDiskSize,
      });
      websocketService.notifyVMListUpdated();
      logger.info(`Disk resized successfully: ${vmName} -> ${updatedDiskSize}GB`, {
        vmName,
        operation: 'resize-disk',
        duration: Date.now() - start,
      });
      return { success: true, message: 'Disk resized successfully' };
    } catch (error: any) {
      vmOperationsTotal.labels('resize-disk', 'error').inc();
      vmOperationDuration
        .labels('resize-disk', vmName, 'error')
        .observe((Date.now() - start) / 1000);
      logger.error('Error resizing disk:', error);
      websocketService.notifyVMOperationComplete(vmName, 'resize-disk', false, {
        error: error.message,
      });
      return { success: false, message: 'An error occurred while resizing disk' };
    }
  }

  async exposeSSH(
    ipAddress: string
  ): Promise<{ success: boolean; message?: string; command?: string }> {
    const start = Date.now();
    try {
      websocketService.notifyVMOperationProgress(ipAddress, 'expose-ssh', 10, 'Exposing SSH...');

      const result = await sshService.exposeSSH(ipAddress);
      if (!result.success || !result.port) {
        vmOperationsTotal.labels('expose-ssh', 'failed').inc();
        vmOperationDuration
          .labels('expose-ssh', ipAddress, 'failed')
          .observe((Date.now() - start) / 1000);
        websocketService.notifyVMOperationComplete(ipAddress, 'expose-ssh', false, {
          error: 'Failed to expose SSH',
        });
        return { success: false, message: 'Failed to expose SSH' };
      }

      // Check if VM exists in database
      const vm = await vmRepository.findByIPAddress(ipAddress);
      if (!vm) {
        // This IP is not associated with any VM in database
        vmOperationsTotal.labels('expose-ssh', 'failed').inc();
        vmOperationDuration
          .labels('expose-ssh', ipAddress, 'failed')
          .observe((Date.now() - start) / 1000);
        websocketService.notifyVMOperationComplete(ipAddress, 'expose-ssh', false, {
          error: 'VM not found in database. Please update IP first.',
        });
        return {
          success: false,
          message: 'VM not found in database. Please update IP first to adopt this VM.',
        };
      }

      await vmRepository.updateSSHPort(ipAddress, result.port);
      const command = `ssh -l ${config.ssh.user} ${config.ssh.host} -p ${result.port}`;

      vmOperationsTotal.labels('expose-ssh', 'success').inc();
      vmOperationDuration
        .labels('expose-ssh', ipAddress, 'success')
        .observe((Date.now() - start) / 1000);
      websocketService.notifyVMOperationComplete(ipAddress, 'expose-ssh', true, {
        port: result.port,
        command,
      });
      websocketService.notifyVMListUpdated();
      logger.info(`SSH exposed successfully on port ${result.port}`, {
        ipAddress,
        operation: 'expose-ssh',
        duration: Date.now() - start,
      });
      return { success: true, message: command, command };
    } catch (error: any) {
      vmOperationsTotal.labels('expose-ssh', 'error').inc();
      vmOperationDuration
        .labels('expose-ssh', ipAddress, 'error')
        .observe((Date.now() - start) / 1000);
      logger.error('Error exposing SSH:', error);
      websocketService.notifyVMOperationComplete(ipAddress, 'expose-ssh', false, {
        error: error.message,
      });
      return { success: false, message: 'An error occurred while exposing SSH' };
    }
  }

  async exposeService(
    ipAddress: string,
    servicePort: number
  ): Promise<{ success: boolean; message?: string; url?: string }> {
    const start = Date.now();
    try {
      websocketService.notifyVMOperationProgress(
        ipAddress,
        'expose-service',
        10,
        'Exposing service...'
      );

      const result = await sshService.exposeService(ipAddress, servicePort.toString());
      if (!result.success || !result.port) {
        vmOperationsTotal.labels('expose-service', 'failed').inc();
        vmOperationDuration
          .labels('expose-service', ipAddress, 'failed')
          .observe((Date.now() - start) / 1000);
        websocketService.notifyVMOperationComplete(ipAddress, 'expose-service', false, {
          error: 'Failed to expose service',
        });
        return { success: false, message: 'Failed to expose service' };
      }

      // Check if VM exists in database
      const vm = await vmRepository.findByIPAddress(ipAddress);
      if (!vm) {
        // This IP is not associated with any VM in database
        vmOperationsTotal.labels('expose-service', 'failed').inc();
        vmOperationDuration
          .labels('expose-service', ipAddress, 'failed')
          .observe((Date.now() - start) / 1000);
        websocketService.notifyVMOperationComplete(ipAddress, 'expose-service', false, {
          error: 'VM not found in database. Please update IP first.',
        });
        return {
          success: false,
          message: 'VM not found in database. Please update IP first to adopt this VM.',
        };
      }

      await vmRepository.addServicePort(ipAddress, result.port);
      const url = `${config.ssh.host}:${result.port}`;

      vmOperationsTotal.labels('expose-service', 'success').inc();
      vmOperationDuration
        .labels('expose-service', ipAddress, 'success')
        .observe((Date.now() - start) / 1000);
      websocketService.notifyVMOperationComplete(ipAddress, 'expose-service', true, {
        port: result.port,
        url,
      });
      websocketService.notifyVMListUpdated();
      logger.info(`Service exposed successfully on port ${result.port}`, {
        ipAddress,
        operation: 'expose-service',
        duration: Date.now() - start,
      });
      return { success: true, message: url, url };
    } catch (error: any) {
      vmOperationsTotal.labels('expose-service', 'error').inc();
      vmOperationDuration
        .labels('expose-service', ipAddress, 'error')
        .observe((Date.now() - start) / 1000);
      logger.error('Error exposing service:', error);
      websocketService.notifyVMOperationComplete(ipAddress, 'expose-service', false, {
        error: error.message,
      });
      return { success: false, message: 'An error occurred while exposing the service' };
    }
  }

  async checkIP(ipAddress: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await sshService.checkIP(ipAddress);
      if (!result.success) {
        return { success: false, message: 'An error occurred while checking the IP address' };
      }

      const messageMap = {
        up: 'IP Already Used',
        down: 'IP Available',
        unknown: 'Unable to determine IP status',
      };

      return { success: true, message: messageMap[result.status || 'unknown'] };
    } catch (error: any) {
      logger.error('Error checking IP:', error);
      return { success: false, message: 'An error occurred while checking the IP address' };
    }
  }

  async listVMs(): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
      const vms = await vmRepository.findAll();
      updateActiveVMsMetrics(vms);
      return { success: true, data: vms };
    } catch (error: any) {
      logger.error('Error fetching list of VMs:', error);
      return { success: false, message: 'An error occurred while fetching list of VMs' };
    }
  }

  async getVMByName(vmName: string): Promise<VMInstance | null> {
    return await vmRepository.findByVMName(vmName);
  }

  async startVM(vmName: string): Promise<{ success: boolean; message: string }> {
    const start = Date.now();
    try {
      websocketService.notifyVMOperationProgress(vmName, 'start', 10, 'Starting VM...');

      const result = await sshService.startVM(vmName);
      if (!result.success) {
        vmOperationsTotal.labels('start', 'failed').inc();
        vmOperationDuration.labels('start', vmName, 'failed').observe((Date.now() - start) / 1000);
        websocketService.notifyVMOperationComplete(vmName, 'start', false, { error: result.error });
        return { success: false, message: result.error || 'Failed to start VM' };
      }

      // Wait a moment for VM to be recognized as running
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Get updated status
      const statusResult = await sshService.getAllVMStatuses();
      const newStatus = statusResult.vmStatuses?.get(vmName);

      if (newStatus === 'running') {
        vmOperationsTotal.labels('start', 'success').inc();
        vmOperationDuration.labels('start', vmName, 'success').observe((Date.now() - start) / 1000);
        websocketService.notifyVMOperationComplete(vmName, 'start', true, {});
        websocketService.notifyVMStatusChange(vmName, 'running');
        websocketService.notifyVMListUpdated();
        logger.info(`VM started successfully: ${vmName}`, {
          vmName,
          operation: 'start',
          duration: Date.now() - start,
        });
        return { success: true, message: 'VM started successfully' };
      } else {
        vmOperationsTotal.labels('start', 'failed').inc();
        vmOperationDuration.labels('start', vmName, 'failed').observe((Date.now() - start) / 1000);
        websocketService.notifyVMOperationComplete(vmName, 'start', false, {
          error: 'VM not in running state after start command',
        });
        return { success: false, message: 'VM failed to start' };
      }
    } catch (error: any) {
      vmOperationsTotal.labels('start', 'error').inc();
      vmOperationDuration.labels('start', vmName, 'error').observe((Date.now() - start) / 1000);
      logger.error('Error starting VM:', error);
      websocketService.notifyVMOperationComplete(vmName, 'start', false, { error: error.message });
      return { success: false, message: 'An error occurred while starting VM' };
    }
  }

  async stopVM(vmName: string): Promise<{ success: boolean; message: string }> {
    const start = Date.now();
    try {
      websocketService.notifyVMOperationProgress(vmName, 'stop', 10, 'Stopping VM...');

      const result = await sshService.stopVM(vmName);
      if (!result.success) {
        vmOperationsTotal.labels('stop', 'failed').inc();
        vmOperationDuration.labels('stop', vmName, 'failed').observe((Date.now() - start) / 1000);
        websocketService.notifyVMOperationComplete(vmName, 'stop', false, { error: result.error });
        return { success: false, message: result.error || 'Failed to stop VM' };
      }

      // Wait a moment for VM to shutdown
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Get updated status
      const statusResult = await sshService.getAllVMStatuses();
      const newStatus = statusResult.vmStatuses?.get(vmName);

      if (newStatus === 'stopped') {
        vmOperationsTotal.labels('stop', 'success').inc();
        vmOperationDuration.labels('stop', vmName, 'success').observe((Date.now() - start) / 1000);
        websocketService.notifyVMOperationComplete(vmName, 'stop', true, {});
        websocketService.notifyVMStatusChange(vmName, 'stopped');
        websocketService.notifyVMListUpdated();
        logger.info(`VM stopped successfully: ${vmName}`, {
          vmName,
          operation: 'stop',
          duration: Date.now() - start,
        });
        return { success: true, message: 'VM stopped successfully' };
      } else {
        vmOperationsTotal.labels('stop', 'failed').inc();
        vmOperationDuration.labels('stop', vmName, 'failed').observe((Date.now() - start) / 1000);
        websocketService.notifyVMOperationComplete(vmName, 'stop', false, {
          error: 'VM not in stopped state after stop command',
        });
        return { success: false, message: 'VM failed to stop' };
      }
    } catch (error: any) {
      vmOperationsTotal.labels('stop', 'error').inc();
      vmOperationDuration.labels('stop', vmName, 'error').observe((Date.now() - start) / 1000);
      logger.error('Error stopping VM:', error);
      websocketService.notifyVMOperationComplete(vmName, 'stop', false, { error: error.message });
      return { success: false, message: 'An error occurred while stopping VM' };
    }
  }
}

export const vmBusinessService = new VMBusinessService();
