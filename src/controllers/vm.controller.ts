import { Response } from 'express';
import { vmBusinessService } from '@/services/vm.service';
import { AuthRequest, VMInstance } from '@/types';
import { sshService } from '@/utils/ssh';
import { logger } from '@/utils/logger';

export class VMController {
  async updateIP(req: AuthRequest, res: Response): Promise<any> {
    const { vmName, osName, newIp, hostname } = req.body;
    const result = await vmBusinessService.updateIP(vmName, osName, newIp, hostname);

    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(409).json({ error: result.message });
    }
  }

  async deleteIP(req: AuthRequest, res: Response): Promise<any> {
    const { vmName } = req.body;
    const result = await vmBusinessService.deleteVM(vmName);

    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(404).json({ error: result.message });
    }
  }

  async resizeDisk(req: AuthRequest, res: Response): Promise<any> {
    const { vmName, ipAddress, newSize } = req.body;

    logger.info(`resizeDisk called: vmName=${vmName}, ipAddress=${ipAddress}, newSize=${newSize}`);

    // If ipAddress not provided, try to get it from database
    let targetIp = ipAddress?.trim(); // Trim and handle undefined
    logger.info(`Initial targetIp: ${targetIp}`);

    if (!targetIp) {
      logger.info(`IP not provided, fetching from database for vmName: ${vmName}`);
      const vm = await vmBusinessService.getVMByName(vmName);
      logger.info(`VM from database: ${JSON.stringify(vm)}`);
      if (!vm || !vm.ip_address) {
        logger.error(`VM not found or no IP: vm=${!!vm}, ip=${vm?.ip_address}`);
        return res.status(400).json({
          error: 'VM not found in database or has no IP address. Please update IP first.',
        });
      }
      targetIp = vm.ip_address;
      logger.info(`targetIp from database: ${targetIp}`);
    }

    // Final validation
    if (!targetIp || targetIp.trim() === '') {
      logger.error(`targetIp is empty after all checks`);
      return res.status(400).json({ error: 'IP address is required for disk resize' });
    }

    logger.info(
      `Calling resizeDisk with: vmName=${vmName}, targetIp=${targetIp}, newSize=${newSize}`
    );
    const result = await vmBusinessService.resizeDisk(vmName, targetIp, newSize);

    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(500).json({ error: result.message });
    }
  }

  async exposeSSH(req: AuthRequest, res: Response): Promise<any> {
    const { ipAddress } = req.body;
    const result = await vmBusinessService.exposeSSH(ipAddress);

    if (result.success && result.command) {
      res.json({ command: result.message });
    } else {
      res.status(500).json({ error: result.message });
    }
  }

  async exposeService(req: AuthRequest, res: Response): Promise<any> {
    const { ipAddress, servicePort } = req.body;
    const result = await vmBusinessService.exposeService(ipAddress, servicePort);

    if (result.success && result.url) {
      res.json({ url: result.message });
    } else {
      res.status(500).json({ error: result.message });
    }
  }

  async checkIP(req: AuthRequest, res: Response): Promise<any> {
    const { ipAddress } = req.body;
    const result = await vmBusinessService.checkIP(ipAddress);

    if (result.success) {
      res.json({ status: result.message });
    } else {
      res.status(500).json({ error: result.message });
    }
  }

  async listVMs(_req: AuthRequest, res: Response): Promise<any> {
    logger.info('=== listVMs CALLED ===');
    const result = await vmBusinessService.listVMs();

    if (result.success && result.data) {
      logger.info('=== Getting VM statuses from SSH ===');
      // Get real-time VM statuses from SSH
      const statusResult = await sshService.getAllVMStatuses();
      const vmStatuses = statusResult.vmStatuses || new Map();

      // Transform VMInstance to frontend format with status
      const vms = (result.data as VMInstance[]).map((vm: VMInstance) => ({
        name: vm.vm_name,
        ip: vm.ip_address,
        ssh_port: vm.ssh_port,
        service_ports: vm.service_ports,
        status: vmStatuses.get(vm.vm_name) || 'unknown',
        created_at: vm.created_at,
        memory: vm.os_name,
        disk: vm.disk_size ? `${vm.disk_size}GB` : undefined,
        in_database: true, // Flag to indicate VM is in database
      }));

      logger.info(`=== Returning ${vms.length} VMs with statuses ===`);
      logger.info(`First VM: ${JSON.stringify(vms[0])}`);
      res.json(vms);
    } else {
      logger.error('=== listVMs FAILED ===', { message: result.message });
      res.status(500).json({ error: result.message });
    }
  }

  async listVMsLive(_req: AuthRequest, res: Response): Promise<any> {
    logger.info('=== listVMsLive CALLED ===');

    const virshResult = await sshService.getAllVMsFromVirsh();

    if (!virshResult.success || !virshResult.vms) {
      logger.error('=== listVMsLive FAILED ===', { message: virshResult.error });
      return res.status(500).json({ error: virshResult.error || 'Failed to fetch VMs from virsh' });
    }

    // Get VMs from database to merge additional info
    const dbResult = await vmBusinessService.listVMs();
    const dbVMs = new Map<string, any>();

    if (dbResult.success && dbResult.data) {
      (dbResult.data as VMInstance[]).forEach((vm: VMInstance) => {
        dbVMs.set(vm.vm_name, {
          ip: vm.ip_address,
          ssh_port: vm.ssh_port,
          service_ports: vm.service_ports,
          created_at: vm.created_at,
          memory: vm.os_name,
          disk: vm.disk_size ? `${vm.disk_size}GB` : undefined,
        });
      });
    }

    // Merge virsh VMs with database info
    const vms = virshResult.vms.map((vm) => ({
      name: vm.name,
      status: vm.status,
      in_database: dbVMs.has(vm.name),
      // Add database info if available
      ...(dbVMs.get(vm.name) || {
        ip: null,
        ssh_port: null,
        service_ports: null,
        created_at: null,
        memory: null,
        disk: null,
      }),
    }));

    logger.info(`=== Returning ${vms.length} VMs from virsh (live view) ===`);
    res.json(vms);
  }

  async startVM(req: AuthRequest, res: Response): Promise<any> {
    const { vmName } = req.body;
    logger.info(`=== startVM CALLED for ${vmName} ===`);

    const result = await vmBusinessService.startVM(vmName);

    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(500).json({ error: result.message });
    }
  }

  async stopVM(req: AuthRequest, res: Response): Promise<any> {
    const { vmName } = req.body;
    logger.info(`=== stopVM CALLED for ${vmName} ===`);

    const result = await vmBusinessService.stopVM(vmName);

    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(500).json({ error: result.message });
    }
  }
}

export const vmController = new VMController();
