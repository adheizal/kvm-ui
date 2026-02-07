import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '@/config/env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'KVM-UI API',
      version: '2.0.0',
      description: `API documentation for KVM-UI v2.0 - Enterprise-grade QEMU KVM virtual machine management tool.

## Features

- VM Management: Create, update, delete, and monitor virtual machines
- Real-time Updates: WebSocket integration for live VM status
- Authentication: JWT-based authentication with legacy cookie support
- SSH Operations: Expose SSH ports and services
- Disk Management: Resize VM disks dynamically

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## WebSocket

Connect to WebSocket for real-time updates:

\`\`\`javascript
const socket = io('http://localhost:3000');
socket.on('vm:status', (data) => console.log(data));
socket.on('vm:progress', (data) => console.log(data));
socket.on('vm:operation:complete', (data) => console.log(data));
\`\`\`

### WebSocket Events

| Event | Description |
|-------|-------------|
| \`vm:status\` | VM status change notification |
| \`vm:progress\` | VM operation progress updates |
| \`vm:operation:complete\` | VM operation completion |
| \`vm:list:updated\` | VM list updated notification |
| \`vm:created\` | New VM created |
| \`vm:deleted\` | VM deleted |
| \`system:notification\` | System notifications |`,
      contact: {
        name: 'Development Team',
        email: 'dev@example.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message here',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
