const fcLatLon = [40.7307216, -73.9998367]

var map = L.map('places-map').setView(fcLatLon, 16);

L.tileLayer('https://b.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const getPlaces = (callback) => {
  $.ajax({
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTtDhxGKMcnLTHkSHCURW5HACFOSPSOOGSTpEY3C7PH8Rk1Nq8ZFVvhihfVEQmGB25iyQ3e9B3ADLgY/pub?gid=0&single=true&output=csv",
    type: "GET"
  }).done((csv) => {
    const places = Papa.parse(csv, {header: true}).data;
    console.log(places);
    callback(places);
  });
}

const makeMarker = (place) => {
  const latLon = [place.lat, place.lon];

  const typePalette = {
    Lunch: 'gold',
    Pizza: 'crimson',
    Bar: 'navy'
  };

  const placeColor = typePalette[place.type];

  const circleOptions = {
    stroke: false,
    radius: 7,
    fillOpacity: 0.8,
    fillColor: placeColor,
    width: 0
  }

  return L.circleMarker(latLon, circleOptions)
      .bindPopup('<b>' + place.name + '</b><br>' + place.description);
}


getPlaces((places) => {

  const pizzaMarkers = places.filter(place => place.type == 'Pizza').map(makeMarker);
  const barMarkers = places.filter(place => place.type == 'Bar').map(makeMarker);
  const lunchMarkers = places.filter(place => place.type == 'Lunch').map(makeMarker);

  const typeLayers = {
    'Pizza': L.layerGroup(pizzaMarkers),
    'Bar': L.layerGroup(barMarkers),
    'Lunch': L.layerGroup(lunchMarkers)
  };

  // Put all layers on by default
  Object.getOwnPropertyNames(typeLayers).forEach((layerName) => {
    map.addLayer(typeLayers[layerName]);
  });

  const layerOptions = {collapsed: false, position: 'topleft'};

  L.control.layers(null, typeLayers, layerOptions).addTo(map);

});
