# KVM-UI - Enterprise Edition

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.19.6-green.svg)
![Backward Compatible](https://img.shields.io/badge/backward%20compatibility-yes-brightgreen.svg)

Enterprise-grade web-based management tool for QEMU KVM virtual machines.

## ⚡ Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd kvm-ui
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start services
docker compose up -d

# Run migrations
docker compose exec app npm run migrate

# Create admin user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-password"}'

# Access application
open http://localhost:3000
```

## 🔄 Backward Compatibility

**Good news!** Your existing v1.0 frontend works without any changes. v2.0 maintains full backward compatibility while adding a modern API.

- ✅ Legacy endpoints work as-is
- ✅ Cookie-based authentication maintained
- ✅ Same response formats
- 🆕 Modern API with `/api` prefix available
- 🆕 JWT token authentication
- 🆕 Better error handling and validation

**See [BACKWARD_COMPATIBILITY.md](BACKWARD_COMPATIBILITY.md) for details.**

## 🚀 Features

- **Modern Architecture**: TypeScript + Clean Architecture patterns
- **JWT Authentication**: Secure token-based authentication with RBAC ready
- **API-First Design**: RESTful API with OpenAPI/Swagger documentation
- **Security**: Rate limiting, input validation, helmet security headers
- **Logging**: Structured logging with Winston
- **Health Checks**: Comprehensive health check endpoints
- **Database Migrations**: Automated schema migrations
- **Queue System**: Background job processing for long-running operations
- **Testing**: Jest-based testing framework
- **Code Quality**: ESLint, Prettier, Husky pre-commit hooks

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) v20+ / v22
- [npm](https://docs.npmjs.com/) 10+
- [Docker](https://www.docker.com/) & Docker Compose
- PostgreSQL 15+
- Redis 7+

## 🔧 Installation

### Using Docker Compose (Recommended)

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd kvm-ui
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build Docker image and get SSH public key**

   ```bash
   docker compose build app

   # The build will display an SSH public key
   # Copy this key for the next step
   ```

4. **Add SSH public key to KVM host**

   ```bash
   # On your KVM host:
   mkdir -p ~/.ssh
   echo "ssh-ed25519 <YOUR_PUBLIC_KEY_FROM_BUILD> kvm-ui@buildkitsandbox" >> ~/.ssh/authorized_keys
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys

   # Or use the helper script to retrieve the key:
   ./scripts/show-ssh-key.sh
   ```

5. **Start the services**

   ```bash
   docker compose up -d
   ```

6. **Run database migrations**

   ```bash
   docker compose exec app npm run migrate
   ```

7. **Create admin user**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "your-secure-password"}'
   ```

### Manual Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Setup environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run database migrations**

   ```bash
   npm run migrate
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 📚 API Documentation

Once the server is running, visit:

- API Documentation: `http://localhost:3000/api/docs`
- Health Check: `http://localhost:3000/api/health`

### API Endpoints

#### Authentication

- `POST /api/auth/register` - Register new user (only first user)
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

#### VM Management

- `POST /api/vm/update-ip` - Update VM IP address
- `DELETE /api/vm/delete-ip` - Delete VM record
- `POST /api/vm/resize-disk` - Resize VM disk
- `POST /api/vm/expose-ssh` - Expose SSH to public
- `POST /api/vm/expose-service` - Expose service to public
- `POST /api/vm/check-ip` - Check IP availability
- `GET /api/vm/list` - List all VMs

#### Health

- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health check

## 🏗️ Project Structure

```
kvm-ui/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Express middlewares
│   ├── repositories/    # Data access layer
│   ├── routes/          # API routes
│   ├── services/        # Business logic layer
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   ├── validators/      # Request validators
│   ├── queues/          # Job queue definitions
│   ├── workers/         # Job workers
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── migrations/          # Database migrations
├── tests/               # Test files
├── public/              # Static files
├── script/              # Shell scripts
└── docker-compose.yaml  # Docker setup
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🔒 Security Features

- **JWT Authentication**: Token-based authentication
- **Rate Limiting**: Prevent brute force attacks
- **Input Validation**: Joi-based request validation
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Password Hashing**: Bcrypt for secure password storage

## 📊 Monitoring

### Health Check Endpoints

```bash
# Basic health check
curl http://localhost:3000/api/health

# Detailed health check
curl http://localhost:3000/api/health/detailed
```

### Logs

Logs are stored in the `logs/` directory:

- `all.log` - All logs
- `error.log` - Error logs only

## 🔧 Development

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run typecheck
```

### Pre-commit Hooks

Husky is configured to run lint-staged before commits:

```bash
# Setup pre-commit hooks
npm run prepare
```

## 🐳 Docker

### Build Image

```bash
docker build -t kvm-ui:latest .
```

### Run with Docker Compose

```bash
docker compose up -d
```

### View Logs

```bash
docker compose logs -f app
```

### Stop Services

```bash
docker compose down
```

## 📝 Configuration

See `.env.example` for all available configuration options:

- `SSH_HOST` - Target QEMU KVM host IP
- `SSH_USER` - SSH user for KVM host
- `JWT_SECRET` - Secret key for JWT tokens
- `DB_HOST`, `DB_USER`, `DB_PASSWORD` - PostgreSQL configuration
- `REDIS_HOST`, `REDIS_PASSWORD` - Redis configuration

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

ISC

## 🆘 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker compose ps postgres

# View PostgreSQL logs
docker compose logs postgres
```

### Redis Connection Issues

```bash
# Check Redis is running
docker compose ps redis

# View Redis logs
docker compose logs redis
```

### Migration Issues

```bash
# Re-run migrations
docker compose exec app npm run migrate
```

## 📞 Support

For issues and questions, please open an issue on GitHub.
