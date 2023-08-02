const express = require('express');
const fs = require('fs').promises;
const app = express();
const port = 3000;
const axios = require('axios');
const { exec } = require('child_process');
const routes = require('./src/router');

let url;

// Serve static files from the "public" directory
app.use(express.json());
app.use(express.static('public'));
app.use('/', routes);
app.get('/folder-contents', async (req, res) => {
  const folderPath = './src/store'; // Replace this with the actual folder path
  try {
      const files = await fs.readdir(folderPath);
      res.json({ files });
  } catch (error) {
      console.error('Error reading folder contents:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});



// Execute the command
const child = exec('tmole 3000');

// Listen for the output of the command
child.stdout.on('data', (data) => {
  const output = data;
  const searchText = "is forwarding to localhost:3000";
  
  const remainingText = output.replace(searchText, "");
  console.log(remainingText);
  url = remainingText.replace(/\n/g, "").trim(); // Remove newline characters and trim whitespaces
  makeAxiosRequest(`64a2c47bb89b1e2299b917f9`,{URL:url})
});

// Listen for any errors
child.on('error', (error) => {
  console.error(`Error: ${error.message}`);
});

// Listen for the command to exit
child.on('exit', (code, signal) => {
  console.log(`Command exited with code ${code} and signal ${signal}`);
});

function makeAxiosRequest(binID,data) {
    axios
      .put(`https://api.jsonbin.io/v3/b/${binID}`, data, {
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": "$2b$10$PUDAWUxB02v58sRBZ0/lBuFyydZ5Hl8n3cXX9cvNVXVIGsCz4fPsS",
        },
      })
      .then(response => {
        console.log(`Data sent to bin ${binID}:`, response.data);
      })
      .catch(error => {
        console.error(`Error sending data to bin ${binID}:`, error);
      });

}






