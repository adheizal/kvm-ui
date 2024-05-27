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

const logtailToken = config.LOGTAIL_TOKEN;
let logtail;
if (logtailToken) {
    const { Logtail } = require("@logtail/node");
    logtail = new Logtail(logtailToken);
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
            logtail.log('Authentication failed for user: ' + username);
            console.log('Authentication failed for user: ', username);
            return;
        }
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            res.status(401).send('Invalid username or password');
            logtail.log('Authentication failed for user: ' + username);
            console.log('Authentication failed for user: ', username);
            return;
        }
        // Set user session
        req.session.userId = user.id;
        res.send('Login successful');
        logtail.log('User logged in successfully: ' + username);
        console.log('User logged in successfully: ', username);
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Internal Server Error');
        logtail.error('Error during login: ' + error);
    }
});

// Middleware to check if user is already registered
async function checkUserExists(req, res, next) {
    const { username } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length > 0) {
            res.status(400).send('Username already exists');
        } else {
            next();
        }
    } catch (error) {
        console.error('Error checking user existence:', error);
        res.status(500).send('Internal Server Error');
    }
}

app.post('/register', checkUserExists, async (req, res) => {
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
    logtail.log(scriptPath)

    // Execute the shell script to update the IP address
    exec(`${scriptPath} ${osName} ${vmName} ${newIP}`, { cwd: '/tmp' }, async (error, stdout, stderr) => {
        logtail.error(error || stderr)
        console.log(`Commands executed successfully: ${stdout}`);
        logtail.log('Commands executed successfully: ' + stdout);

        try {
            // Insert the details into the database
            await pool.query('INSERT INTO instances (vm_name, ip_address, os_name) VALUES ($1, $2, $3)', [vmName, newIP, osName]);
            console.log('Instance details stored in the database');
            res.send('IP Address Updated Successfully');
            logtail.log('Instance details stored in the database: ' + pool.query);
        } catch (insertError) {
            console.error('Error storing instance details in the database:' + insertError);
            res.status(500).send('An error occurred while updating IP address');
            logtail.error('Error storing instance details in the database:' + insertError);
        }
    });
});

app.post('/resize-disk', async (req, res) => {
    const { vmName, ipAddress, newSize } = req.body;

    const scriptPath = `ssh -l ${config.SSH_USER} ${config.SSH_HOST} bash /opt/script/disk.sh`; // Update with the actual path
    logtail.log(scriptPath)

    // Execute the shell script to resize the disk
    exec(`${scriptPath} ${vmName} ${ipAddress} ${newSize}`, { cwd: '/tmp' }, async (error, stdout, stderr) => {
        if (error || stderr) {
            console.error(`Error: ${error ? error.message : stderr}`);
            logtail.log(error, stdout, stderr);
        }

        console.log(`Commands executed successfully: ${stdout}`);
        logtail.log(`Commands executed successfully: ${stdout}`);

        try {
            // Check if the instance exists in the database
            const result = await pool.query('SELECT * FROM instances WHERE vm_name = $1', [vmName]);
            console.log('Result:', result.rows);
            logtail.log('Result:' + result.rows);
        
            if (result.rows.length === 0) {
                // If the instance doesn't exist, insert it with default disk size 30 + newSize
                const currentDiskSize = 30;
                const updatedDiskSize = parseInt(currentDiskSize) + parseInt(newSize);
                await pool.query('INSERT INTO instances (vm_name, ip_address, os_name, disk_size) VALUES ($1, $2, $3, $4)', [vmName, ipAddress, '', parseInt(updatedDiskSize)]);
                console.log('New instance inserted into the database with disk size:', 30 + newSize);
                logtail.log('New instance inserted into the database with disk size:', 30 + newSize);
            } else {
                // If the instance exists, update its disk size by adding the new size
                const currentDiskSize = result.rows[0].disk_size;
                const updatedDiskSize = parseInt(currentDiskSize) + parseInt(newSize);
                console.log(typeof updatedDiskSize, typeof currentDiskSize)
                await pool.query('UPDATE instances SET disk_size = $1 WHERE vm_name = $2', [parseInt(updatedDiskSize), vmName]);
                console.log('Disk size updated in the database:', updatedDiskSize);
                logtail.log('Disk size updated in the database:' + updatedDiskSize);
            }
        
            // Send success response
            res.send('Disk resized successfully');
        } catch (insertError) {
            console.error('Error storing disk size in the database:', insertError);
            res.status(500).send('An error occurred while resizing disk');
            logtail.error('Error storing disk size in the database:' + insertError);
        }        
    });
});

