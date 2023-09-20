document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');

    messageInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default Enter behavior (form submission)
            sendMessage(messageInput.value.trim());
            messageInput.blur();
        }
    });

    async function sendMessage(message) {
        try {
            const response = await fetch(`${url}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            const result = await response.json();
            updateData(result);
            renderBar(result);
            renderChart(result.logs.updated, result.logs.altitude);
            loadMap();
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }
});

const headers = {
    'ngrok-skip-browser-warning': 'true',
};
let url = 'https://97c4-2a02-ab04-3d2-f800-a1a2-ddb-431c-b6e.ngrok-free.app';

async function getDataAndRender(start, end) {
    let body = { type: 'today' };

    if (end) {
        body = {
            start: start,
            end: end,
        };
    }

    try {
        const response = await fetch(`${url}/getData`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const result = await response.json();
        updateData(result);
        renderBar(result);
        renderChart(result.logs.updated, result.logs.altitude);
        loadMap();
    } catch (error) {
        console.error(error);
    }
}

async function fetchData() {
    await getDataAndRender();
}

let Data = Alpine.reactive({
    query: '',
    parts: [],
    Route: { selected: '' },
    distance: '',
    duration: '',
    elevation: '',
    speed: '',
    path: [],
    speeds: [],
    location: '',
    totalSum: 0,
    temperature:'',
    precipitation:'',


    chartOptions: {
        legend: false,
        tooltips: false,
        elements: {
            point: {
                radius: 0,
            },
        },
        scales: {
            yAxes: [
                {
                    gridLines: false,
                    scaleLabel: false,
                    ticks: {
                        display: false,
                    },
                },
            ],
            xAxes: [
                {
                    gridLines: false,
                    scaleLabel: false,
                    ticks: {
                        display: false,
                    },
                },
            ],
        },
    },
});

async function updateData(result) {
    activity = calculateTimeSpent(result.logs);

    Data.distance = result.total;
    Data.duration = { total: result.duration, moving: formatTime(activity.movingTime), idle: formatTime(activity.inactiveTime) };
    Data.elevation = result.elevation;
    Data.speed = result.speed;
    Data.speeds = result.logs.speed;
    Data.path = result.logs.location;

    // Temporarily on Frontend
    Data.parts = separateLogsByTimeGapAndCalculateDistance(result.logs.updated, result.logs.location);
    Data.abc = getHighestAltitudePoint(result.logs.altitude, result.logs.location);
    const localityLanguage = 'en';

    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${Data.abc.latitude}&longitude=${Data.abc.longitude}&localityLanguage=${localityLanguage}`;

    fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            // Handle the response data here
            console.log(data);
            Data.abc.locality = data.localityInfo.informative[2].name
        })
        .catch((error) => {
            // Handle any errors that occurred during the fetch
            console.error('Fetch Error:', error);
        });

        const cyclingEfficiency = calculateCyclingEfficiency(result.logs);
        console.log(cyclingEfficiency);


 Data.hills = calculateUphillDownhillDistance(result.logs);

// Function to call the API for a specific entry
async function fetchWeatherData(index) {
    const apiUrl = "https://api.open-meteo.com/v1/forecast";
    const parameters = "hourly=temperature_2m,precipitation_probability,precipitation,weathercode";
    const [longitude, latitude] = result.logs.location[index];
    const startDate = result.logs.updated[index].split('T')[0];
    const endDate = startDate;
  
    const ul = `${apiUrl}?latitude=${latitude}&longitude=${longitude}&${parameters}&start_date=${startDate}&end_date=${endDate}`;
  
    try {
      const response = await fetch(ul);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      console.log(`Weather data for entry ${index}:`, data);
      
      // Create a Date object from the start date
      const start = new Date(result.logs.updated[index]);
      
      // Initialize an array to store the differences
      const differences = [];
      
      // Loop through the time array and calculate the differences
      for (let time of data.hourly.time) {
        // Create a Date object from the time string
        let date = new Date(time);
        
        // Calculate the absolute difference in milliseconds
        let diff = Math.abs(date - start);
        
        // Push the difference to the array
        differences.push(diff);
      }
      
      // Find the minimum difference in the array
      let minDiff = Math.min(...differences);
      
      // Find the index of the minimum difference
      let minIndex = differences.indexOf(minDiff);
      
      // Print out the entry with the minimum difference
      console.log(`The entry closest to the start date is:`);
      console.log(`Time: ${data.hourly.time[minIndex]}`);
      console.log(`Temperature: ${data.hourly.temperature_2m[minIndex]} °C`);
      Data.temperature = data.hourly.temperature_2m[minIndex]
      console.log(`Precipitation: ${data.hourly.precipitation[minIndex]} mm`);
      Data.precipitation = data.hourly.precipitation[minIndex]
      console.log(`Weather code: ${data.hourly.weathercode[minIndex]}`);
      
    } catch (error) {
      console.error(`Error fetching data for entry ${index}:`, error);
    }
  }

  
  // Call the API for every 200th entry
  for (let i = 0; i < result.logs.updated.length; i += 500) {
    fetchWeatherData(i);
  }

}

function renderChart(updated, altitude) {
    let c = false;

    Chart.helpers.each(Chart.instances, function (instance) {
        if (instance.chart.canvas.id == 'chart') {
            c = instance;
        }
    });

    if (c) {
        c.destroy();
    }

    let ctx = document.getElementById('chart').getContext('2d');
    let chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: updated,
            datasets: [
                {
                    label: 'Altitude',
                    backgroundColor: 'rgb(232, 121, 249,0.25)',
                    borderColor: 'rgb(232, 121, 249)',
                    pointBackgroundColor: 'rgb(232, 121, 249)',
                    data: altitude,
                },
            ],
        },
        layout: {
            padding: {
                right: 10,
            },
        },
        options: Data.chartOptions,
    });
}

window.onload = function () {
    loadMap();
};
fetchData();

function clearInput() {
    Data.query = '';
    getDataAndRender();
}

function renderBar(data) {
    var ctx2 = document.getElementById('chart12').getContext('2d');
    var data2 = {
        labels: data.logs.updated,
        datasets: [
            {
                type: 'line',
                label: 'Speed',
                backgroundColor: '#8b5cf6',
                borderColor: '#5eead4',
                borderWidth: 2,
                borderRadius: 60,
                data: data.logs.speed.map((speed) => speed * 3.6),
            },
            {
                type: 'line',
                label: 'Speed2',
                backgroundColor: '#8b5cf6',
                borderColor: '#5eead4',
                borderWidth: 2,
                borderRadius: 60,
                data: data.logs.speed.map((speed) => speed * -3.6),
            },
        ],
    };

    window.myBar = new Chart(ctx2, {
        type: 'line',
        data: data2,
        options: Data.chartOptions,
    });
}

function weatherChart() {
    var ctx12 = document.getElementById('weatherChart').getContext('2d');
    var data12 = {
        labels: Data.temperature,
        datasets: [
            {
                type: 'line',
                label: 'Speed',
                backgroundColor: '#8b5cf6',
                borderColor: '#5eead4',
                borderWidth: 2,
                borderRadius: 60,
                data: Data.temperature
            },
           
        ],
    };

    window.myBar = new Chart(ctx12, {
        type: 'line',
        data: data12,
        options: Data.chartOptions,
    });
}