const config = {
    SSH_HOST: process.env.SSH_HOST,
    SSH_USER: process.env.SSH_USER,
    SECRET: process.env.SECRET,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_SSL: process.env.DB_SSL,
    HYPERDX_API_KEY: process.env.HYPERDX_API_KEY,
    TEMPLATE_IP: process.env.TEMPLATE_IP,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_USER: process.env.REDIS_USER,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD
}

module.exports = config