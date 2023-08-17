const express = require('express');
const fs = require('fs').promises;
const app = express();
const port = 3000;
const axios = require('axios');
const { exec } = require('child_process');
const routes = require('./src/router');
const path = require('path');
const calculationUtils = require('./src/utils/calculations'); // Your calculation utility module


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





// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.get('/ProcessFiles', (req, res) => {

  
  async function processFilesInDataStore() {
      const folderPath = './src/store'; // Replace this with the actual folder path
      try {
          const files = await fs.readdir(folderPath);
  
          for (const fileName of files) {
              const filePath = path.join(folderPath, fileName);
              try {
                  const fileContent = await fs.readFile(filePath, 'utf-8');
                  const jsonData = JSON.parse(fileContent);
  
                  // Perform calculations and analysis
                  const altitudeArray = jsonData.logs.altitude;
                  const path = jsonData.logs.path;
  
                  jsonData.total = calculationUtils.calculateDistanceFromPath(path);
                  jsonData.elevation = calculationUtils.calculateElevationMetrics(altitudeArray);
                  jsonData.stops = calculationUtils.analyzeActivity(jsonData);
                  const { startTimestamp, endTimestamp } = calculationUtils.getStartAndEndTimestamp(jsonData);

            console.log('Start Timestamp: ' + startTimestamp);
            console.log('End Timestamp: ' + endTimestamp);
            const duration = calculationUtils.calculateDuration(startTimestamp, endTimestamp);
            jsonData.duration = {hours: duration.hours, minutes:duration.minutes};
  
                  // Write the updated data back to the file
                  await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));
              } catch (error) {
                  console.error('Error processing file:', fileName, error);
              }
          }
          console.log('Processing of all files completed.');
      } catch (error) {
          console.error('Error reading folder contents:', error);
      }
  }
  
  // Call the function to start processing files
  processFilesInDataStore();
  
  res.json(`Done`);
});

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



// Execute the command
const child = exec('tmole 3000');

// Listen for the output of the command
child.stdout.on('data', (data) => {
  const output = data;
  const searchText = "is forwarding to localhost:3000";
  
  const remainingText = output.replace(searchText, "");
  console.log(remainingText);
  url = remainingText.replace(/\n/g, "").trim(); // Remove newline characters and trim whitespaces
});

// Listen for any errors
child.on('error', (error) => {
  console.error(`Error: ${error.message}`);
});

// Listen for the command to exit
child.on('exit', (code, signal) => {
  console.log(`Command exited with code ${code} and signal ${signal}`);
});








