(function () {
  // DEFINE MAP OPTIONS
  const options = {
    zoomSnap: 1,
    center: [38.03, -84.5],
    zoom: 13,
    minZoom: 0,
    maxZoom: 20,
    // zoomControl: false,
  };

  // DEFINE BASEMAP OPTIONS
  const stamenOptions = {
    attribution:
      'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: "abcd",
    minZoom: 0,
    maxZoom: 20,
    ext: "png",
  };

  // DEFINE MAP
  const map = L.map("map", options);

  // DEFINE GLOBAL VARIABLES?
  // let pctGrowth = "pctgrowth";
  // let medIncome = "medincome_medincome";

  let currentBGAttribute = "pctgrowth";
  let currentAirBnBState = "";

  // CUSTOM ZOOM BUTTON
  function addControlPlaceholders(map) {
    const corners = map._controlCorners;
    const l = "leaflet-";
    const container = map._controlContainer;

    function createCorner(vSide, hSide) {
      var className = l + vSide + " " + l + hSide;

      corners[vSide + hSide] = L.DomUtil.create("div", className, container);
    }

    createCorner("verticalcenter", "left");
    createCorner("verticalcenter", "right");
  }
  addControlPlaceholders(map);

  // Add zoom button
  map.zoomControl.setPosition("verticalcenterleft");

  // Add scale bar
  L.control
    .scale({
      position: "verticalcenterright",
    })
    .addTo(map);

  // DEFINE BASEMAP
  const basemap =
    "https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.{ext}";

  // add basemap
  L.tileLayer(basemap, stamenOptions).addTo(map);

  // RADIUS GENERATOR -- not sure if I need
  // var radius = d3.scaleSqrt().domain([0, 1e6]).range([1, 9]);

  // DEFINE DATA VARIABLES
  const blockGroups = d3.json("data/bg-race-inc-medval.geojson");
  const airbnbCsvData = d3.csv("data/lexington_airbnb_s17.csv");

  // create object to hold legend titles
  const labels = {
    blackpct: "percentage of pop african american",
    medincome_medincome: "median income",
    pctgrowth: "Percent growth in median home value, 2013-2018",
  };

  // PROMISE.ALL METHOD FOR LOADING DATA
  Promise.all([blockGroups, airbnbCsvData]).then(function (data) {
    const blockGroupsData = data[0];
    const csvData = data[1];
    const airbnbGeojson = {
      type: "FeatureCollection",
      features: [],
    };

    csvData.forEach(function (row) {
      var feature = {
        type: "Feature",
        properties: {
          CITY: row["CITY"],
          PRICE: Number(row["PRICE"]),
          HOST_ID: row["HOST_ID"],
          NAME: row["NAME"],
          NUM_LIST: Number(row["NUM_LIST"]),
          MULT_LIST: row["MULT_LIST"],
        },
        geometry: {
          type: "Point",
          coordinates: [Number(row["LONG"]), Number(row["LAT"])],
        },
      };
      // console.log(feature.properties)
      airbnbGeojson.features.push(feature);
    });
    drawMap(blockGroupsData, airbnbGeojson);
  });

  // DEFINE DRAWMAP FUNCTION
  function drawMap(blockGroupsData, airbnbGeojson) {
    // add block groups
    const dataLayerBG = L.geoJSON(blockGroupsData, {
      style: function (feature) {
        // style counties with initial default path options
        return {
          color: "#dddddd",
          weight: 2,
          opacity: 1,
          fillOpacity: 1,
          fillColor: "#1f78b4",
        };
      },
    }).addTo(map);
    // console.log(blockGroupsData)

    // add airbnb points
    const dataLayerAirbnb = L.geoJSON(airbnbGeojson, {
      pointToLayer: function (feature, ll) {
        return L.circleMarker(ll, {
          weight: 0,
          fillOpacity: 0.6,
          radius: 5,
          fillColor: "red",
        });
      },
      onEachFeature: function (feature, layer) {
        var tooltip =
          feature.properties.NAME +
          "<br>" +
          "Host ID: " +
          feature.properties.HOST_ID +
          "<br>" +
          "Host number of listings: " +
          feature.properties.NUM_LIST +
          "<br>" +
          "Price: " +
          feature.properties.PRICE +
          "<br> " +
          "";
        layer.bindTooltip(tooltip);

        function onEachFeature(feature, layer) {
          layer.on("click", function (e) {
            zoomToFeature(e);
          });
        }
        // when mousing over a layer
        layer.on("mouseover", function () {
          // change the stroke color and bring that element to the front
          layer
            .setStyle({
              fillColor: "yellow",
              radius: 10,
              fillOpacity: 0.9,
            })
            .bringToFront();
        });
        // on mousing off layer
        layer.on("mouseout", function () {
          // reset the layer style to its original stroke color
          layer.setStyle({
            fillColor: "red",
            radius: 5,
            fillOpacity: 0.6,
          });
        });
      },
    }).addTo(map);
    addUiBG(dataLayerBG); // add the UI controls
    addLegend();
    updateBG(dataLayerBG);
    updateAirBnb(dataLayerAirbnb);
  }

  // FUNCTIONS

  function updateBG(dataLayerBG) {
    // console.log(blockGroupsData)

    // get the class breaks for the current data attribute
    var breaks = getClassBreaks(dataLayerBG);
    // update the legend to the map using breaks

    updateLegend(breaks);

    // loop through each county layer to update the color and tooltip info
    dataLayerBG.eachLayer(function (layer) {
      let props = layer.feature.properties;
      layer.setStyle({
        fillColor: getColor(props[currentBGAttribute], breaks),
      });

      // console.log(props[pctGrowth]);
      // set the fill color of layer based on its normalized data value

      // assemble string sequence of info for tooltip (end line break with + operator)
      // var tooltipInfo = "<b>" + props["GNOCDC_LAB"] +
      //   " Neighborhood</b></br>" +
      //   (props[attributeValue]);
      //
      // // bind a tooltip to layer with county-specific information
      // layer.bindTooltip(tooltipInfo, {
      //   // sticky property so tooltip follows the mouse
      //   sticky: true,
      //   tooltipAnchor: [200, 200]
      // });
    });
  }

  function updateAirBnb(dataLayerAirbnb) {
    // code here
  }

  function addUiBG(dataLayerBG) {
    $('select[id="bg-ui"]').change(() => {
      // store reference to currently selected value
      // attributeValue = $(this).val();
      currentBGAttribute = $(this).val();

      // call updateMap function
      updateBG(dataLayerBG);
    });
  }

  function addUiAirBnB() {
    // create the slider control
    var selectControl = L.control({
      position: "topright",
    });
    // when control is added
    selectControl.onAdd = function (map) {
      // get the element with id attribute of ui-controls
      return L.DomUtil.get("ui-controls");
    };
    // add the control to the map
    selectControl.addTo(map);
    // add event listener for when user changes selection and call the updateMap() function to redraw map
    $('select[id="airbnb"]').change(function () {
      // store reference to currently selected value
      attributeValue = $(this).val();

      // call updateMap function
      updateMap(map);
    });
  }

  function getClassBreaks(dataLayerBG) {
    // create empty Array for storing values
    var values = [];
    // console.log(data)
    // loop through all the block groups
    dataLayerBG.eachLayer(function (layer) {
      // console.log(layer.feature.properties)
      let value = layer.feature.properties[currentBGAttribute];
      values.push(value); // push the value for each layer into the Array
      // console.log(layer.feature.properties[pctGrowth])
    });

    // console.log(values)
    // determine similar clusters
    var clusters = ss.ckmeans(values, 6);

    // create an array of the lowest value within each cluster
    var breaks = clusters.map(function (cluster) {
      return [cluster[0], cluster.pop()];
    });
    //return array of arrays, e.g., [[0.24,0.25], [0.26, 0.37], etc]
    return breaks;
  }

  function getColor(d, breaks) {
    // function accepts a single normalized data attribute value
    // and uses a series of conditional statements to determine
    // which color value to return to the function caller

    if (d <= breaks[0][1]) {
      return "#f1eef6";
    } else if (d <= breaks[1][1]) {
      return "#d7b5d8";
    } else if (d <= breaks[2][1]) {
      return "#df65b0";
    } else if (d <= breaks[3][1]) {
      return "#dd1c77";
    } else if (d <= breaks[4][1]) {
      return "#980043";
      } else if (d <= breaks[5][1]) {
        return '#ff2015'
    }
  }

  function addLegend(breaks) {
    // create a new Leaflet control object, and position it top left
    var legendControl = L.control({
      position: "topleft",
    });

    // when the legend is added to the map
    legendControl.onAdd = function(legend) {
      // select a div element with an id attribute of legend
      var legend = L.DomUtil.get("legend");

      // disable scroll and click/touch on map when on legend
      L.DomEvent.disableScrollPropagation(legend);
      L.DomEvent.disableClickPropagation(legend);

      // return the selection to the method
      return legend;
    };

    // add the empty legend div to the map
    legendControl.addTo(map);
    updateLegend(map);
  }

  function updateLegend(breaks) {
    // select the legend, add a title, begin an unordered list and assign to a variable
    var legend = $("#legend").html("<h5>" + labels[currentBGAttribute] + "</h5>" + "<br>");

    // loop through the Array of classification break values
    for (var i = 0; i <= breaks.length - 1; i++) {
      var color = getColor(breaks[i][0], breaks);

      legend.append(
        '<span style="background:' +
          color +
          '"></span> ' +
          "<label>" +
          (breaks[i][0]) +
          " &mdash; " +
          (breaks[i][1]) +
          " %</label>"
      );
    }
  }
})();
