// app.js (Express.js backend)

const express = require('express');
const { exec } = require('child_process');
const sshClient = require('ssh2').Client;
const config = require('./config.js');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const session = require('express-session');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
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
    ssl: true
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
            return;
        }
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            res.status(401).send('Invalid username or password');
            return;
        }
        // Set user session
        req.session.userId = user.id;
        res.send('Login successful');
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/update-ip', async (req, res) => {
    const { vmName, osName, newIP } = req.body;

    const scriptPath = '~/kvm/script/update.sh';

    // Execute the shell script to update the IP address
    exec(`${scriptPath} ${osName} ${vmName} ${newIP}`, { cwd: '/tmp' }, async (error, stdout, stderr) => {
        /// if (error || stderr) {
        ///     console.error(`Error: ${error ? error.message : stderr}`);
        ///     return res.status(500).send('An error occurred while updating IP address');
        /// }

        console.log(`Commands executed successfully: ${stdout}`);

        try {
            // Insert the details into the database
            await pool.query('INSERT INTO instances (vm_name, ip_address, os_name) VALUES ($1, $2, $3)', [vmName, newIP, osName]);
            console.log('Instance details stored in the database');
            res.send('IP Address Updated Successfully');
        } catch (insertError) {
            console.error('Error storing instance details in the database:', insertError);
            res.status(500).send('An error occurred while updating IP address');
        }
    });
});

app.post('/resize-disk', async (req, res) => {
    const { vmName, ipAddress, newSize } = req.body;

    const scriptPath = `ssh -l ${config.ssh.user} ${config.ssh.host} bash /opt/script/disk.sh`; // Update with the actual path

    // Execute the shell script to resize the disk
    exec(`${scriptPath} ${vmName} ${ipAddress} ${newSize}`, { cwd: '/tmp' }, async (error, stdout, stderr) => {
        if (error || stderr) {
            console.error(`Error: ${error ? error.message : stderr}`);
            if (stderr.includes("hostname contains invalid characters")) {
                // Handle the expected error
                return res.status(200).send('Disk resized successfully');
            } else {
                return res.status(500).send('An error occurred while resizing disk');
            }
        }

        console.log(`Commands executed successfully: ${stdout}`);

        try {
            // Check if the instance exists in the database
            const result = await pool.query('SELECT * FROM instances WHERE vm_name = $1', [vmName]);
            console.log('Result:', result.rows);
        
            if (result.rows.length === 0) {
                // If the instance doesn't exist, insert it with default disk size 30 + newSize
                await pool.query('INSERT INTO instances (vm_name, ip_address, os_name, disk_size) VALUES ($1, $2, $3, $4)', [vmName, ipAddress, '', 30 + newSize]);
                console.log('New instance inserted into the database with disk size:', 30 + newSize);
            } else {
                // If the instance exists, update its disk size by adding the new size
                const currentDiskSize = result.rows[0].disk_size;
                const updatedDiskSize = currentDiskSize + newSize;
                await pool.query('UPDATE instances SET disk_size = $1 WHERE vm_name = $2', [updatedDiskSize, vmName]);
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

    const scriptPath = `ssh -l ${config.ssh.user} ${config.ssh.host} bash /opt/script/ssh.sh`; // Update with the actual path

    // Execute the shell script to expose SSH
    exec(`${scriptPath} ${ipAddress}`, { cwd: '/tmp' }, async (error, stdout, stderr) => {
        if (error || stderr) {
            console.error(`Error: ${error ? error.message : stderr}`);
            console.log('stdout:', stdout);
            console.log('stderr:', stderr);
            return res.status(500).send('An error occurred while exposing SSH');
        }

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
            res.send(randomPort.toString());
        } catch (updateError) {
            console.error('Error updating SSH port in the database:', updateError);
            res.status(500).send('An error occurred while updating SSH port');
        }
    });
});

app.post('/expose-service', async (req, res) => {
    const { ipAddress, servicePort } = req.body;

    const scriptPath = `ssh -l ${config.ssh.user} ${config.ssh.host} bash /opt/script/service.sh`; // Update with the actual path

    // Execute the shell script to expose the service
    exec(`${scriptPath} ${ipAddress} ${servicePort}`, { cwd: '/tmp' }, async (error, stdout, stderr) => {
        if (error || stderr) {
            console.error(`Error: ${error ? error.message : stderr}`);
            console.log('stdout:', stdout);
            console.log('stderr:', stderr);
            return res.status(500).send('An error occurred while exposing the service');
        }

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

            res.send(randomPort.toString());
        } catch (updateError) {
            console.error('Error updating service ports in the database:', updateError);
            res.status(500).send('An error occurred while updating service ports');
        }
    });
});

app.listen(port, () => {
    console.log(`Server is listening at http://0.0.0.0:${port}`);
});