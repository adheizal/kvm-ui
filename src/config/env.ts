import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),

  // SSH Configuration
  SSH_HOST: Joi.string().required(),
  SSH_USER: Joi.string().required(),

  // JWT Configuration
  JWT_SECRET: Joi.string().required().default('change-this-secret-in-production'),
  JWT_EXPIRES_IN: Joi.string().default('24h'),

  // Database Configuration
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_SSL: Joi.boolean().default(false),

  // Redis Configuration
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_USER: Joi.string().allow('').default(''),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_TLS: Joi.boolean().default(false),
  REDIS_CA: Joi.string().allow('').default(''),
  REDIS_REJECT_UNAUTHORIZED: Joi.boolean().default(false),

  // Monitoring
  HYPERDX_API_KEY: Joi.string().allow('').default(''),
  LOGTAIL_TOKEN: Joi.string().allow('').default(''),

  // VM Configuration
  TEMPLATE_IP: Joi.string().allow('').default(''),

  // CORS
  CORS_ORIGIN: Joi.string().default('*'),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
}).unknown(true);

const { value: envVars, error } = envSchema.validate(process.env, { abortEarly: false });

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  ssh: {
    host: envVars.SSH_HOST,
    user: envVars.SSH_USER,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
  },
  database: {
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    name: envVars.DB_NAME,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    ssl: envVars.DB_SSL,
  },
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    user: envVars.REDIS_USER,
    password: envVars.REDIS_PASSWORD,
    tls: envVars.REDIS_TLS,
    ca: envVars.REDIS_CA,
    rejectUnauthorized: envVars.REDIS_REJECT_UNAUTHORIZED,
  },
  monitoring: {
    hyperdxApiKey: envVars.HYPERDX_API_KEY,
    logtailToken: envVars.LOGTAIL_TOKEN,
  },
  vm: {
    templateIp: envVars.TEMPLATE_IP,
  },
  cors: {
    origin: envVars.CORS_ORIGIN,
  },
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    max: envVars.RATE_LIMIT_MAX_REQUESTS,
  },
} as const;
