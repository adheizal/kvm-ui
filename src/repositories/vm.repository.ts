import { pool } from '@/config/database';
import { VMInstance, VMCreateInput } from '@/types';

export class VMRepository {
  async findAll(): Promise<VMInstance[]> {
    const result = await pool.query(
      'SELECT id, vm_name, ip_address, ssh_port, service_ports, os_name, disk_size FROM public.instances ORDER BY id'
    );
    return result.rows;
  }

  async findByVMName(vmName: string): Promise<VMInstance | null> {
    const result = await pool.query('SELECT * FROM instances WHERE vm_name = $1', [vmName]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async findByIPAddress(ipAddress: string): Promise<VMInstance | null> {
    const result = await pool.query('SELECT * FROM instances WHERE ip_address = $1', [ipAddress]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async exists(vmName: string, osName: string, ipAddress: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM instances WHERE vm_name = $1 AND os_name = $2 OR ip_address = $3',
      [vmName, osName, ipAddress]
    );
    return result.rows.length > 0;
  }

  async create(data: VMCreateInput): Promise<VMInstance> {
    const result = await pool.query(
      'INSERT INTO instances (vm_name, ip_address, os_name) VALUES ($1, $2, $3) RETURNING *',
      [data.vmName, data.ipAddress, data.osName]
    );
    return result.rows[0];
  }

  async updateSSHPort(ipAddress: string, port: number): Promise<void> {
    await pool.query('UPDATE instances SET ssh_port = $1 WHERE ip_address = $2', [port, ipAddress]);
  }

  async updateServicePorts(ipAddress: string, ports: string): Promise<void> {
    await pool.query('UPDATE instances SET service_ports = $1 WHERE ip_address = $2', [
      ports,
      ipAddress,
    ]);
  }

  async updateDiskSize(vmName: string, diskSize: number): Promise<void> {
    await pool.query('UPDATE instances SET disk_size = $1 WHERE vm_name = $2', [diskSize, vmName]);
  }

  async delete(vmName: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM instances WHERE vm_name = $1', [vmName]);
    return (result.rowCount ?? 0) > 0;
  }

  async addServicePort(ipAddress: string, newPort: number): Promise<void> {
    const result = await pool.query('SELECT service_ports FROM instances WHERE ip_address = $1', [
      ipAddress,
    ]);

    let servicePorts: string[] = [];
    if (result.rows.length > 0 && result.rows[0].service_ports) {
      servicePorts = result.rows[0].service_ports.split(',');
    }

    servicePorts.push(newPort.toString());
    await this.updateServicePorts(ipAddress, servicePorts.join(','));
  }
}

export const vmRepository = new VMRepository();
