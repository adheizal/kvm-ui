# Qemu KVM Management
**KVM-UI** tools for manage Virtual Machine in Qemu KVM, this have some features: 
- **Update IP and Hostname** after clone Virtual Machine template
- **Resize Disk** Virtual Machine
- **Expose SSH** Virtual Machine (This expose random port to public)
- **Expose Service** Virtual Machine (This expose service inside Virtual Machine to public with random port)
- **Check IPs Address** already used or not
- **List All VMs** this get from database

## How to Install
Requirements:
- [Node.js](https://nodejs.org/en/download/) v22
- [npm](https://docs.npmjs.com/cli/) 10
- [git](https://pm2.keymetrics.io/)
- [Logtail](https://betterstack.com/logs)
- Database Postgres
- Redis

### Setup
- Clone this repo
- Create Tables **instances** and **users** in postgres
- 
```bash
cd kvm-ui

# Install Package
npm install

# Start Service
node index.js
```