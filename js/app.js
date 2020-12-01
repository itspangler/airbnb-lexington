(function() {

  // DEFINE MAP OPTIONS
  var options = {
    zoomSnap: 1,
    center: [38.03, -84.5],
    zoom: 13,
    minZoom: 0,
    maxZoom: 20,
    // zoomControl: false,
  }

  // DEFINE BASEMAP OPTIONS
  var stamenOptions = {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 20,
    ext: 'png'
  }

  // DEFINE MAP
  var map = L.map('map', options);

  // CUSTOM ZOOM BUTTON
  function addControlPlaceholders(map) {
      var corners = map._controlCorners,
          l = 'leaflet-',
          container = map._controlContainer;

      function createCorner(vSide, hSide) {
          var className = l + vSide + ' ' + l + hSide;

          corners[vSide + hSide] = L.DomUtil.create('div', className, container);
      }

      createCorner('verticalcenter', 'left');
      createCorner('verticalcenter', 'right');
  }
  addControlPlaceholders(map);

  // Change the position of the Zoom Control to a newly created placeholder.
  map.zoomControl.setPosition('verticalcenterright');

  // You can also put other controls in the same placeholder.
  L.control.scale({position: 'verticalcenterright'}).addTo(map);

  // DEFINE BASEMAP
  var basemap = 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.{ext}'

  // RADIUS GENERATOR
  // var radius = d3.scaleSqrt().domain([0, 1e6]).range([1, 9]);

  // DEFINE DATA VARIABLES
  var BlockGroups = d3.json('data/bg-race-inc-medval.geojson');
  var airbnbCsvData = d3.csv('data/lexington_airbnb_s17.csv');

  // PROMISE.ALL METHOD FOR LOADING DATA
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
          "NUM_LIST": Number(row["NUM_LIST"]),
          "MULT_LIST": row["MULT_LIST"]
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

  // DEFINE DRAWMAP FUNCTION
  function drawMap(BlockGroups, airbnbGeojson) {

    // add basemap
    L.tileLayer(basemap, stamenOptions).addTo(map);

    // add block groups
    L.geoJSON(BlockGroups, {
      style: function(feature) {
        // style counties with initial default path options
        return {
          color: '#dddddd',
          weight: 2,
          opacity: 0,
          fillOpacity: 0.3,
          fillColor: '#1f78b4'
        };
      },
    }).addTo(map);

    // add airbnb points
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
    addUi(map); // add the UI controls
    // updateMap(map);
    addLegend(map);
  }

  // FUNCTIONS

  function getColor(d, breaks) {
    // function accepts a single normalized data attribute value
    // and uses a series of conditional statements to determine
    // which color value to return to the function caller

    if (d <= breaks[0][1]) {
      return '#aaaaaa';
    } else if (d <= breaks[1][1]) {
      return '#ffb2ae';
    } else if (d <= breaks[2][1]) {
      return '#ff9994';
    } else if (d <= breaks[3][1]) {
      return '#ff6961'
    } else if (d <= breaks[4][1]) {
      return '#ff5148'
    } else if (d <= breaks[5][1]) {
      return '#ff2015'
    }

  }

  function addLegend(breaks) {

    // create a new Leaflet control object, and position it top left
    var legendControl = L.control({
      position: 'topleft'
    });

    // when the legend is added to the map
    legendControl.onAdd = function(map) {

      // select a div element with an id attribute of legend
      var legend = L.DomUtil.get('legend');

      // disable scroll and click/touch on map when on legend
      L.DomEvent.disableScrollPropagation(legend);
      L.DomEvent.disableClickPropagation(legend);

      // return the selection to the method
      return legend;

    };

    // add the empty legend div to the map
    legendControl.addTo(map);

    // updateLegend(breaks);
  }

  function addUi(map) {
    // create the slider control
    var selectControl = L.control({
      position: 'topright'
    });

    // when control is added
    selectControl.onAdd = function(map) {
      // get the element with id attribute of ui-controls
      return L.DomUtil.get("ui-controls");
    }
    // add the control to the map
    selectControl.addTo(map);

    // add event listener for when user changes selection and call the updateMap() function to redraw map
    // $('select[id="airbnb"]').change(function() {
    //   // store reference to currently selected value
    //   attributeValue = $(this).val();
    //
    //   // call updateMap function
    //   updateMap(dataLayer);
    //
    // });

  }

})();
