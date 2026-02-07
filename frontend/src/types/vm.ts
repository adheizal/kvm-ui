export interface VM {
  name: string;
  ip: string;
  ssh_port: number;
  service_ports: string;
  status: 'running' | 'stopped' | 'error';
  created_at?: string;
  updated_at?: string;
  memory?: string;
  disk?: string;
  in_database?: boolean; // Flag to indicate if VM is in database
}

export interface VMFormData {
  vmName: string;
  newIp?: string;
  newSize?: string;
  servicePort?: string;
  protocol?: string;
}
