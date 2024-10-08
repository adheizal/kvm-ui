// app.js (Express.js backend)

const express = require('express');
const { exec } = require('child_process');
const sshClient = require('ssh2').Client;
const config = require('./config.js');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const Redis = require('ioredis');
const { Pool } = require('pg');

const hyperdxApiKey = config.HYPERDX_API_KEY;

let HyperDX;
if (hyperdxApiKey) {
    HyperDX = require('@hyperdx/node-opentelemetry');
    HyperDX.init({
        apiKey: hyperdxApiKey,
        service: 'kvm-ui'
    });
}

const app = express();
const port = 3000;

// Redis client
const redisUri = `rediss://${config.REDIS_USER}:${config.REDIS_PASSWORD}@${config.REDIS_HOST}:${config.REDIS_PORT}`
const redis = new Redis(redisUri);

redis.on('error', (err) => {
    console.error('Redis error:', err);
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    store: new RedisStore({ client: redis }),
    secret: config.SECRET,
    resave: false,
    saveUninitialized: false
}));

// PostgreSQL connection
const pool = new Pool({
    user: config.DB_USER,
    host: config.DB_HOST,
    database: config.DB_NAME,
    password: config.DB_PASSWORD,
    port: config.DB_PORT,
    ssl: config.DB_SSL === 'true' ? true : false, 
    //ssl: true,
    connectionTimeoutMillis: 10000, // connection timeout in milliseconds
    idleTimeoutMillis: 10000 // idle timeout in milliseconds
});

app.use(express.static('public'));
app.use(express.json());

// Middleware to check if user is authenticated
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            res.status(401).send('Invalid username or password');
            console.log('Authentication failed for user: ', username);
            return;
        }
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            res.status(401).send('Invalid username or password');
            console.log('Authentication failed for user: ', username);
            return;
        }
        // Set user session
        req.session.userId = user.id;
        res.send('Login successful');
        console.log('User logged in successfully: ', username);
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Internal Server Error');
        }
        res.send('Logout successful');
    });
});

// Session status route
app.get('/session-status', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true });
    } else {
        res.json({ loggedIn: false });
    }
});

// Middleware for authentication
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    } else {
        res.status(401).send('Unauthorized');
    }
}

// Middleware to check if the user limit is reached or if the username already exists
async function checkUserLimitAndExists(req, res, next) {
    const { username } = req.body;
    try {
        const userCountResult = await pool.query('SELECT COUNT(*) FROM users');
        const userCount = parseInt(userCountResult.rows[0].count, 10);

        if (userCount > 0) {
            return res.status(403).send('User registration is closed');
        }

        const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userResult.rows.length > 0) {
            return res.status(400).send('Username already exists');
        }

        next();
    } catch (error) {
        console.error('Error checking user existence:', error);
        res.status(500).send('Internal Server Error');
    }
}

