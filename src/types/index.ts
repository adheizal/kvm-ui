export interface User {
  id: number;
  username: string;
  password: string;
  created_at?: Date;
}

export interface VMInstance {
  id: number;
  vm_name: string;
  ip_address: string;
  ssh_port?: number;
  service_ports?: string;
  os_name?: string;
  disk_size?: number;
  created_at?: Date;
}

export interface VMCreateInput {
  vmName: string;
  ipAddress: string;
  osName: string;
}

export interface VMUpdateInput {
  vmName: string;
  ipAddress: string;
  osName: string;
}

export interface DiskResizeInput {
  vmName: string;
  ipAddress: string;
  newSize: number;
}

export interface SSHExposeInput {
  ipAddress: string;
}

export interface ServiceExposeInput {
  ipAddress: string;
  servicePort: number;
}

export interface IPCheckInput {
  ipAddress: string;
}

export interface JWTPayload {
  userId: number;
  username: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest {
  user?: JWTPayload;
  body: any;
  header(name: string): string | undefined;
  cookies?: {
    token?: string;
    [key: string]: any;
  };
}

export interface SSHResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
  port?: number;
}

export interface QueueJobData {
  type: 'update-ip' | 'resize-disk' | 'expose-ssh' | 'expose-service' | 'check-ip';
  data: any;
  userId: number;
}
