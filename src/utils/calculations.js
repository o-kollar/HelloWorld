function calculateDistanceFromPath(path) {
    if (!Array.isArray(path) || path.length < 2) {
      return null;
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
  
  function calculateAverageSpeed(speeds) {
    const validSpeeds = speeds.filter((speed) => typeof speed === 'number' && !isNaN(speed));
    if (validSpeeds.length === 0) {
      return 0; // Return 0 if no valid speeds are present
    }
  
    const sumOfSpeeds = validSpeeds.reduce((acc, speed) => acc + speed, 0);
    const averageSpeed = sumOfSpeeds / validSpeeds.length;
    return averageSpeed * 3.6;
  }
  
  function getStartAndEndTimestamp(data) {
    const timestamps = data.logs.updated;
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

  function calculateAverageBearing(bearings) {
    const validBearings = bearings.filter((bearing) => typeof bearing === 'number' && !isNaN(bearing));
    if (validBearings.length === 0) {
      return null; // Return null if no valid bearings are present
    }
  
    const cosSum = validBearings.reduce((acc, bearing) => acc + Math.cos((bearing * Math.PI) / 180), 0);
    const sinSum = validBearings.reduce((acc, bearing) => acc + Math.sin((bearing * Math.PI) / 180), 0);
    const averageBearingRadians = Math.atan2(sinSum / validBearings.length, cosSum / validBearings.length);
    let averageBearingDegrees = (averageBearingRadians * 180) / Math.PI;
  
    if (averageBearingDegrees < 0) {
      averageBearingDegrees += 360; // Normalize negative angles to positive angles
    }
  
    return averageBearingDegrees;
  }
  
  
  module.exports = {
    calculateDistanceFromPath,
    calculateAverageDifference,
    calculateAverageSpeed,
    getStartAndEndTimestamp,
    calculateDuration,
    calculateAverageBearing
  };
  