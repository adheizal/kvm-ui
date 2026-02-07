# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-02-06

### Added

- Complete TypeScript rewrite for type safety
- Clean Architecture with separated layers (Controllers, Services, Repositories)
- JWT-based authentication system
- Request validation using Joi
- Rate limiting for security
- Structured logging with Winston
- Database migration system
- Health check endpoints (`/api/health`, `/api/health/detailed`)
- API versioning with `/api` prefix
- Comprehensive error handling middleware
- Security middleware (Helmet, CORS)
- Testing framework setup (Jest, Supertest)
- Code quality tools (ESLint, Prettier, Husky)
- Pre-commit hooks with lint-staged
- Multi-stage Docker builds
- Health checks in Docker containers
- Docker volume management for data persistence
- Redis connection pool optimization
- PostgreSQL connection pool optimization
- Migration guide documentation
- API documentation structure (Swagger ready)
- SSH execution service with proper error handling
- Repository pattern for data access
- Service layer for business logic
- Comprehensive README with API documentation
- Example nginx configuration
- Quick start setup script

### Changed

- **BREAKING**: All API endpoints now prefixed with `/api`
- **BREAKING**: Authentication changed from session-based to JWT
- **BREAKING**: Environment variable naming (e.g., `SECRET` → `JWT_SECRET`)
- **BREAKING**: Response format standardized to JSON
- **BREAKING**: Docker Compose configuration updated with health checks
- Updated Node.js version requirement to v20+
- Improved project structure with `src/` directory
- Better error messages and logging
- Database connection handling with proper timeouts
- Redis connection with TLS support

### Fixed

- SQL injection vulnerabilities through parameterized queries
- Command injection risks in SSH execution
- Missing input validation
- Inconsistent error handling
- Missing rate limiting on authentication endpoints
- No monitoring/health check capabilities
- Poor logging infrastructure

### Removed

- Old session-based authentication code
- Inline HTML from route handlers
- Manual SQL file execution (replaced with migrations)
- Hardcoded configuration values

### Security Improvements

- Implemented JWT tokens with expiration
- Added rate limiting on all endpoints
- Added Helmet for security headers
- Input validation on all endpoints
- Password hashing with bcrypt (already present, improved)
- CORS configuration
- Request sanitization
- SQL injection prevention
- Command injection prevention

### Performance Improvements

- Multi-stage Docker builds for smaller images
- Connection pooling for database
- Connection pooling for Redis
- Optimized Docker layer caching
- Health check optimizations

### Developer Experience

- TypeScript for better IDE support
- ESLint for code quality
- Prettier for code formatting
- Husky for git hooks
- Comprehensive documentation
- Migration guide for upgrading
- Example configurations
- Testing framework ready

## [1.0.0] - Initial Release

### Features

- QEMU KVM VM management
- IP address update after cloning
- Disk resizing
- SSH exposure with random ports
- Service exposure
- IP availability checking
- VM listing from database
- Basic authentication
- Docker deployment

[2.0.0]: https://github.com/your-repo/kvm-ui/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/your-repo/kvm-ui/releases/tag/v1.0.0
