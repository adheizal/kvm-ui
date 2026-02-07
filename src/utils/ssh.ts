import { exec } from 'child_process';
import { promisify } from 'util';
import { config } from '@/config/env';
import { logger } from './logger';
import { SSHResult } from '@/types';

const execAsync = promisify(exec);

export class SSHService {
  private buildSSHCommand(scriptName: string, ...args: string[]): string {
    const scriptPath = `ssh -l ${config.ssh.user} ${config.ssh.host} bash /opt/script/${scriptName}`;
    // Filter out empty/undefined arguments to avoid double spaces
    const validArgs = args.filter((arg) => arg && arg.trim().length > 0);
    return validArgs.length > 0 ? `${scriptPath} ${validArgs.join(' ')}` : scriptPath;
  }

  async executeScript(scriptName: string, ...args: string[]): Promise<SSHResult> {
    const command = this.buildSSHCommand(scriptName, ...args);
    logger.info(`Executing SSH command: ${command}`);

    try {
      const { stdout, stderr } = await execAsync(command, { cwd: '/tmp', timeout: 60000 });

      if (stderr && !stdout) {
        logger.error(`SSH command stderr: ${stderr}`);
        return {
          success: false,
          stderr,
          error: stderr,
        };
      }

      logger.info(`SSH command stdout: ${stdout}`);
      return {
        success: true,
        stdout,
        stderr,
      };
    } catch (error: any) {
      logger.error(`SSH command error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        stderr: error.stderr || '',
      };
    }
  }

  extractPort(output: string): number | null {
    const portMatch = output.match(/Random Port: (\d+)/);
    if (!portMatch) {
      logger.error('Failed to extract port number from output');
      return null;
    }
    return parseInt(portMatch[1], 10);
  }

  parseNmapOutput(output: string): 'up' | 'down' | 'unknown' {
    if (output.includes('Host is up')) {
      return 'up';
    } else if (output.includes('Host seems down')) {
      return 'down';
    }
    return 'unknown';
  }

  async updateIP(
    vmName: string,
    osName: string,
    newIP: string,
    hostname?: string
  ): Promise<SSHResult> {
    if (hostname) {
      return this.executeScript('update.sh', osName, vmName, newIP, hostname);
    }
    return this.executeScript('update.sh', osName, vmName, newIP);
  }

  async resizeDisk(vmName: string, ipAddress: string, newSize: string): Promise<SSHResult> {
    return this.executeScript('disk.sh', vmName, ipAddress, newSize);
  }

  async exposeSSH(ipAddress: string): Promise<SSHResult & { port?: number }> {
    const result = await this.executeScript('ssh.sh', ipAddress);
    if (result.success && result.stdout) {
      const port = this.extractPort(result.stdout);
      return { ...result, port: port || undefined };
    }
    return result;
  }

  async exposeService(
    ipAddress: string,
    servicePort: string
  ): Promise<SSHResult & { port?: number }> {
    const result = await this.executeScript('service.sh', ipAddress, servicePort);
    if (result.success && result.stdout) {
      const port = this.extractPort(result.stdout);
      return { ...result, port: port || undefined };
    }
    return result;
  }

  async checkIP(ipAddress: string): Promise<SSHResult & { status?: 'up' | 'down' | 'unknown' }> {
    const command = `ssh -l ${config.ssh.user} ${config.ssh.host} nmap -sP -PR ${ipAddress}`;
    logger.info(`Checking IP: ${command}`);

    try {
      const { stdout, stderr } = await execAsync(command, { cwd: '/tmp', timeout: 30000 });
      const status = this.parseNmapOutput(stdout);
      return {
        success: true,
        stdout,
        stderr,
        status,
      };
    } catch (error: any) {
      logger.error(`Check IP error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        status: 'unknown',
      };
    }
  }

