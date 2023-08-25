maplibregl.setRTLTextPlugin('https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js');

document.addEventListener("DOMContentLoaded", () => {
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");

    sendButton.addEventListener("click", () => {
        const message = messageInput.value.trim();
        if (message !== "") {
            // Create and send POST request here
            sendMessage(message);
            messageInput.value = ""; // Clear the input field
        }
    });

    function sendMessage(message) {
        // Replace 'your-api-endpoint' with your actual API endpoint
        fetch("http://localhost:3000/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message }),
        })
        .then(response => response.json())
        .then(result => {
            Data.distance = result.total;
            Data.duration = result.duration;
            Data.elevation = result.elevation;
            Data.speed = result.speed;
            Data.speeds = result.logs.speed;
            Data.path = result.logs.location;
            Data.abc = result.parts;
            
            renderBar(result);
       renderChart(result.logs.updated, result.logs.altitude);
       loadMap();
        })
        .catch(error => {
            console.error("Error sending message:", error);
        });
    }
});

let mapstyle;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // Device is in dark mode
       mapstyle =  './resources/dark.json'
      } else {
        // Device is not in dark mode
        mapstyle =  './resources/default.json'
      }

const headers =  { 
    "ngrok-skip-browser-warning": 'true'
  }
let url = "https://97c4-2a02-ab04-3d2-f800-a1a2-ddb-431c-b6e.ngrok-free.app"
  async function getDataAndRender(start, end) {
    let body = {type:'today'};
  
    if (start) {
      body = {
        start: start,
        end: end,
      };
    }
  
    try {
      const response = await fetch(`${url}/getData`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
  
      const result = await response.json();
  
      console.log('Post request successful:', result);
  
      Data.distance = result.total;
      Data.duration = result.duration;
      Data.elevation = result.elevation;
      Data.speed = result.speed;
      Data.speeds = result.logs.speed;
      Data.path = result.logs.location;
      Data.abc = result.parts;
      if (!start) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
       renderBar(result);
       renderChart(result.logs.updated, result.logs.altitude);
       loadMap();
    } catch (error) {
      console.error(error);
    }
  }
  
  getDataAndRender()

//_________
fetch(`${url}/folder-contents`,{
    headers: headers})
    .then(response => response.json())
    .then(data => {
        Data.Route.routes = data.files
        Data.totalSum = data.totalSum
        let Topspeed = data.fastestSpeed * 3.6;
        Data.fastestSpeed = Topspeed.toFixed(2)
        Data.Route.selected = data.files[0]
    })
    .catch(error => {
        console.error('Error fetching folder contents:', error);
    });



let Data = Alpine.reactive({
    query:'',
    Route:{selected:''}, 
    distance: '',
    duration: '',
    elevation: '',
    speed: '',
    path: [],
    speeds:[],
    location:'',
    totalSum:0,

    chartOptions: {
        legend: {
            display: false,
        },
        tooltips: {
            enabled: false,
        },
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
                        display:false
                    
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

function fetchData(route) {

    // Make a request to your server's API endpoint that serves the track.json data
    fetch(`${url}/getRecord/${route}`,{
        headers: headers}) // Replace "/api/track" with the actual API endpoint on your server
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            let coords = data.logs.location;
            // new maplibregl.Marker({ color: '#FF5733' }).setLngLat(data.dates.today.data.location).addTo(map);
            Data.distance = data.total;
            Data.duration = data.duration;
            Data.elevation = data.elevation;
            Data.speed = data.speed;
            Data.speeds = data.logs.speeds;
            Data.path = data.logs.location;
            Data.location = data.logs.location;
            

            renderChart(data);
            renderBar(data);
            console.log(Data.location)
            loadMap()
        })
        .catch((error) => {
            console.error('Error fetching data:', error);
        });
}



function renderChart(updated,altitude) {

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
                }
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



window.onload = function(){loadMap()}
fetchData();

function loadMap() {
    

    const map = new maplibregl.Map({
        container: 'map',
        style: mapstyle,
    });

    map.on('load', () => {
        const geojsonData = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "type": "LineString",
                        "coordinates": Data.path
                    }
                }
            ]
        };
    
        // save full coordinate list for later
        const coordinates = geojsonData.features[0].geometry.coordinates;
    
        // start by showing just the first coordinate
        geojsonData.features[0].geometry.coordinates = [coordinates[0]];
    
        // add it to the map
        map.addSource('trace', {type: 'geojson', data: geojsonData});
        map.addLayer({
            'id': 'trace',
            'type': 'line',
            'source': 'trace',
            'paint': {
                'line-color': '#99f6e4',
                'line-opacity': 0.75,
                'line-width': 5
            }
        });
    
        // setup the viewport
        map.jumpTo({'center': coordinates[0], 'zoom': 14});
        // on a regular basis, add more coordinates from the saved list and update the map
        let i = 0;
        const timer = window.setInterval(() => {
            if (i < coordinates.length) {
                geojsonData.features[0].geometry.coordinates.push(
                    coordinates[i]
                );
                map.getSource('trace').setData(geojsonData);
                i++;
                const bounds = coordinates.reduce((bounds, coord) => {
                    return bounds.extend(coord);
                }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
        
                map.fitBounds(bounds, {
                    padding: 60
                });                
            } else {
                window.clearInterval(timer);
            }
        }, 35);
    });  
};

function renderBar(data){
var ctx12 = document.getElementById("chart12").getContext("2d");
var data12 = {
  labels: data.logs.updated,
  datasets: [
    {
        type:'bar',
      label: "Speed",
      backgroundColor: "#99f6e4",
      borderColor: "#99f6e4",
      borderWidth: 2,
      borderRadius:100,
      data: data.logs.speed.map(speed => speed * 3.6)
    },
    {
        type:'bar',
      label: "Speed2",
      backgroundColor: "#99f6e4",
      borderColor: "#99f6e4",
      borderWidth: 2,
      borderRadius: 30,
      data: data.logs.speed.map(speed => speed * -3.6)
    }
  ] 
};

window.myBar = new Chart(ctx12, {
  type: 'bar',
  data: data12,
  options: {
    legend: {
        display: false,
    },
    tooltips: {
        enabled: false,
    },
    responsive: true,
    title: {
      display: false,
      text: 'Chart.js Bar Chart'
    },
    legend: false,
    scales: {
        xAxes: [{
            categoryPercentage: 0.5,
            barPercentage: 1,
            gridLines : {
                display: false,
                drawBorder: false,
                drawTicks: false,

            },
            ticks: {
                display:false,
                fontStyle: 'bold',
                fontSize: 13,
                fontColor: "#333333",
                beginAtZero: true
            }
        }],
        yAxes: [{
            gridLines: {
                display: false,
                drawBorder: false,
                drawTicks: false,
                tickMarkLength: 15,
                borderDashOffset: 15
            },
            ticks: {
                display: false,
                fontStyle: 'bold',
                fontSize: 10,
                beginAtZero: true,
            }
        }]
    }
  }
});}

function findHighestSpeed(speeds) {
    let highestSpeed = speeds[0]; // Assume the first speed is the highest initially
  
    for (let i = 1; i < speeds.length; i++) {
      if (speeds[i] > highestSpeed) {
        highestSpeed = speeds[i]; // Update the highest speed if a larger one is found
      }
    }
    return highestSpeed.toFixed();
  }
