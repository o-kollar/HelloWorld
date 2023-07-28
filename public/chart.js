
Number.prototype.comma_formatter = function() {

}
let currentLocation;


const chartOptions = {
 legend: {
        display: false,
    },
    tooltips: {
        enabled: false,
    },
    elements: {
        point: {
            radius: 0
        },
    },
    scales: {
        yAxes: [{
            gridLines: false,
            scaleLabel: false,
            ticks: {
                callback: function(value,index,array) {
                    return value > 1000 ? ((value < 1000000) ? value/1000 + 'K' : value/1000000 + 'M') : value;
                }
            }
        }]
    }
};

let chartData = function(){
    return {
        current: currentLocation,
        date: 'today',
        showDropdown: false,
        selectedOption: 0,
        selectOption: function(index){
            this.selectedOption = index;
            this.date = this.options[index].value;
            this.renderChart();
        },
        data: null,
        fetch: function(){
            fetch('./elevation.json')
                .then(res => res.json())
                .then(res => {
                   
                    this.data = res.dates;
                    this.renderChart();
                })
        },
        renderChart: function(){
            let c = false;

            Chart.helpers.each(Chart.instances, function(instance) {
                if (instance.chart.canvas.id == 'chart') {
                    c = instance;
                }
            });

            if(c) {
                c.destroy();
            }

            let ctx = document.getElementById('chart').getContext('2d');

            let chart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: this.data[this.date].data.labels,
                    datasets: [
                        {
                            label: "Altitude",
                            backgroundColor: "rgba(237, 100, 166, 0.25)",
                            borderColor: "rgba(237, 100, 166, 1)",
                            pointBackgroundColor: "rgba(237, 100, 166, 1)",
                            data: this.data[this.date].data.altitude,

                        },
                    ],
                },
                layout: {
                    padding: {
                        right: 10
                    }
                },
                options: chartOptions
            });
        },
       
    }
}

     const data = {
        datasets: [
          {
        		data: [40, 50],
				backgroundColor: [
					'#1f1e1e',
					'#eb4034'
				],
          },
        ],
      };

      const configChart = {
        type: "doughn ut",
        data,
        options: {
          }
      };

      var chartLine = new Chart(
        document.getElementById("pieChart"),
        configChart
      );




maplibregl.setRTLTextPlugin('https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js');

let geoJSONData = {
  type: 'Feature',
  geometry: {
      type: 'LineString',
      coordinates: [["17.11896145561999", "48.16150822969253"], ["17.11896145561999", "48.16150822969253"], ["17.11896145561999", "48.16150822969253"], ["17.11896145561999", "48.16150822969253"], ["17.11896145561999", "48.16150822969253"]]

  }
}
window.onload = function loadmap() {
  let mapstyle;
  mapstyle = './dark.json';

  const map = new maplibregl.Map({
    container: 'map',
    style: mapstyle,
    zoom: 7,
        center: [17.11904355960693, 48.16150637919123],
        
  }
  
  );

  var updateLocation = function (geocoder) {
    const myElement = document.getElementById("location");
    var results = geocoder.getResults();
    currentLocation = results.label
   console.log(results.label)
   myElement.textContent = results.label
   
   
};

function updateRoute() {
  if (map.getSource('route')) {
    // update source data
    map.getSource("route").setData(geoJSONData);
  } else {
    // create a new source
    map.addSource("route", {
      "type":"geojson",
      "data": geoJSONData
    });
  }

  if (map.getLayer('route-layer')) {
    // remove the previous version of layer
    if (map.getLayer('route-layer')) {
        map.removeLayer('route-layer');
    }

    map.addLayer({
      id: 'route-layer',
      source: 'route',
      type: 'line',
      paint:{'line-color': '#ed1111',
      'line-width': 10,}
    });
  }
}

  // Function to fetch data from the server
  function fetchData() {
    // Make a request to your server's API endpoint that serves the track.json data
    fetch('./elevation.json') // Replace "/api/track" with the actual API endpoint on your server
      .then(response => response.json())
      .then(data => {
        geoJSONData.geometry.coordinates = data.dates.today.data.path
        console.log(geoJSONData.geometry.coordinates)
        updateRoute()

        let coords = SMap.Coords.fromWGS84(data.dates.today.data.location[0],data.dates.today.data.location[1]); 
        new maplibregl.Marker({ color: '#FF5733' }).setLngLat(data.dates.today.data.location).addTo(map);
        new SMap.Geocoder.Reverse(coords, updateLocation);// Call the addMarker function with the fetched data
        console.log(data)
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }

  // Fetch data initially when the page loads
  fetchData();

  // Fetch data every 10 seconds using setInterval
  setInterval(fetchData, 10000);
};
