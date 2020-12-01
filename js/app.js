(function() {

  // map element options
  var options = {
    zoomSnap: 1,
    center: [38.03, -84.5],
    zoom: 13,
    minZoom: 0,
    maxZoom: 20,
  }

  // stamen options
  var stamenOptions = {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 20,
    ext: 'png'
  }

  // create leaflet map and apply options
  var map = L.map('map', options);

  // set global variables for map layer, mapped attribute, and normalizing attribute
  var attributeValue = "PRICE";

  // create object to hold dropdown bar titles
  var feature = {
    "PRICE": "cost of Airbnb listing"
  }

  // create objects to hold map data
  var BlockGroups = d3.json('data/bg-race-inc-medval.geojson');
  var airbnbCsvData = d3.csv('data/lexington_airbnb_s17.csv');

  // promise.all method for loading data
  Promise.all([BlockGroups, airbnbCsvData]).then(function(data) {
    var csvData = data[1];
    var airbnbGeojson = {
      "type": "FeatureCollection",
      "features": []
    };
    csvData.forEach(function (row) {
      var feature = {
        "type":"Feature",
        "properties": {
          "CITY": row["CITY"],
          "PRICE": Number(row["PRICE"]),
          "HOST_ID": row["HOST_ID"],
          "NAME": row["NAME"],
          "NUM_LIST": Number(row["NUM_LIST"])
        },
          "geometry": {
          "type": "Point",
          "coordinates": [Number(row['LONG']), Number(row['LAT'])]
        }
      }
      console.log(feature.properties)
      airbnbGeojson.features.push(feature);
    })
    drawMap(data[0], airbnbGeojson)
  });
  // define drawmap functionality
  function drawMap(BlockGroups, airbnbGeojson) {
    var Stamen_Toner = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.{ext}', stamenOptions).addTo(map);
    L.geoJSON(BlockGroups, {
      // add demographic data here?
    }).addTo(map);
    L.geoJSON(airbnbGeojson, {
        pointToLayer: function(feature, ll) {
          return L.circleMarker(ll, {
            weight: 0,
            fillOpacity: 0.6,
            radius: 5,
            fillColor: 'red',
          })
        },
        onEachFeature: function(feature, layer) {
          var tooltip = feature.properties.NAME + '<br>' + 'Host ID: ' + feature.properties.HOST_ID + '<br>' + 'Host number of listings: ' + feature.properties.NUM_LIST + '<br>' + 'Price: ' + feature.properties.PRICE + '<br> '+''
          layer.bindTooltip(tooltip);
          function onEachFeature(feature, layer){
              layer.on('click', function(e){
                  zoomToFeature(e)
              });
          }
          // when mousing over a layer
					layer.on('mouseover', function() {
						// change the stroke color and bring that element to the front
						layer.setStyle({
							fillColor: 'yellow',
              radius: 10,
              fillOpacity: 0.9,
						}).bringToFront();
					});
					// on mousing off layer
					layer.on('mouseout', function() {
						// reset the layer style to its original stroke color
						layer.setStyle({
              fillColor: 'red',
              radius: 5,
              fillOpacity: 0.6,
						});
					});
				}
    }).addTo(map);
    // addUi(dataLayer); // add the UI controls
  }

  // FUNCTIONS

})();
