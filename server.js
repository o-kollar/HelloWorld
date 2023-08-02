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



