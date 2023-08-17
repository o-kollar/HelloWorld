const express = require('express');
const router = express.Router();
const path = require('path');
const calculationUtils = require('./utils/calculations');
const fileUtils = require('./utils/data-store');
const fs = require('fs');

let fileName = 'default';

router.post('/setRoute', (req, res) => {
    fileName = req.body.route;
    res.json(`Route set to ${req.body.route}`);
});

router.post('/removeRoute', (req, res) => {
    const filePath = `./src/store/${req.body.route}`;
    fileUtils.del(filePath, (err) => {
        if (err) {
            res.status(404).json({ error: 'Could not delete' });
        } else {
            res.json(`Route ${req.body.route} was removed`);
        }
    });
});

router.get('/widget', (req, res) => {
    const filePath = `./store/${fileName}`;
    fileUtils.read(filePath, (readErr, data) => {
        if (readErr) {
            console.error('Error reading', readErr);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        const Data = data;
        res.json({ duration: Data.duration, distance: Data.total });
    });
});

router.get('/getRecord/:selected', (req, res) => {
    const selected = req.params.selected;
    const filePath = path.join(__dirname, `./store/${selected}`);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(404).json({ error: 'Record not found' });
        }

        const record = JSON.parse(data);

        if (record) {
            res.json(record);
        } else {
            res.status(404).json({ error: 'Record not found' });
        }
    });
});

router.post('/log', (req, res) => {
    console.log('Request:', req.body);
    const filePath = `./src/store/${fileName}`;
    const initialData = {
        duration: {},
        speed: 0,
        total: 0,
        elevation: 0,
        logs: {
            updated: [],
            location: [0, 0],
            altitude: [],
            path: [],
            speeds: [],
            bearings: [],
        },
    };

    fileUtils.createFileIfNotExists(filePath, initialData, (err) => {
        if (err) {
            console.error('Error creating file:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        fileUtils.read(filePath, (readErr, data) => {
            if (readErr) {
                console.error('Error reading elevation.json:', readErr);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            const Data = data || {
                duration: {},
                speed: 0,
                total: 0,
                elevation: 0,
                logs: {
                    updated: [],
                    location: [0, 0],
                    altitude: [],
                    path: [],
                    speeds: [],
                    bearings: [],
                },
            };

            // Perform calculations and update the JSON data
            const altitudeArray = Data.logs.altitude;
            const path = Data.logs.path;
            const { startTimestamp, endTimestamp } = calculationUtils.getStartAndEndTimestamp(Data);

            console.log('Start Timestamp: ' + startTimestamp);
            console.log('End Timestamp: ' + endTimestamp);
            const duration = calculationUtils.calculateDuration(startTimestamp, endTimestamp);
            Data.duration = {hours: duration.hours, minutes:duration.minutes};

            // Calculate and store the new speed and bearing values
            const newSpeed = parseFloat(req.body.speed);
            const newBearing = parseFloat(req.body.bearing);
            Data.logs.speeds.push(newSpeed);
            Data.logs.bearings.push(newBearing);

            Data.speed = calculationUtils.calculateAverageSpeed(Data.logs.speeds);
            console.log('Average speed: ' + Data.speed + ' km/h');
            const averageBearing = calculationUtils.calculateAverageBearing(Data.logs.bearings);
            console.log('Average Bearing:', averageBearing);

            Data.total = calculationUtils.calculateDistanceFromPath(path);
            Data.elevation = calculationUtils.calculateElevationMetrics(altitudeArray);
            Data.stops = calculationUtils.analyzeActivity(data);
            // Add new altitude values to the arrays
            const formattedFloat = parseFloat(req.body.altitude);
            altitudeArray.push(formattedFloat);
            Data.logs.updated.push(req.body.time);
            Data.logs.path.push([req.body.lon, req.body.lat]);
            Data.logs.location = [req.body.lon, req.body.lat];

            // Write the updated data back to the elevation.json file
            fileUtils.store(filePath, Data, (writeErr) => {
                if (writeErr) {
                    console.error('Error writing elevation.json:', writeErr);
                    return res.status(500).json({ error: 'Internal Server Error' });
                } else {
                    console.log('Data has been stored in elevation.json');
                    // Send the response to the client
                    res.json(req.body);
                }
            });
        });
    });
});

module.exports = router;
