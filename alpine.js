maplibregl.setRTLTextPlugin('https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js');


fetch('https://5ae6-2a02-ab04-3d2-f800-f8f5-922f-121f-2f47.ngrok-free.app/folder-contents')
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
                        callback: function (value, index, array) {
                            return `${value}m`;
                        },
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
    fetch(`https://5ae6-2a02-ab04-3d2-f800-f8f5-922f-121f-2f47.ngrok-free.app/getRecord/${Data.Route.selected}`) // Replace "/api/track" with the actual API endpoint on your server
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            let coords = data.logs.location;
            // new maplibregl.Marker({ color: '#FF5733' }).setLngLat(data.dates.today.data.location).addTo(map);
            Data.distance = data.total;
            Data.duration = data.duration;
            Data.elevation = data.upDown;
            Data.speed = data.speed;
            Data.path = data.logs.path;
            Data.location = data.logs.location;

            renderChart(data);
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
                    fill: false,
                    backgroundColor: 'rgba(237, 100, 166, 0.25)',
                    borderColor: 'rgba(237, 100, 166, 1)',
                    pointBackgroundColor: 'rgba(237, 100, 166, 1)',
                    data: data.logs.altitude,
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

fetchData();
setInterval(fetchData, 30000);

window.onload = function(){loadMap()}

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
                        "coordinates": Data.logs.path
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
        }, 10);
    });
    
};


