const config = {
    SSH_HOST: process.env.SSH_HOST,
    SSH_USER: process.env.SSH_USER,
    SECRET: process.env.SECRET,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    LOGTAIL_TOKEN: process.env.LOGTAIL_TOKEN,
    TEMPLATE_IP: process.env.TEMPLATE_IP
}

module.exports = config