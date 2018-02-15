
// Initialize the map, centered/zoomed on NYU Furman Center

const fcLatLng = [40.7307216, -73.9998367];

var map = L.map('places-map').setView(fcLatLng, 16);

L.tileLayer('https://b.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Get data, and make map
getPlaces((places) => {

  // Get unique array of place types and colors
  let placeTypes = places.map(place => place.type);
  placeTypes = [...new Set(placeTypes)];

  let typeColors = places.map(place => place.color);
  typeColors = [...new Set(typeColors)];

  const layerOptions = {collapsed: false, position: 'topleft'};

  const typeLayers = {}; // fill with layers to create layer control tool
  const typeColorMap = {}; // fill with type/color key/val pairs

  placeTypes.forEach((type, i) => {
    // Make this type/color object for later
    typeColorMap[type] = typeColors[i]

    const layer = makeTypeLayer(type, places);

    // add it to an object of all layers
    typeLayers[type] = layer;

    // set the layer to be on by defult
    map.addLayer(typeLayers[type]);

    addLegendType(type, typeColors[i])
  });

  // Add layer control tool
  L.control.layers(null, typeLayers, layerOptions).addTo(map);


  map.on('click', (e) => {

    map.panTo(e.latlng);

    const typeOptions = placeTypes
      .map((type) => `<option value="${type}">${type}</option>`)
      .join('');

    const popupForm = '<h3>Add Your Own Cool Place!</h3><br>' +
      '<form id = "placeAdder">' +
        '<label><b>Type: </b></label>' +
        '<select id="type" form="placeAdder">' +
          typeOptions +
        '</select><br><br>' +
        '<label><b>Name: </b></label>' +
        '<input type="text" id="name"/><br><br>' +
        '<label><b>Description: </b></label><br><textarea id="description" rows="4" cols="40"></textarea><br><br>' +
        '<input type="submit" value="Add Place"/>' +
      '</form>'

    L.popup()
      .setLatLng(e.latlng)
      .setContent(popupForm)
      .openOn(map);

    $('#placeAdder').submit((event) => {
        event.preventDefault(); // prevents from reloading page

        const newType = $('#type').val();

        const newPlace = {
          name: $('#name').val(),
          type: newType,
          color: typeColorMap[newType],
          description: $('#description').val(),
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        };

        const newMarker = makeMarker(newPlace);

        map.addLayer(newMarker).closePopup();

        makeApiCall();

    });

  });

});


/**
 * Retrieve the crowd-scourced data from published CSV googlesheet
 * @async
 * @function getPlaces
 * @param {callback} callback - Function to use the data to create the map.
 * @returns {Promise<array>} The data from the googlesheet.
 */
function getPlaces(callback) {
  // If defined with an arrow, must be before the call to getPlaces, but other functions are fine..?
  $.ajax({
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS9viPoCAUDlBPYzMFrmm4pyjGtFhN65ZAnrVp_NX86V--f67I9B4FD50cNC_Q3V0f3sMwvMofKt0Ix/pub?gid=0&single=true&output=csv',
    type: 'GET'
  }).done((csv) => {
    const places = Papa.parse(csv, {header: true}).data;
    callback(places);
  });
}

/**
 * For a single place (row of orignal csv) make a leaflet marker
 * @function makeMarker
 * @param {object} place - Single place to map (row of googlesheets data)
 * @returns {CircleMarker}
 */
const makeMarker = (place) => {
  const latLng = [place.lat, place.lng];

  const circleOptions = {
    stroke: false,
    radius: 7,
    fillOpacity: 0.8,
    fillColor: place.color,
    width: 0
  }

  return L.circleMarker(latLng, circleOptions)
      .bindPopup('<b>' + place.name + '</b><br>' + place.description);
}

/**
 * For a single type of place, make a layer of all those markers
 * @function makeTypeLayer
 * @param {string} type - Type of palce to create a layer for.
 * @param {array} places - Array of place objects to map (contents of googlesheets data).
 * @returns {LayerGroup}
 */
const makeTypeLayer = (type, places) => {
  const markers = places.filter(place => place.type == type).map(makeMarker);
  return L.layerGroup(markers);
}

const addLegendType = (type, color) => {
  $('#legend').append(`<div class="legendItem ${type}">${type}</div>`);
  $('head').append(`<style>.${type}::before{background-color:${color};}</style>`);
}
// Feom Googlesheets api docs:
// https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append
function makeApiCall() {
  var params = {
    // The ID of the spreadsheet to update.
    spreadsheetId: '1hbCidPNlF2mbI-l4xHH6nt8WJyHXQqWpZ_EAXRylC-4',

    // The A1 notation of a range to search for a logical table of data.
    // Values will be appended after the last row of the table.
    range: 'A1:F50',

    // How the input data should be interpreted.
    valueInputOption: 'USER_ENTERED',

    // How the input data should be inserted.
    insertDataOption: 'INSERT_ROWS',

    crossDomain: true,
  };

  var valueRangeBody = {
     'range': 'A1:F50',
     'majorDimension': 'ROWS',
     'values': [
       ['mamoun', 'Lunch', 'Falafel', 40.733046, -73.997131, 'gold']
     ]
  };

  var request = gapi.client.sheets.spreadsheets.values.append(params, valueRangeBody);
  request.then(function(response) {
    // TODO: Change code below to process the `response` object:
    console.log(response.result);
  }, function(reason) {
    console.error('error: ' + reason.result.error.message);
  });
}

function initClient() {
  var API_KEY = 'AIzaSyBO5JeHgaTqNYsWXrky6k3O0xrfEmX7M00';

  var CLIENT_ID = '1005863219093-ah9qqhd14sbcrvo3hqfi5e6meufo9d5t.apps.googleusercontent.com';

  var SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

  gapi.client.init({
    'apiKey': API_KEY,
    'clientId': CLIENT_ID,
    'scope': SCOPE,
    'discoveryDocs': ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
  }).then(function() {
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSignInStatus);
    updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
  });
}

function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

function updateSignInStatus(isSignedIn) {
  if (isSignedIn) {
    makeApiCall();
  }
}

function handleSignInClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

function handleSignOutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}