app.post('/expose-ssh', async (req, res) => {
    const { ipAddress } = req.body;

    const scriptPath = `ssh -l ${config.SSH_USER} ${config.SSH_HOST} bash /opt/script/ssh.sh`; // Update with the actual path
    logtail.log(scriptPath)
    console.log(`IP Address VM ${ipAddress}`);

    // Execute the shell script to expose SSH
    exec(`${scriptPath} ${ipAddress}`, { cwd: '/tmp' }, async (error, stdout, stderr) => {

        const portMatch = stdout.match(/Random Port: (\d+)/);
        if (!portMatch) {
            console.error('Failed to extract port number from output:', stdout);
            logtail.error('Failed to extract port number from output:' + stdout)
            return res.status(500).send('Failed to extract port number from output');
        }

        const randomPort = parseInt(portMatch[1]);
        console.log(`SSH exposed successfully on port ${randomPort}`);
        logtail.log(`SSH exposed successfully on port ${randomPort}`);

        try {
            // Update the SSH port in the database
            await pool.query('UPDATE instances SET ssh_port = $1 WHERE ip_address = $2', [randomPort, ipAddress]);
            console.log('SSH port updated in the database');
            logtail.log(pool.query)
            const sshCommand = `ssh -l ${config.SSH_USER} ${config.SSH_HOST} -p ${randomPort}`;
            res.send(sshCommand);
        } catch (updateError) {
            console.error('Error updating SSH port in the database:', updateError);
            res.status(500).send('An error occurred while updating SSH port');
            logtail.error('Error updating SSH port in the database:' + updateError)
        }
    });
});


app.post('/expose-service', async (req, res) => {
    const { ipAddress, servicePort } = req.body;

    const scriptPath = `ssh -l ${config.SSH_USER} ${config.SSH_HOST} bash /opt/script/service.sh`; // Update with the actual path
    logtail.log(scriptPath)

    // Execute the shell script to expose the service
    exec(`${scriptPath} ${ipAddress} ${servicePort}`, { cwd: '/tmp' }, async (error, stdout, stderr) => {

        const portMatch = stdout.match(/Random Port: (\d+)/);
        if (!portMatch) {
            console.error('Failed to extract port number from output:', stdout);
            logtail.error('Failed to extract port number from output:' + stdout);
            return res.status(500).send('Failed to extract port number from output');
        }

        const randomPort = parseInt(portMatch[1]);
        console.log(`Service exposed successfully on port ${randomPort}`);
        logtail.log(`Service exposed successfully on port ${randomPort}`);

        try {
            // Fetch existing service ports from the database for the given IP address
            const result = await pool.query('SELECT service_ports FROM instances WHERE ip_address = $1', [ipAddress]);
            logtail.log( pool.query)

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
            logtail.log('Service ports updated in the database');

            const sshCommand = `${config.SSH_HOST}:${randomPort}`;
            res.send(sshCommand);
        } catch (updateError) {
            console.error('Error updating service ports in the database:', updateError);
            res.status(500).send('An error occurred while updating service ports');
            logtail.error('Error updating service ports in the database:' + updateError);
        }
    });
});

app.post('/check-ip', async (req, res) => {
    const { ipAddress } = req.body;
    const scriptPath = `ssh -l ${config.SSH_USER} ${config.SSH_HOST} nmap -sP -PR ${ipAddress}`; // Update with the actual path
    console.log(scriptPath)
    logtail.log(scriptPath)

    // Run the nmap command to check the IP address
    exec(`${scriptPath}`, { cwd: '/tmp' }, async (error, stdout, stderr) => {
        if (error) {
            logtail.error(`Error: ${error.message}`);
            console.error(`Error: ${error.message}`);
            return res.status(500).send('An error occurred while checking the IP address');
        }

        if (stderr) {
            logtail.warn(`stderr: ${stderr}`);
            console.warn(`stderr: ${stderr}`);
        }

        logtail.info(`nmap output: ${stdout}`);
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
        logtail.log(result.rows);
        res.json(result.rows);
    } catch (error) {
        logtail.error('Error fetching list of VMs:', error);
        console.error('Error fetching list of VMs:', error);
        res.status(500).send('An error occurred while fetching list of VMs');
    }
});

app.listen(port, () => {
    console.log(`Server is listening at http://0.0.0.0:${port}`);
    logtail?.log(`Server is listening at http://0.0.0.0:${port}`);
    logtail?.flush();
});