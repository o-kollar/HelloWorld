function calculateTimeSpent(abc) {
    const timestamps = abc.updated;
    const speeds = abc.speed;

    let movingTime = 0;
    let inactiveTime = 0;

    for (let i = 0; i < speeds.length; i++) {
        const speed = parseFloat(speeds[i]);
        
        if (speed > 1) {  // Assuming that a speed greater than 1 indicates movement
            if (i > 0) {
                const prevTimestamp = new Date(timestamps[i - 1]);
                const currentTimestamp = new Date(timestamps[i]);
                movingTime += currentTimestamp - prevTimestamp;
            }
        } else {
            if (i > 0) {
                const prevTimestamp = new Date(timestamps[i - 1]);
                const currentTimestamp = new Date(timestamps[i]);
                inactiveTime += currentTimestamp - prevTimestamp;
            }
        }
    }
    return { movingTime, inactiveTime };
}


   
    
function formatTime(milliseconds) {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    return { hours: hours.toString(), minutes: minutes.toString() };
}  


   
  
    
function separateLogsByTimeGap(logsArray) {
    const timeGapThreshold = 10 * 60 * 1000; // 10 minutes in milliseconds
    const separatedLogs = [];
    let currentPart = [];

    for (let i = 0; i < logsArray.length - 1; i++) {
        const currentTime = new Date(logsArray[i]);
        const nextTime = new Date(logsArray[i + 1]);

        if (nextTime - currentTime > timeGapThreshold) {
            if (currentPart.length > 0) {
                separatedLogs.push({ start: currentPart[0], end: currentPart[currentPart.length - 1] });
            }
            currentPart = [];
        }

        currentPart.push(logsArray[i]);
    }

    if (currentPart.length > 0) {
        separatedLogs.push({ start: currentPart[0], end: currentPart[currentPart.length - 1] });
    }

    return separatedLogs;
}


function calculateDistance(lat1, lon1, lat2, lon2) {
    const earthRadius = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c; // Distance in kilometers
    return distance;
}

function separateLogsByTimeGapAndCalculateDistance(logsArray, locationArray) {
    const timeGapThreshold = 10 * 60 * 1000; // 10 minutes in milliseconds
    const separatedLogs = [];
    let currentPart = [];
    let totalDistance = 0;

    for (let i = 0; i < logsArray.length - 1; i++) {
        const currentTime = new Date(logsArray[i]);
        const nextTime = new Date(logsArray[i + 1]);

        const [lat1, lon1] = locationArray[i].map(parseFloat);
        const [lat2, lon2] = locationArray[i + 1].map(parseFloat);

        const distance = calculateDistance(lat1, lon1, lat2, lon2);

        if (nextTime - currentTime > timeGapThreshold) {
            if (currentPart.length > 0) {
                separatedLogs.push({ start: currentPart[0], end: currentPart[currentPart.length - 1], distance: totalDistance });
                totalDistance = 0;
            }
            currentPart = [];
        }

        currentPart.push(logsArray[i]);
        totalDistance += distance;
    }

    if (currentPart.length > 0) {
        separatedLogs.push({ start: currentPart[0], end: currentPart[currentPart.length - 1], distance: totalDistance });
    }
    return separatedLogs;
}

function getHighestAltitudePoint(altitudes, locations) {
    let highestAltitude = -Infinity;
    let highestAltitudeIndex = -1;
  
    // Find the index of the highest altitude
    for (let i = 0; i < altitudes.length; i++) {
      const altitude = parseFloat(altitudes[i]);
  
      if (!isNaN(altitude) && altitude > highestAltitude) {
        highestAltitude = altitude;
        highestAltitudeIndex = i;
      }
    }
  
    // Retrieve the corresponding location (longitude and latitude)
    if (highestAltitudeIndex !== -1) {
      const [longitude, latitude] = locations[highestAltitudeIndex];
      return { longitude, latitude };
    } else {
      return null; // No valid altitude found
    }
  }
  
  function calculateCyclingEfficiency(logs) {
    const elevationData = logs.altitude.map(parseFloat);
    const speedData = logs.speed.map(parseFloat);
  
    const elevationChange = elevationData.map((altitude, index, arr) => {
      if (index === 0) {
        return 0;
      }
      return altitude - arr[index - 1];
    });
  
    const efficiencyData = elevationChange.map((change, index) => {
      if (change === 0 || speedData[index] === null) {
        return null;
      }
      return (speedData[index] / change) * 100;
    });
  
    return efficiencyData;
  }
  
  function calculateUphillDownhillDistance(data) {
    const altitudeChanges = data.altitude.map(parseFloat);
    const locationCoordinates = data.location;
    const threshold = 0; // Define your threshold value here

    let uphillDistance = 0;
    let downhillDistance = 0;
    let prevAltitude = altitudeChanges[0];

    for (let i = 1; i < altitudeChanges.length; i++) {
        const altitudeChange = altitudeChanges[i] - prevAltitude;

        if (altitudeChange > threshold) {
            // Uphill segment
            const [lat1, lon1] = locationCoordinates[i - 1];
            const [lat2, lon2] = locationCoordinates[i];
            uphillDistance += calculateDistance(lat1, lon1, lat2, lon2);
        } else if (altitudeChange < -threshold) {
            // Downhill segment
            const [lat1, lon1] = locationCoordinates[i - 1];
            const [lat2, lon2] = locationCoordinates[i];
            downhillDistance += calculateDistance(lat1, lon1, lat2, lon2);
        }

        prevAltitude = altitudeChanges[i];
    }

    return { uphillDistance, downhillDistance };
}

