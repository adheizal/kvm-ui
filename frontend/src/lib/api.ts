import { apiClient } from './api-client';

export interface VM {
  name: string;
  ip: string;
  ssh_port: number;
  service_ports: string;
  status: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    username: string;
  };
}

// Auth API
export const authApi = {
  login: async (data: LoginRequest) => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', data);
    return response.data;
  },

  logout: async () => {
    await apiClient.post('/api/auth/logout');
  },

  getSession: async () => {
    const response = await apiClient.get('/api/auth/session');
    return response.data;
  },
};

// VM API
export const vmApi = {
  list: async () => {
    const response = await apiClient.get<VM[]>('/api/vm/list');
    return response.data;
  },

  listLive: async () => {
    const response = await apiClient.get<VM[]>('/api/vm/list-live');
    return response.data;
  },

  start: async (data: { vmName: string }) => {
    const response = await apiClient.post('/api/vm/start', data);
    return response.data;
  },

  stop: async (data: { vmName: string }) => {
    const response = await apiClient.post('/api/vm/stop', data);
    return response.data;
  },

  getDetail: async (name: string) => {
    const response = await apiClient.get<VM>(`/api/vm/${name}`);
    return response.data;
  },

  updateIP: async (data: { vmName: string; osName: string; newIp: string; hostname?: string }) => {
    const response = await apiClient.post('/update-ip', data);
    return response.data;
  },

  deleteIP: async (data: { vmName: string }) => {
    const response = await apiClient.delete('/delete-ip', { data });
    return response.data;
  },

  resizeDisk: async (data: { vmName: string; newSize: string }) => {
    const response = await apiClient.post('/resize-disk', data);
    return response.data;
  },

  exposeSSH: async (data: { vmName: string }) => {
    const response = await apiClient.post('/expose-ssh', data);
    return response.data;
  },

  exposeService: async (data: { vmName: string; servicePort: string; protocol: string }) => {
    const response = await apiClient.post('/expose-service', data);
    return response.data;
  },

  deleteVM: async (data: { vmName: string }) => {
    const response = await apiClient.delete('/delete-vm', { data });
    return response.data;
  },
};

// Health API
export const healthApi = {
  check: async () => {
    const response = await apiClient.get('/api/health');
    return response.data;
  },
};
