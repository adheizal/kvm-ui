// app.js (Express.js backend)

const express = require('express');
const { exec } = require('child_process');
const sshClient = require('ssh2').Client;

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

app.post('/update-ip', (req, res) => {
    const { vmName, osName, newIP } = req.body;

    const scriptPath = './script/update.sh'; // Update with the actual path

    exec(`${scriptPath} ${osName} ${vmName} ${newIP}`, { cwd: '/tmp' }, (error, stdout, stderr) => {
        if (error || stderr) {
            console.error(`Error: ${error ? error.message : stderr}`);
            return res.status(500).send('Error updating IP address');
        }
        console.log(`Commands executed successfully: ${stdout}`);
        res.send('IP Address Updated and VM Rebooting');
    });
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
