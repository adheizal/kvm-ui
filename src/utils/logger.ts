import winston from 'winston';
import { config } from '@/config/env';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = config.env || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Development format: colored and readable
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const base = `${info.timestamp} ${info.level}: ${info.message}`;
    const meta = Object.keys(info).reduce((acc, key) => {
      if (!['timestamp', 'level', 'message'].includes(key)) {
        acc[key] = info[key];
      }
      return acc;
    }, {} as any);

    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    const stack = info.stack ? `\n${info.stack}` : '';

    return base + metaStr + stack;
  })
);

// Production format: JSON structured logs
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const format = config.env === 'production' ? prodFormat : devFormat;

const transports: winston.transport[] = [
  new winston.transports.Console({
    format:
      config.env === 'production'
        ? winston.format.combine(winston.format.timestamp(), winston.format.json())
        : undefined,
  }),
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: prodFormat, // Always JSON in files
  }),
  new winston.transports.File({
    filename: 'logs/all.log',
    format: prodFormat, // Always JSON in files
  }),
];

export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log', format: prodFormat }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log', format: prodFormat }),
  ],
});
