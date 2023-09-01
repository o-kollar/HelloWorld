// Set up the RTL Text Plugin
maplibregl.setRTLTextPlugin('https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js');

// Determine the style based on color scheme preference
function getStyle() {
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDarkMode ? './widgets/map/styles/dark.json' : './widgets/map/styles/default.json';
}

// Load and initialize the map
function loadMap() {
    const map = new maplibregl.Map({
        container: 'map',
        style: getStyle(),
        interactive: true,
        center: [17.1077, 48.1486],
        zoom: 8,
        
    });

    map.on('load', () => {
        const coordinates = Data.path;
        const geojsonData = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: [coordinates[0]],
                    },
                },
            ],
        };

        // Add source and layer to the map
        map.addSource('trace', { type: 'geojson', data: geojsonData });
        map.addLayer({
            id: 'trace',
            type: 'line',
            source: 'trace',
            paint: {
                'line-color': '#99f6e4',
                'line-opacity': 0.75,
                'line-width': 5,
            },
        });

        // Set up interval to update the map with additional coordinates
        let i = 1;
        const timer = window.setInterval(() => {
            if (i < coordinates.length) {
                geojsonData.features[0].geometry.coordinates.push(coordinates[i]);
                
                map.getSource('trace').setData(geojsonData);
                i++;
                const bounds = coordinates.reduce((bounds, coord) => bounds.extend(coord), new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
                map.fitBounds(bounds, { padding: 60 });
            } else {
                window.clearInterval(timer);
            }
        }, 35);
    });
}
