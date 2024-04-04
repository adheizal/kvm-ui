// app.js (Express.js backend)

const express = require('express');
const { exec } = require('child_process');
const sshClient = require('ssh2').Client;

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

app.post('/update-ip', (req, res) => {
    const { vmName, newIP } = req.body;
    const vmIP = '10.0.1.254'; // Replace with actual VM IP

    // SSH commands to update IP address
    const updateCommands = [
        `hostnamectl set-hostname ${vmName}`,
        `sudo sed -i 's/${vmIP}/${newIP}/' /etc/netplan/50-cloud-init.yaml`,
        `sudo netplan apply`
    ];

    const conn = new sshClient();
    conn.on('ready', () => {
        console.log('SSH Connection established');
        executeCommand(0);
    }).connect({
        host: vmIP,
        username: 'root',
        privateKey: require('fs').readFileSync('./.ssh/id_rsa')
    });

    const executeCommand = (index) => {
        if (index < updateCommands.length) {
            conn.exec(updateCommands[index], (err, stream) => {
                if (err) {
                    console.error(`Error executing command: ${err.message}`);
                    return res.status(500).send('Internal Server Error');
                }
                stream.on('close', (code, signal) => {
                    console.log(`Command ${updateCommands[index]} exited with code ${code}`);
                    executeCommand(index + 1);
                }).on('data', (data) => {
                    console.log(`STDOUT: ${data}`);
                }).stderr.on('data', (data) => {
                    console.error(`STDERR: ${data}`);
                    return res.status(400).send('Bad Request');
                });
            });
        } else {
            console.log('All commands executed successfully');
            // Reboot the VM
            conn.exec('sudo reboot', (err, stream) => {
                if (err) {
                    console.error(`Error executing reboot command: ${err.message}`);
                    return res.status(500).send('Internal Server Error');
                }
                console.log('Reboot command executed successfully');
                res.send('IP Address Updated and VM Rebooting');
            });
        }
    };
});

app.post('/resize-disk', (req, res) => {
    const { vmName, newSize } = req.body;
    // Execute command to resize disk
    exec(`command_to_resize_disk ${vmName} ${newSize}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).send('Internal Server Error');
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(400).send('Bad Request');
        }
        console.log(`stdout: ${stdout}`);
        res.send('Disk Resized');
    });
});

app.listen(port, () => {
    console.log(`Server is listening at http://0.0.0.0:${port}`);
});
