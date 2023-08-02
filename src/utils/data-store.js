const fs = require('fs');

function read(filePath, callback) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      callback(err, null);
    } else {
      try {
        const jsonData = JSON.parse(data);
        callback(null, jsonData);
      } catch (parseError) {
        callback(parseError, null);
      }
    }
  });
}

function store(filePath, data, callback) {
  fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
    if (err) {
      callback(err);
    } else {
      callback(null);
    }
  });
}

function createFileIfNotExists(filePath, initialData, callback) {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        // File does not exist, create it with initialData
        store(filePath, initialData, (writeErr) => {
          if (writeErr) {
            callback(writeErr);
          } else {
            callback(null);
          }
        });
      } else {
        // File already exists, proceed with the callback
        callback(null);
      }
    });
  }

module.exports = {
  read,
  store,
  createFileIfNotExists,
};