  async getAllVMStatuses(): Promise<SSHResult & { vmStatuses?: Map<string, string> }> {
    const command = `ssh -l ${config.ssh.user} ${config.ssh.host} "virsh list --all --name"`;
    logger.info(`Getting all VM statuses: ${command}`);

    try {
      const { stdout, stderr } = await execAsync(command, { cwd: '/tmp', timeout: 30000 });

      // Get running VMs
      const runningCommand = `ssh -l ${config.ssh.user} ${config.ssh.host} "virsh list --name"`;
      const { stdout: runningStdout } = await execAsync(runningCommand, {
        cwd: '/tmp',
        timeout: 30000,
      });

      const allVMs = stdout
        .trim()
        .split('\n')
        .filter((vm) => vm.trim());
      const runningVMs = new Set(
        runningStdout
          .trim()
          .split('\n')
          .filter((vm) => vm.trim())
      );

      const vmStatuses = new Map<string, string>();
      allVMs.forEach((vm) => {
        const vmName = vm.trim();
        vmStatuses.set(vmName, runningVMs.has(vmName) ? 'running' : 'stopped');
      });

      logger.info(`Retrieved statuses for ${vmStatuses.size} VMs`);

      return {
        success: true,
        stdout,
        stderr,
        vmStatuses,
      };
    } catch (error: any) {
      logger.error(`Get VM statuses error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        stderr: error.stderr || '',
      };
    }
  }

  async getAllVMsFromVirsh(): Promise<
    SSHResult & { vms?: Array<{ name: string; status: string }> }
  > {
    const command = `ssh -l ${config.ssh.user} ${config.ssh.host} "virsh list --all --name"`;
    logger.info(`Getting all VMs from virsh: ${command}`);

    try {
      const { stdout, stderr } = await execAsync(command, { cwd: '/tmp', timeout: 30000 });

      // Get running VMs
      const runningCommand = `ssh -l ${config.ssh.user} ${config.ssh.host} "virsh list --name"`;
      const { stdout: runningStdout } = await execAsync(runningCommand, {
        cwd: '/tmp',
        timeout: 30000,
      });

      const allVMs = stdout
        .trim()
        .split('\n')
        .filter((vm) => vm.trim());
      const runningVMs = new Set(
        runningStdout
          .trim()
          .split('\n')
          .filter((vm) => vm.trim())
      );

      const vms = allVMs.map((vmName) => ({
        name: vmName.trim(),
        status: runningVMs.has(vmName.trim()) ? 'running' : 'stopped',
      }));

      logger.info(`Retrieved ${vms.length} VMs from virsh`);

      return {
        success: true,
        stdout,
        stderr,
        vms,
      };
    } catch (error: any) {
      logger.error(`Get VMs from virsh error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        stderr: error.stderr || '',
      };
    }
  }

  async startVM(vmName: string): Promise<SSHResult> {
    const command = `ssh -l ${config.ssh.user} ${config.ssh.host} "virsh start ${vmName}"`;
    logger.info(`Starting VM: ${command}`);

    try {
      const { stdout, stderr } = await execAsync(command, { cwd: '/tmp', timeout: 60000 });

      // Check if VM started successfully (virsh returns "Domain 'vm-name' started")
      if (stderr && !stdout.includes('started')) {
        logger.error(`Start VM stderr: ${stderr}`);
        return {
          success: false,
          stderr,
          error: stderr,
        };
      }

      logger.info(`VM started successfully: ${vmName}`);
      return {
        success: true,
        stdout,
        stderr,
      };
    } catch (error: any) {
      logger.error(`Start VM error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        stderr: error.stderr || '',
      };
    }
  }

  async stopVM(vmName: string): Promise<SSHResult> {
    const command = `ssh -l ${config.ssh.user} ${config.ssh.host} "virsh shutdown ${vmName}"`;
    logger.info(`Stopping VM: ${command}`);

    try {
      const { stdout, stderr } = await execAsync(command, { cwd: '/tmp', timeout: 60000 });

      // Check if VM stopped successfully (virsh returns "Domain 'vm-name' is being shutdown")
      if (stderr && !stdout.includes('shutdown') && !stdout.includes('being shutdown')) {
        logger.error(`Stop VM stderr: ${stderr}`);
        return {
          success: false,
          stderr,
          error: stderr,
        };
      }

      logger.info(`VM stopped successfully: ${vmName}`);
      return {
        success: true,
        stdout,
        stderr,
      };
    } catch (error: any) {
      logger.error(`Stop VM error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        stderr: error.stderr || '',
      };
    }
  }
}

export const sshService = new SSHService();
