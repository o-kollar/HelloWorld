maplibregl.setRTLTextPlugin('https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js');

function getStyle() {
    let mapstyle;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // Device is in dark mode
        mapstyle = './widgets/map/styles/dark.json';
    } else {
        // Device is not in dark mode
        mapstyle = './widgets/map/styles/default.json';
    }
    return mapstyle;
}

function loadMap() {
    const map = new maplibregl.Map({
        container: 'map',
        style: getStyle(),
    });

    map.on('load', () => {
        const geojsonData = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: Data.path,
                    },
                },
            ],
        };

        // save full coordinate list for later
        const coordinates = geojsonData.features[0].geometry.coordinates;

        // start by showing just the first coordinate
        geojsonData.features[0].geometry.coordinates = [coordinates[0]];

        // add it to the map
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

        // setup the viewport
        map.jumpTo({ center: coordinates[0], zoom: 14 });
        // on a regular basis, add more coordinates from the saved list and update the map
        let i = 0;
        const timer = window.setInterval(() => {
            if (i < coordinates.length) {
                geojsonData.features[0].geometry.coordinates.push(coordinates[i]);
                map.getSource('trace').setData(geojsonData);
                i++;
                const bounds = coordinates.reduce((bounds, coord) => {
                    return bounds.extend(coord);
                }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

                map.fitBounds(bounds, {
                    padding: 60,
                });
            } else {
                window.clearInterval(timer);
            }
        }, 35);
    });
}
