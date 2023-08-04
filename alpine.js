maplibregl.setRTLTextPlugin('https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js');
const headers =  { 
    'ngrok-skip-browser-warning':true
  }

fetch('https://d029-2a02-ab04-3d2-f800-f8f5-922f-121f-2f47.ngrok-free.app/folder-contents',{
    headers: headers})
    .then(response => response.json())
    .then(data => {
        Data.Route.routes = data.files
        Data.Route.selected = data.files[0]
    })
    .catch(error => {
        console.error('Error fetching folder contents:', error);
    });



let Data = Alpine.reactive({
    Route:{selected:''}, 
    distance: '',
    duration: '',
    elevation: '',
    speed: '',
    path: [],
    speeds:[],
    location:'',

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

function fetchData() {

    // Make a request to your server's API endpoint that serves the track.json data
    fetch(`https://d029-2a02-ab04-3d2-f800-f8f5-922f-121f-2f47.ngrok-free.app/getRecord/${Data.Route.selected}`,{
        headers: headers}) // Replace "/api/track" with the actual API endpoint on your server
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            let coords = data.logs.location;
            // new maplibregl.Marker({ color: '#FF5733' }).setLngLat(data.dates.today.data.location).addTo(map);
            Data.distance = data.total;
            Data.duration = data.duration;
            Data.elevation = data.upDown;
            Data.speed = data.speed;
            Data.speeds = data.logs.speeds;
            Data.path = data.logs.path;
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

function renderChart(data) {

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
            labels: data.logs.updated,
            datasets: [
                {
                    label: 'Altitude',
                    backgroundColor: 'rgba(237, 100, 166, 0.25)',
                    borderColor: 'rgba(237, 100, 166, 1)',
                    pointBackgroundColor: 'rgba(237, 100, 166, 1)',
                    data: data.logs.altitude,
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


setInterval(fetchData, 30000);

window.onload = function(){loadMap()}
fetchData();

function loadMap() {
    let style = './resources/default.json';

    const map = new maplibregl.Map({
        container: 'map',
        style: style,
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
                'line-color': 'green',
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
                map.panTo(coordinates[i]);
                i++;
            } else {
                window.clearInterval(timer);
            }
        }, 50);
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
      backgroundColor: "#eb4f34",
      borderColor: "#eb4f34",
      borderWidth: 2,
      borderRadius:70,
      data: data.logs.speeds.map(speed => speed * 3.6)
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