(function () {
  // DEFINE MAP OPTIONS
  const options = {
    zoomSnap: 1,
    center: [38.03, -84.5],
    zoom: 11,
    minZoom: 11,
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
  map.zoomControl.setPosition("topright");

  // Add scale bar
  L.control
    .scale({
      position: "topright",
    })
    .addTo(map);

  // DEFINE BASEMAP
  const basemap =
    "https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.{ext}";

  // add basemap
  L.tileLayer(basemap, stamenOptions).addTo(map);

  // RADIUS GENERATOR -- not sure if I need
  // var radius = d3.scaleSqrt().domain([0, 1e6]).range([1, 9]);

  // DEFINE COLOR PALETTE

  let colorsMedVal = ["#edf8e9", "#bae4b3", "#74c476", "#31a354", "#006d2c"];

  let colorsBlackPct = ["#f1eef6", "#bdc9e1", "#74a9cf", "#2b8cbe", "#045a8d"];

  let colorsMedInc = ["#edf8fb", "#b3cde3", "#8c96c6", "#8856a7", "#810f7c"];

  // DEFINE DATA VARIABLES
  const blockGroups = d3.json("data/bg-race-inc-medval.geojson");
  const airbnbCsvData = d3.csv("data/lexington_airbnb_s17.csv");

  // create object to hold legend titles
  const labels = {
    blackpct: "Percentage of population African American, 2018",
    medincome_medincome: "Median income, 2018",
    pctgrowth: "Percent growth in median home value, 2013-2018",
    transparent: "Block groups hidden",
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
          TYPE: row["TYPE"],
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
    map.setMaxBounds(map.getBounds(airbnbGeojson));

    // var entireHome = L.geoJSON(data) {
    //     filter: function(feature, layer) {
    //       return feature.properties.TYPE["Entire home/apt"];
    //     },
    //   },
  });

  // DEFINE DRAWMAP FUNCTION
  function drawMap(blockGroupsData, airbnbGeojson) {
    // add block groups
    const dataLayerBG = L.geoJSON(blockGroupsData, {
      style: function (feature) {
        // style counties with initial default path options
        return {
          color: "#dddddd",
          weight: 1,
          opacity: 1,
          fillOpacity: 1,
          // fillColor: "#1f78b4",
        };
      },
    })
      .addTo(map)
      .bringToBack();
    // console.log(blockGroupsData)

    // define airbnb filter variables
    const entireHome = L.geoJSON(airbnbGeojson, {
      pointToLayer: function (feature, ll) {
        return L.circleMarker(ll, {
          weight: 0,
          fillOpacity: 1,
          radius: 5,
          fillColor: "red",
        });
      },
      onEachFeature: function (feature, layer) {
        var tooltip =
          "<b>" +
          feature.properties.NAME +
          "</b>" +
          "<br>" +
          "Listing type: " +
          feature.properties.TYPE +
          "<br>" +
          "Host ID: " +
          feature.properties.HOST_ID +
          "<br>" +
          "Host number of listings: " +
          feature.properties.NUM_LIST +
          "<br>" +
          "Price: " +
          feature.properties.PRICE +
          "<br> ";
        ("");
        layer.bindTooltip(tooltip);
        // zoom to point on click
        layer.on("click", function (e) {
          map.setView(e.latlng, 16);
        });
        // when mousing over a layer
        layer.on("mouseover", function () {
          // change the stroke color and bring that element to the front
          layer
            .setStyle({
              color: "red",
              fillColor: "yellow",
              weight: 2,
              radius: 10,
              fillOpacity: 1,
            })
            .bringToFront();
        });
        // on mousing off layer
        layer.on("mouseout", function () {
          // reset the layer style to its original stroke color
          layer.setStyle({
            fillColor: "red",
            radius: 5,
            fillOpacity: 1,
          });
        });
      },
      filter: function (feature, layer) {
        return feature.properties.TYPE == "Entire home/apt";
      },
    });

    const privateRoom = L.geoJSON(airbnbGeojson, {
      pointToLayer: function (feature, ll) {
        return L.circleMarker(ll, {
          weight: 0,
          fillOpacity: 1,
          radius: 5,
          fillColor: "red",
        });
      },
      onEachFeature: function (feature, layer) {
        var tooltip =
          "<b>" +
          feature.properties.NAME +
          "</b>" +
          "<br>" +
          "Listing type: " +
          feature.properties.TYPE +
          "<br>" +
          "Host ID: " +
          feature.properties.HOST_ID +
          "<br>" +
          "Host number of listings: " +
          feature.properties.NUM_LIST +
          "<br>" +
          "Price: " +
          feature.properties.PRICE +
          "<br> ";
        ("");
        layer.bindTooltip(tooltip);
        // zoom to point on click
        layer.on("click", function (e) {
          map.setView(e.latlng, 16);
        });
        // when mousing over a layer
        layer.on("mouseover", function () {
          // change the stroke color and bring that element to the front
          layer
            .setStyle({
              color: "red",
              fillColor: "yellow",
              weight: 2,
              radius: 10,
              fillOpacity: 1,
            })
            .bringToFront();
        });
        // on mousing off layer
        layer.on("mouseout", function () {
          // reset the layer style to its original stroke color
          layer.setStyle({
            fillColor: "red",
            radius: 5,
            fillOpacity: 1,
          });
        });
      },
      filter: function (feature, layer) {
        return feature.properties.TYPE == "Private room";
      },
    });

    // add airbnb points
    const dataLayerAirbnb = L.geoJSON(airbnbGeojson, {
      pointToLayer: function (feature, ll) {
        return L.circleMarker(ll, {
          weight: 0,
          fillOpacity: 1,
          radius: 5,
          fillColor: "red",
        });
      },
      onEachFeature: function (feature, layer) {
        var tooltip =
          "<b>" +
          feature.properties.NAME +
          "</b>" +
          "<br>" +
          "Listing type: " +
          feature.properties.TYPE +
          "<br>" +
          "Host ID: " +
          feature.properties.HOST_ID +
          "<br>" +
          "Host number of listings: " +
          feature.properties.NUM_LIST +
          "<br>" +
          "Price: " +
          feature.properties.PRICE +
          "<br> ";
        ("");
        layer.bindTooltip(tooltip);
        // zoom to point on click
        layer.on("click", function (e) {
          map.setView(e.latlng, 16);
        });
        // when mousing over a layer
        layer.on("mouseover", function () {
          // change the stroke color and bring that element to the front
          layer
            .setStyle({
              color: "red",
              fillColor: "yellow",
              weight: 2,
              radius: 10,
              fillOpacity: 1,
            })
            .bringToFront();
        });
        // on mousing off layer
        layer.on("mouseout", function () {
          // reset the layer style to its original stroke color
          layer.setStyle({
            fillColor: "red",
            radius: 5,
            fillOpacity: 1,
          });
        });
      },
    }).addTo(map);

    // add listeners for click to toggle map layers

    $("#allTypes").click(function () {
      map.removeLayer(dataLayerAirbnb);
      map.removeLayer(privateRoom);
      map.removeLayer(entireHome);
      map.addLayer(dataLayerAirbnb);
    });
    $("#entireHome").click(function () {
      map.removeLayer(dataLayerAirbnb);
      map.removeLayer(privateRoom);
      map.addLayer(entireHome);
      // console.log(entireHome)
    });
    $("#privateRoom").click(function () {
      map.removeLayer(dataLayerAirbnb);
      map.removeLayer(entireHome);
      map.addLayer(privateRoom);
    });
    $("#hideListings").click(function () {
      // map.addLayer()
      map.removeLayer(dataLayerAirbnb);
      map.removeLayer(privateRoom);
      map.removeLayer(entireHome);
    });
    $("#showBG").click(function () {
      map.addLayer(dataLayerBG);
      dataLayerBG.bringToBack();
    });
    $("#hideBG").click(function () {
      // map.addLayer(dataLayerBG)
      map.removeLayer(dataLayerBG);
    });

    addUiBG(dataLayerBG); // add the UI controls
    addUiAirBnB();
    addLegend();
    updateBG(dataLayerBG);
  }

  // FUNCTIONS

  // define function for updating block groups
  function updateBG(dataLayerBG) {
    // console.log(blockGroupsData)

    // get the class breaks for the current data attribute
    var breaks = getClassBreaks(dataLayerBG);

    // update the legend to the map using breaks
    updateLegend(breaks);

    // loop through each county layer to update the color and tooltip info
    dataLayerBG.eachLayer(function (layer) {
      let props = layer.feature.properties;
      if (!props[currentBGAttribute]) {
        layer.setStyle({
          fillColor: "grey",
        });
      } else {
        layer.setStyle({
          fillColor: getColor(props[currentBGAttribute], breaks),
        });
      }
    });
  }

  // define UI functionality for changing block group variables
  function addUiBG(dataLayerBG) {
    // create the dropdown menu control
    var selectControl = L.control({
      position: "topleft",
    });
    // when control is added
    selectControl.onAdd = function (map) {
      // get the element with id attribute of ui-controls
      return L.DomUtil.get("ui-controls");
    };
    // add the control to the map
    selectControl.addTo(map);
    L.DomEvent.disableScrollPropagation(selectControl);
    L.DomEvent.disableClickPropagation(selectControl);

    // add event listener for when user changes selection and call the updateMap() function to redraw map
    $('select[id="bg"]').change(function () {
      // store reference to currently selected value
      currentBGAttribute = $(this).val();
      // call updateBG function
      updateBG(dataLayerBG);
    });
  }

  function addUiAirBnB(dataLayerAirbnb) {
    var listingTypeBtn = L.control({
      position: "topright",
    });

    // when the button is added to the map
    listingTypeBtn.onAdd = function (map) {
      // select a div element with an id attribute of legend
      return L.DomUtil.get("airbnb");
    };

    listingTypeBtn.addTo(map);
  }

  function getClassBreaks(dataLayerBG) {
    // create empty Array for storing values
    var values = [];
    // console.log(data)
    // loop through all the block groups
    dataLayerBG.eachLayer(function (layer) {
      // console.log(layer.feature.properties)
      let value = layer.feature.properties[currentBGAttribute];
      if (value) {
        values.push(value); // push the value for each layer into the Array
      }
    });

    // console.log(values)
    // determine similar clusters
    var clusters = ss.ckmeans(values, 5);

    // create an array of the lowest value within each cluster
    var breaks = clusters.map(function (cluster) {
      return [cluster[0], cluster.pop()];
    });
    //return array of arrays, e.g., [[0.24,0.25], [0.26, 0.37], etc]
    return breaks;
    console.log(breaks);
  }

  // console.log(colors[0]);

  function getColor(d, breaks) {
    // function accepts a single normalized data attribute value
    // and uses a series of conditional statements to determine
    // which color value to return to the function caller
    // console.log(breaks[0][0]);

    var colorMap = {
      pctgrowth: colorsMedVal,
      blackpct: colorsBlackPct,
      medincome_medincome: colorsMedInc,
    };

    if (d <= breaks[0][1]) {
      return colorMap[currentBGAttribute][0];
    } else if (d <= breaks[1][1]) {
      return colorMap[currentBGAttribute][1];
    } else if (d <= breaks[2][1]) {
      return colorMap[currentBGAttribute][2];
    } else if (d <= breaks[3][1]) {
      return colorMap[currentBGAttribute][3];
    } else if (d <= breaks[4][1]) {
      return colorMap[currentBGAttribute][4];
    }
  }

  function addLegend(breaks) {
    // create a new Leaflet control object, and position it top left
    var legendControl = L.control({
      position: "topleft",
    });

    // when the legend is added to the map
    legendControl.onAdd = function () {
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
    // var formatMapping = {
    //   pctgrowth: "%",
    //   blackpct: "%",
    //   medincome_medincome: "",
    // };

    // select the legend, add a title, begin an unordered list and assign to a variable
    var legend = $("#legend").html(`<h5>${labels[currentBGAttribute]}</h5>`);

    var legendList = "";

    // loop through the Array of classification break values
    for (var i = 0; i <= breaks.length - 1; i++) {
      console.log(i);
      var color = getColor(breaks[i][0], breaks);

      if (currentBGAttribute == "medincome_medincome") {
        var listItem = `<div><span style="background:${color}"></span>
        <label>$${breaks[i][0].toLocaleString()} &mdash; $${breaks[
          i
        ][1].toLocaleString()}</label></div>`;
      } else {
        var listItem = `<div><span style="background:${color}"></span>
        <label>${breaks[i][0]} &mdash; ${breaks[i][1]}%</label></div>`;
      }

      legendList += listItem;
    }
    // legendList += "</ul>";
    legend.append(legendList);
  }
})();
