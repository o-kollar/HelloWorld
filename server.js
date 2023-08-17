const express = require('express');
const fs = require('fs').promises;
const app = express();
const port = 3000;
const routes = require('./src/router');
const path = require('path');

let url;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
// Serve static files from the "public" directory
app.use(express.json());
app.use(express.static('public'));
app.use('/', routes);
app.get('/folder-contents', async (req, res) => {
  const folderPath = './src/store'; // Replace this with the actual folder path
  try {
      const files = await fs.readdir(folderPath);
      let totalSum = 0; // Initialize the sum of total values
      let fastestSpeed = 0;
       // Initialize the fastest speed

      const fileData = await Promise.all(files.map(async (fileName) => {
          const filePath = path.join(folderPath, fileName);
          try {
              const fileContent = await fs.readFile(filePath, 'utf-8');
              const jsonData = JSON.parse(fileContent);

              // Extract desired data from the JSON object
              const duration = jsonData.duration;
              const total = parseFloat(jsonData.total); // Convert total to a number
              const firstLogUpdate = jsonData.logs.updated[0];
              const speeds = jsonData.logs.speeds;

              // Calculate the fastest speed
              const maxSpeed = Math.max(...speeds);
              if (maxSpeed > fastestSpeed) {
                  fastestSpeed = maxSpeed;
              }

              // Add the total value to the sum
              totalSum += total;

              return { fileName, duration, total, firstLogUpdate };
          } catch (error) {
              console.error('Error processing file:', fileName, error);
              return null;
          }
      }));

      const validFileData = fileData.filter(data => data !== null);

      res.json({ files: validFileData, totalSum, fastestSpeed });
  } catch (error) {
      console.error('Error reading folder contents:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});



