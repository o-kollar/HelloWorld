const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
let fileName = 'default';

// Use the 'express.json' middleware to parse JSON data from the request body
router.use(express.json());




router.post('/log', (req, res) => {
    console.log(req.body);

    // Check if the file exists in req.body.name
    if (!fileName || typeof fileName !== 'string') {
        return res.status(400).json({ error: 'Invalid file name provided' });
    }

    const filePath = `./public/routes/${fileName}`;

    // Read data from elevation.json file
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // If the file doesn't exist, create an empty elevation.json file
                const initialData = {
                    dates: {
                        today: {
                            data: {
                                altitude: [],
                                labels: [],
                                path: [],
                                location: [0, 0],
                            },
                            duration: '0h 0m',
                            speed: 0,
                            total: 0,
                            upDown: 0,
                        },
                    },
                };

                fs.writeFile(filePath, JSON.stringify(initialData, null, 2), 'utf8', (err) => {
                    if (err) {
                        console.error('Error creating elevation.json:', err);
                        return res.status(500).json({ error: 'Internal Server Error' });
                    }
                    console.log('elevation.json created');
                    proceedWithDataUpdate(filePath, req, res);
                });
            } else {
                console.error('Error reading elevation.json:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
        } else {
            proceedWithDataUpdate(filePath, req, res);
        }
    });
});

function proceedWithDataUpdate(filePath, req, res) {
    // The rest of the code remains unchanged
    console.log(req.body);

    // Read data from elevation.json file
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading elevation.json:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // Parse the JSON data from elevation.json
        const elevationData = JSON.parse(data);

        // Access the "altitude" and "labels" arrays inside the "data" object
        const altitudeArray = elevationData.dates.today.data.altitude;
        const timeArray = elevationData.dates.today.data.labels;
        const path = elevationData.dates.today.data.path;
        const { startTimestamp, endTimestamp } = getStartAndEndTimestamp(elevationData);

        console.log('Start Timestamp: ' + startTimestamp);
        console.log('End Timestamp: ' + endTimestamp);
        const duration = calculateDuration(startTimestamp, endTimestamp);
        elevationData.dates.today.duration = `${duration.hours}h ${duration.minutes}m`;

        elevationData.dates.today.speed = calculateSpeed(elevationData);
        console.log('Average speed: ' + elevationData.dates.today.speed + ' km/h');
        elevationData.dates.today.total = calculateDistanceFromPath(path);
        elevationData.dates.today.upDown = calculateAverageDifference(altitudeArray);

        // Add new altitude values to the arrays
        const formattedFloat = parseFloat(req.body.altitude);
        altitudeArray.push(formattedFloat);
        timeArray.push(req.body.date);
        path.push([req.body.longitude,req.body.latitude]);

        elevationData.dates.today.data.location = [req.body.longitude, req.body.latitudeg];

        // Convert the updated JSON data back to a string
        const updatedData = JSON.stringify(elevationData, null, 2);

        // Write the updated data back to the elevation.json file
        fs.writeFile(filePath, updatedData, 'utf8', (err) => {
            if (err) {
                console.error('Error writing elevation.json:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            } else {
                console.log('Data has been stored in elevation.json');
                // Send the response to the client
                res.json(req.body);
            }
        });
    });
}

router.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'Admin', 'index.html'));
});

router.post('/admin/createRoute', (req, res) => {
    fileName = req.body.file
    res.json(`New Trip ${req.body.file} Creater`)
  });


router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = router;

function calculateDistanceFromPath(path) {
    if (!Array.isArray(path) || path.length < 2) {
        return null
    }

    function toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    const R = 6371; // Earth's radius in kilometers
    let totalDistance = 0;

    for (let i = 1; i < path.length; i++) {
        const [lat1, lon1] = path[i - 1].map(parseFloat);
        const [lat2, lon2] = path[i].map(parseFloat);

        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        totalDistance += distance;
    }

    return totalDistance.toFixed(2);
}

function calculateAverageDifference(altitudeArray) {
    const firstAltitude = altitudeArray[0];
    const lastAltitude = altitudeArray[altitudeArray.length - 1];
    const totalDifference = lastAltitude - firstAltitude;
    return totalDifference.toFixed(2); // Round the result to two decimal places
}

function calculateSpeed(data) {
  const location = data.dates.today.data.path;
  const timestamps = data.dates.today.data.labels;
  const speeds = data.dates.today.data.speed;

  // Check if all arrays have the same length and are not empty
  if (
    location.length === 0 ||
    location.length !== timestamps.length 
  ) {
    return "0.00"; // Return 0 km/h when the data is not available or not consistent
  }

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  let totalDistance = 0;
  let totalTime = 0;

  // Loop through the location data to calculate total distance and total time
  for (let i = 0; i < location.length - 1; i++) {
    const lat1 = parseFloat(location[i][1]);
    const lon1 = parseFloat(location[i][0]);
    const lat2 = parseFloat(location[i + 1][1]);
    const lon2 = parseFloat(location[i + 1][0]);
    const distance = calculateDistance(lat1, lon1, lat2, lon2);

    const time1 = new Date(timestamps[i]).getTime();
    const time2 = new Date(timestamps[i + 1]).getTime();
    const timeDiff = (time2 - time1) / 1000; // Convert to seconds

    totalDistance += distance;
    totalTime += timeDiff;
    console.log('total-Distance',totalDistance)
    console.log('totalTime',totalTime) // Multiply timeDiff by the speed value
  }

  // Calculate average speed in kilometers per hour (km/h)
  if (totalTime === 0 || totalDistance === 0) {
    return "0.00"; // Standing still or no distance covered, so speed is 0 km/h
  } else {
    const averageSpeed = (totalDistance / totalTime) * 3600;
    return averageSpeed.toFixed(2);
  }
}


function getStartAndEndTimestamp(data) {
    const timestamps = data.dates.today.data.labels;
    let startTime, endTime;

    // Find the first non-empty timestamp (start time)
    for (const timestamp of timestamps) {
        if (timestamp !== '0') {
            startTime = timestamp;
            break;
        }
    }

    // Find the last non-empty timestamp (end time)
    for (let i = timestamps.length - 1; i >= 0; i--) {
        if (timestamps[i] !== '0') {
            endTime = timestamps[i];
            break;
        }
    }

    return {
        startTimestamp: startTime,
        endTimestamp: endTime,
    };
}

function calculateDuration(startTimestamp, endTimestamp) {
    const startDate = new Date(startTimestamp);
    const endDate = new Date(endTimestamp);

    // Calculate the difference in milliseconds
    const durationInMilliseconds = endDate.getTime() - startDate.getTime();

    // Convert duration to hours, minutes, and seconds
    const hours = Math.floor(durationInMilliseconds / 3600000); // 1 hour = 3600000 milliseconds
    const minutes = Math.floor((durationInMilliseconds % 3600000) / 60000); // 1 minute = 60000 milliseconds
    
    return {
        hours: hours,
        minutes: minutes,
    };
}
