import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const updateIPSchema = z.object({
  vmName: z.string().min(1, 'VM name is required'),
  osName: z.enum(['ubuntu', 'centos'], { required_error: 'OS type is required' }),
  newIp: z
    .string()
    .min(1, 'IP address is required')
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/, 'Invalid IP address format'),
  hostname: z.string().optional(),
});

export type UpdateIPFormData = z.infer<typeof updateIPSchema>;

export const resizeDiskSchema = z.object({
  vmName: z.string().min(1, 'VM name is required'),
  newSize: z.string().min(1, 'New size is required').regex(/^\d+$/, 'Size must be a number in GB'),
});

export type ResizeDiskFormData = z.infer<typeof resizeDiskSchema>;

export const exposeSSHSchema = z.object({
  vmName: z.string().min(1, 'VM name is required'),
});

export type ExposeSSHFormData = z.infer<typeof exposeSSHSchema>;

export const exposeServiceSchema = z.object({
  vmName: z.string().min(1, 'VM name is required'),
  servicePort: z.string().min(1, 'Service port is required'),
  protocol: z.enum(['tcp', 'udp']),
});

export type ExposeServiceFormData = z.infer<typeof exposeServiceSchema>;
