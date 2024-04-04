// app.js (Express.js backend)

const express = require('express');
const { exec } = require('child_process');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

app.post('/update-ip', (req, res) => {
    const { vmName, newIP } = req.body;
    // Execute command to update IP address
    exec(`command_to_update_ip ${vmName} ${newIP}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).send('Internal Server Error');
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(400).send('Bad Request');
        }
        console.log(`stdout: ${stdout}`);
        res.send('IP Address Updated');
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
