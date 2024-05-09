// app.js (Express.js backend)

const express = require('express');
const { exec } = require('child_process');
const sshClient = require('ssh2').Client;
const config = require('./config.js');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

app.post('/update-ip', (req, res) => {
    const { vmName, osName, newIP } = req.body;

    const scriptPath = '~/kvm/script/update-ip.sh';

    exec(`${scriptPath} ${vmName} ${osName} ${newIP}`, { cwd: '/tmp' }, (error, stdout, stderr) => {
        if (error || stderr) {
            console.error(`Error: ${error ? error.message : stderr}`);
            return res.status(500).send('An error occurred while updating IP address');
        }
        console.log(`Commands executed successfully: ${stdout}`);
        res.send('IP Address Updated Successfully');
    });
});

app.post('/resize-disk', (req, res) => {
    const { vmName, ipAddress , newSize } = req.body;

    const scriptPath = '~/kvm/script/disk.sh'; // Update with the actual path

    exec(`${scriptPath} ${vmName} ${ipAddress} ${newSize}`, { cwd: '/tmp' }, (error, stdout, stderr) => {
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
        res.send('Disk resized successfully');
    });
});

app.post('/expose-ssh', (req, res) => {
    const { ipAddress } = req.body;

    const scriptPath = `ssh -l ${config.ssh.user} ${config.ssh.host} bash /opt/script/ssh.sh`; // Update with the actual path

    exec(`${scriptPath} ${ipAddress}`, { cwd: '/tmp' }, (error, stdout, stderr) => {
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
        res.send(randomPort.toString());
    });
});

app.post('/expose-service', (req, res) => {
    const { ipAddress, servicePort } = req.body;

    const scriptPath = `ssh -l ${config.ssh.user} ${config.ssh.host} bash /opt/script/service.sh`; // Update with the actual path

    exec(`${scriptPath} ${ipAddress} ${servicePort}`, { cwd: '/tmp' }, (error, stdout, stderr) => {
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
        res.send(randomPort.toString());
    });
});


app.listen(port, () => {
    console.log(`Server is listening at http://0.0.0.0:${port}`);
});