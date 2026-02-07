import Joi from 'joi';

export const updateIPSchema = Joi.object({
  vmName: Joi.string().required(),
  osName: Joi.string().valid('ubuntu', 'centos').required(),
  newIp: Joi.string().ip().required(),
  hostname: Joi.string().optional(),
});

export const deleteIPSchema = Joi.object({
  vmName: Joi.string().required(),
});

export const resizeDiskSchema = Joi.object({
  vmName: Joi.string().required(),
  ipAddress: Joi.string().ip().optional(),
  newSize: Joi.number().integer().min(1).max(1000).required(),
});

export const exposeSSHSchema = Joi.object({
  ipAddress: Joi.string().ip().required(),
});

export const exposeServiceSchema = Joi.object({
  ipAddress: Joi.string().ip().required(),
  servicePort: Joi.number().integer().min(1).max(65535).required(),
});

export const checkIPSchema = Joi.object({
  ipAddress: Joi.string().ip().required(),
});