app.post('/register', checkUserLimitAndExists, async (req, res) => {
    const { username, password } = req.body;
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);
        
        res.status(201).send('User created successfully');
    } catch (error) {
        console.error('Error during user creation:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/update-ip', async (req, res) => {
    const { vmName, osName, newIP } = req.body;

    const scriptPath = `ssh -l ${config.SSH_USER} ${config.SSH_HOST} bash /opt/script/update.sh`;

    // Execute the shell script to update the IP address
    exec(`${scriptPath} ${osName} ${vmName} ${newIP}`, { cwd: '/tmp' }, async (error, stdout, stderr) => {
        console.log(`Commands executed successfully: ${stdout}`);

        try {
            // Check if the instance already exists in the database
            const { rowCount } = await pool.query('SELECT 1 FROM instances WHERE vm_name = $1 AND os_name = $2 OR ip_address = $3', [vmName, osName, newIP]);

            if (rowCount > 0) {
                res.status(409).send('Data already exists');
                console.log('Instance details already exist in the database');
                return;
            }

            // Insert the details into the database
            await pool.query('INSERT INTO instances (vm_name, ip_address, os_name) VALUES ($1, $2, $3)', [vmName, newIP, osName]);
            console.log('Instance details stored in the database');
            res.send('IP Address Updated Successfully');
        } catch (insertError) {
            console.error('Error storing instance details in the database:' + insertError);
            res.status(500).send('An error occurred while updating IP address');
        }
    });
});

// Delete Record VMs
app.delete('/delete-ip', isAuthenticated, async (req, res) => {
    const { vmName } = req.body;
    try {
        const result = await pool.query(
            'DELETE FROM instances WHERE vm_name = $1',
            [vmName]
        );
        console.log(result)
        if (result.rowCount > 0) {
            res.status(200).send('Instance deleted successfully');
        } else {
            res.status(404).send('Instance not found');
        }
    } catch (error) {
        console.error('Error deleting instance:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/resize-disk', async (req, res) => {
    const { vmName, ipAddress, newSize } = req.body;

    const scriptPath = `ssh -l ${config.SSH_USER} ${config.SSH_HOST} bash /opt/script/disk.sh`; // Update with the actual path

    // Execute the shell script to resize the disk
    exec(`${scriptPath} ${vmName} ${ipAddress} ${newSize}`, { cwd: '/tmp' }, async (error, stdout, stderr) => {
        if (error || stderr) {
            console.error(`Error: ${error ? error.message : stderr}`);
        }

        console.log(`Commands executed successfully: ${stdout}`);

        try {
            // Check if the instance exists in the database
            const result = await pool.query('SELECT * FROM instances WHERE vm_name = $1', [vmName]);
            console.log('Result:', result.rows);
        
            if (result.rows.length === 0) {
                // If the instance doesn't exist, insert it with default disk size 30 + newSize
                const currentDiskSize = 30;
                const updatedDiskSize = parseInt(currentDiskSize) + parseInt(newSize);
                await pool.query('INSERT INTO instances (vm_name, ip_address, os_name, disk_size) VALUES ($1, $2, $3, $4)', [vmName, ipAddress, '', parseInt(updatedDiskSize)]);
                console.log('New instance inserted into the database with disk size:', 30 + newSize);
            } else {
                // If the instance exists, update its disk size by adding the new size
                const currentDiskSize = result.rows[0].disk_size;
                const updatedDiskSize = parseInt(currentDiskSize) + parseInt(newSize);
                console.log(typeof updatedDiskSize, typeof currentDiskSize)
                await pool.query('UPDATE instances SET disk_size = $1 WHERE vm_name = $2', [parseInt(updatedDiskSize), vmName]);
                console.log('Disk size updated in the database:', updatedDiskSize);
            }
        
            // Send success response
            res.send('Disk resized successfully');
        } catch (insertError) {
            console.error('Error storing disk size in the database:', insertError);
            res.status(500).send('An error occurred while resizing disk');
        }        
    });
});

app.post('/expose-ssh', async (req, res) => {
    const { ipAddress } = req.body;

    const scriptPath = `ssh -l ${config.SSH_USER} ${config.SSH_HOST} bash /opt/script/ssh.sh`; // Update with the actual path
    console.log(`IP Address VM ${ipAddress}`);

    // Execute the shell script to expose SSH
    exec(`${scriptPath} ${ipAddress}`, { cwd: '/tmp' }, async (error, stdout, stderr) => {

        const portMatch = stdout.match(/Random Port: (\d+)/);
        if (!portMatch) {
            console.error('Failed to extract port number from output:', stdout);
            return res.status(500).send('Failed to extract port number from output');
        }

        const randomPort = parseInt(portMatch[1]);
        console.log(`SSH exposed successfully on port ${randomPort}`);

        try {
            // Update the SSH port in the database
            await pool.query('UPDATE instances SET ssh_port = $1 WHERE ip_address = $2', [randomPort, ipAddress]);
            console.log('SSH port updated in the database');
            const sshCommand = `ssh -l ${config.SSH_USER} ${config.SSH_HOST} -p ${randomPort}`;
            res.send(sshCommand);
        } catch (updateError) {
            console.error('Error updating SSH port in the database:', updateError);
            res.status(500).send('An error occurred while updating SSH port');
        }
    });
});


app.post('/expose-service', async (req, res) => {
    const { ipAddress, servicePort } = req.body;

    const scriptPath = `ssh -l ${config.SSH_USER} ${config.SSH_HOST} bash /opt/script/service.sh`; // Update with the actual path

    // Execute the shell script to expose the service
    exec(`${scriptPath} ${ipAddress} ${servicePort}`, { cwd: '/tmp' }, async (error, stdout, stderr) => {

        const portMatch = stdout.match(/Random Port: (\d+)/);
        if (!portMatch) {
            console.error('Failed to extract port number from output:', stdout);
            return res.status(500).send('Failed to extract port number from output');
        }

        const randomPort = parseInt(portMatch[1]);
        console.log(`Service exposed successfully on port ${randomPort}`);

        try {
            // Fetch existing service ports from the database for the given IP address
            const result = await pool.query('SELECT service_ports FROM instances WHERE ip_address = $1', [ipAddress]);

            let servicePorts = [];
            if (result.rows.length > 0) {
                // If there are existing service ports, parse them from the database
                servicePorts = result.rows[0].service_ports ? result.rows[0].service_ports.split(',') : [];
            }

            // Add the newly exposed port to the list of service ports
            servicePorts.push(randomPort);

            // Update the service_ports column in the database
            await pool.query('UPDATE instances SET service_ports = $1 WHERE ip_address = $2', [servicePorts.join(','), ipAddress]);
            console.log('Service ports updated in the database');

            const sshCommand = `${config.SSH_HOST}:${randomPort}`;
            res.send(sshCommand);
        } catch (updateError) {
            console.error('Error updating service ports in the database:', updateError);
            res.status(500).send('An error occurred while updating service ports');
        }
    });
});

app.post('/check-ip', async (req, res) => {
    const { ipAddress } = req.body;
    const scriptPath = `ssh -l ${config.SSH_USER} ${config.SSH_HOST} nmap -sP -PR ${ipAddress}`; // Update with the actual path
    console.log(scriptPath)

    // Run the nmap command to check the IP address
    exec(`${scriptPath}`, { cwd: '/tmp' }, async (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).send('An error occurred while checking the IP address');
        }

        if (stderr) {
            console.warn(`stderr: ${stderr}`);
        }

        console.info(`nmap output: ${stdout}`);

        // Check if the IP address is up or down
        if (stdout.includes('Host is up')) {
            res.send('IP Already Used');
        } else if (stdout.includes('Host seems down')) {
            res.send('IP Available');
        } else {
            res.send('Unable to determine IP status');
        }
    });
});

app.get('/list-vms', async (req, res) => {
    try {
        const result = await pool.query('SELECT vm_name, ip_address, ssh_port, service_ports FROM public.instances');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching list of VMs:', error);
        res.status(500).send('An error occurred while fetching list of VMs');
    }
});

if (HyperDX) {
    HyperDX.setupExpressErrorHandler(app);
}

app.listen(port, () => {
    console.log(`Server is listening at http://0.0.0.0:${port}`);
});