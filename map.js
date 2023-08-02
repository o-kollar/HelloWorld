window.onload = function loadMap(){
  let style = './resources/default.json';
  
    const map = new maplibregl.Map({
      container: 'map',
      style: style,
      zoom: 7,
          center: [17.11904355960693, 48.16150637919123],
          
    }
    
    );

map.on('load', () => {
    // We use D3 to fetch the JSON here so that we can parse and use it separately
    // from GL JS's use in the added source. You can use any request method (library
    // or otherwise) that you want.
    d3.json(
        'https://maplibre.org/maplibre-gl-js/docs/assets/hike.geojson',
        (err, data) => {
            if (err) throw err;

            // save full coordinate list for later
            const coordinates = data.features[0].geometry.coordinates;

            // start by showing just the first coordinate
            data.features[0].geometry.coordinates = [coordinates[0]];

            // add it to the map
            map.addSource('trace', {type: 'geojson', data});
            map.addLayer({
                'id': 'trace',
                'type': 'line',
                'source': 'trace',
                'paint': {
                    'line-color': 'yellow',
                    'line-opacity': 0.75,
                    'line-width': 5
                }
            });

            // setup the viewport
            map.jumpTo({'center': coordinates[0], 'zoom': 14});
            map.setPitch(30);

            // on a regular basis, add more coordinates from the saved list and update the map
            let i = 0;
            const timer = window.setInterval(() => {
                if (i < coordinates.length) {
                    data.features[0].geometry.coordinates.push(
                        coordinates[i]
                    );
                    map.getSource('trace').setData(data);
                    map.panTo(coordinates[i]);
                    i++;
                } else {
                    window.clearInterval(timer);
                }
            }, 10);
        }
    );
});}