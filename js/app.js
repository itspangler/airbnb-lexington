(function() {

  var map = L.map('map', {
    zoomSnap: .1,
    center: [38.03, -84.5],
    zoom: 10,
    minZoom: 0,
    maxZoom: 20,
  });

  var Stamen_Toner = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.{ext}', {
  	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  	subdomains: 'abcd',
  	minZoom: 0,
  	maxZoom: 20,
  	ext: 'png'
  }).addTo(map);

  var ZipsGeojsonData = d3.json('data/lex-zips.geojson');
  var airbnbCsvData = d3.csv('data/lexington_airbnb_s17.csv');

  Promise.all([ZipsGeojsonData, airbnbCsvData]).then(function(data) {

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
          "PRICE": Number(row["PRICE"])
        },
        "geometry": {
          "type": "Point",
          "coordinates": [Number(row['LONG']), Number(row['LAT'])]
        }
      }

      // console.log(row);

      airbnbGeojson.features.push(feature);
      // console.log(airbnbGeojson);

    })

    drawMap(data[0], airbnbGeojson)

    // console.log(data);
  });

  // define drawmap functionality

  function drawMap(ZipsGeojson, airbnbGeojson) {

    // var = zipsOptions {
    //   style {
    //   }
    // };
    //
    L.geoJSON(ZipsGeojson ).addTo(map);

    L.geoJSON(airbnbGeojson, {
        pointToLayer: function(feature, ll) {
          return L.circleMarker(ll, {
            opacity: 1,
            weight: 2,
            fillOpacity: 0,
          })
        },
        onEachFeature: function(feature, layer) {
          console.log(feature.properties)

          var tooltip = 'Price: ' + feature.properties.PRICE;

          layer.bindTooltip(tooltip);
        }
    }).addTo(map)

  }

  // define proportional circle functionality

  function calcRadius(val) {

    var radius = Math.sqrt(val / Math.PI);
    return radius * .5; // adjust .5 as a scale factor

  }

  // define function for resizing circles
  function resizeCircles(girlsLayer, boysLayer, currentGrade) {

    girlsLayer.eachLayer(function(layer) {
      var radius = calcRadius(Number(layer.feature.properties['G' + currentGrade]));
      console.log(layer.feature.properties);
      layer.setRadius(radius);
    });
    boysLayer.eachLayer(function(layer) {
      var radius = calcRadius(Number(layer.feature.properties['B' + currentGrade]));
      layer.setRadius(radius);
    });

    // update the hover window with current grade's
    retrieveInfo(boysLayer, currentGrade);

  }

})();
