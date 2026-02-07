import { Router } from 'express';
import { vmController } from '@/controllers/vm.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
  updateIPSchema,
  deleteIPSchema,
  resizeDiskSchema,
  exposeSSHSchema,
  exposeServiceSchema,
  checkIPSchema,
} from '@/validators/vm.validator';

const router = Router();

// All VM routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/vm/update-ip:
 *   post:
 *     summary: Update VM IP address
 *     tags: [VM Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vmName
 *               - osName
 *               - newIP
 *             properties:
 *               vmName:
 *                 type: string
 *                 example: vm-ubuntu-01
 *               osName:
 *                 type: string
 *                 example: ubuntu22
 *               newIP:
 *                 type: string
 *                 format: ipv4
 *                 example: 192.168.1.100
 *     responses:
 *       200:
 *         description: IP updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       409:
 *         description: Data already exists or operation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     x-websocket-events:
 *       - vm:progress
 *       - vm:operation:complete
 *       - vm:list:updated
 */
router.post('/update-ip', validate(updateIPSchema), vmController.updateIP);

/**
 * @swagger
 * /api/vm/delete-ip:
 *   delete:
 *     summary: Delete VM record
 *     tags: [VM Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vmName
 *             properties:
 *               vmName:
 *                 type: string
 *                 example: vm-ubuntu-01
 *     responses:
 *       200:
 *         description: VM deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: VM not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     x-websocket-events:
 *       - vm:progress
 *       - vm:operation:complete
 *       - vm:deleted
 *       - vm:list:updated
 */
router.delete('/delete-ip', validate(deleteIPSchema), vmController.deleteIP);

/**
 * @swagger
 * /api/vm/resize-disk:
 *   post:
 *     summary: Resize VM disk
 *     tags: [VM Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vmName
 *               - ipAddress
 *               - newSize
 *             properties:
 *               vmName:
 *                 type: string
 *                 example: vm-ubuntu-01
 *               ipAddress:
 *                 type: string
 *                 format: ipv4
 *                 example: 192.168.1.100
 *               newSize:
 *                 type: integer
 *                 description: Size to add in GB
 *                 example: 10
 *     responses:
 *       200:
 *         description: Disk resized successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       500:
 *         description: Resize operation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     x-websocket-events:
 *       - vm:progress
 *       - vm:operation:complete
 *       - vm:list:updated
 */
router.post('/resize-disk', validate(resizeDiskSchema), vmController.resizeDisk);

/**
 * @swagger
 * /api/vm/expose-ssh:
 *   post:
 *     summary: Expose VM SSH port to public
 *     tags: [VM Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ipAddress
 *             properties:
 *               ipAddress:
 *                 type: string
 *                 format: ipv4
 *                 example: 192.168.1.100
 *     responses:
 *       200:
 *         description: SSH exposed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 command:
 *                   type: string
 *                   example: ssh -l root example.com -p 2222
 *       500:
 *         description: Failed to expose SSH
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     x-websocket-events:
 *       - vm:progress
 *       - vm:operation:complete
 *       - vm:list:updated
 */
router.post('/expose-ssh', validate(exposeSSHSchema), vmController.exposeSSH);

/**
 * @swagger
 * /api/vm/expose-service:
 *   post:
 *     summary: Expose VM service port to public
 *     tags: [VM Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ipAddress
 *               - servicePort
 *             properties:
 *               ipAddress:
 *                 type: string
 *                 format: ipv4
 *                 example: 192.168.1.100
 *               servicePort:
 *                 type: integer
 *                 example: 8080
 *     responses:
 *       200:
 *         description: Service exposed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: example.com:3000
 *       500:
 *         description: Failed to expose service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     x-websocket-events:
 *       - vm:progress
 *       - vm:operation:complete
 *       - vm:list:updated
 */
router.post('/expose-service', validate(exposeServiceSchema), vmController.exposeService);

/**
 * @swagger
 * /api/vm/check-ip:
 *   post:
 *     summary: Check if IP address is available
 *     tags: [VM Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ipAddress
 *             properties:
 *               ipAddress:
 *                 type: string
 *                 format: ipv4
 *                 example: 192.168.1.100
 *     responses:
 *       200:
 *         description: IP status checked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [IP Already Used, IP Available]
 *                   example: IP Available
 *       500:
 *         description: Failed to check IP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/check-ip', validate(checkIPSchema), vmController.checkIP);

/**
 * @swagger
 * /api/vm/list:
 *   get:
 *     summary: Get list of all VMs from database
 *     tags: [VM Management]
 *     responses:
 *       200:
 *         description: List of VMs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: vm-ubuntu-01
 *                   ip:
 *                     type: string
 *                     format: ipv4
 *                     example: 192.168.1.100
 *                   status:
 *                     type: string
 *                     example: running
 *                   ssh_port:
 *                     type: integer
 *                     nullable: true
 *                     example: 2222
 *                   service_ports:
 *                     type: string
 *                     nullable: true
 *                     example: "3000,8080"
 *                   disk_size:
 *                     type: integer
 *                     nullable: true
 *                     example: 40
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     example: 2024-01-01T00:00:00.000Z
 *                   in_database:
 *                     type: boolean
 *                     example: true
 *       500:
 *         description: Failed to fetch VM list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/list', vmController.listVMs);

/**
 * @swagger
 * /api/vm/list-live:
 *   get:
 *     summary: Get live list of all VMs from virsh (including unmanaged VMs)
 *     tags: [VM Management]
 *     responses:
 *       200:
 *         description: Live VM list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: vm-ubuntu-01
 *                   status:
 *                     type: string
 *                     enum: [running, stopped]
 *                   in_database:
 *                     type: boolean
 *                     description: Whether VM exists in database
 *                     example: false
 *                   ip:
 *                     type: string
 *                     nullable: true
 *                     example: 192.168.1.100
 *                   ssh_port:
 *                     type: integer
 *                     nullable: true
 *                   service_ports:
 *                     type: string
 *                     nullable: true
 *                   created_at:
 *                     type: string
 *                     nullable: true
 *       500:
 *         description: Failed to fetch live VM list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/list-live', vmController.listVMsLive);

/**
 * @swagger
 * /api/vm/start:
 *   post:
 *     summary: Start a virtual machine
 *     tags: [VM Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vmName
 *             properties:
 *               vmName:
 *                 type: string
 *                 example: vm-ubuntu-01
 *     responses:
 *       200:
 *         description: VM started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       500:
 *         description: Failed to start VM
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     x-websocket-events:
 *       - vm:progress
 *       - vm:operation:complete
 *       - vm:status
 *       - vm:list:updated
 */
router.post('/start', vmController.startVM);

/**
 * @swagger
 * /api/vm/stop:
 *   post:
 *     summary: Stop a virtual machine
 *     tags: [VM Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vmName
 *             properties:
 *               vmName:
 *                 type: string
 *                 example: vm-ubuntu-01
 *     responses:
 *       200:
 *         description: VM stopped successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       500:
 *         description: Failed to stop VM
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     x-websocket-events:
 *       - vm:progress
 *       - vm:operation:complete
 *       - vm:status
 *       - vm:list:updated
 */
router.post('/stop', vmController.stopVM);

export default router;
