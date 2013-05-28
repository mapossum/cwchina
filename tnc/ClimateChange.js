
/**
 * @author John Grayson [ESRI APL, Nov 2009]
 */
dojo.require("esri.map");
dojo.require("esri.tasks.query");
dojo.require("esri.toolbars.navigation");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.AccordionContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.TitlePane");
dojo.require("dijit.Toolbar");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.CheckBox");
dojo.require("dojox.timing");
dojo.require("dojo.parser");

var tempDiffURL = "http://climatewizard.gis.com/ArcGIS/rest/services/TNC/RollingAvg_A2/MapServer";

var wgs84, initialExtent, map, navToolbar;
var streetMapServiceLayer, topoServiceLayer, imageServiceLayer;
var resizeTimer;
var animationTimer;
var tempDiffLayer;

// BASE LAYERS
var baseLayers = [];
// DATA COPYRIGHT
var dataCopyright = '';

// APPLICATION INITIALIZE
function initialize() {

  // PROXY PAGE
  esri.config.defaults.io.proxyUrl = "./resources/proxy.ashx";
  
  // MAP
  wgs84 = new esri.SpatialReference({
    wkid: 4326
  });  
  
  // MAP
  map = new esri.Map("mapDiv", {
    nav: true
  });
  // MAP EVENTS
  dojo.connect(map, "onLoad", function(theMap) {
    // SET INITIAL EXTENT
		initialExtent = map.extent;
		
		// MAP DIV RESIZE EVENT
    dojo.connect(dijit.byId('mapDiv'), 'resize', function() {
      resizeMap();
    });
    
    // NAVIGATION TOOLBAR
    navToolbar = new esri.toolbars.Navigation(map);
    dojo.connect(navToolbar, "onExtentHistoryChange", onExtentHistoryChange);
    // PREV/NEXT NAVIGATION BUTTONS
    dijit.byId('navZoomPrevBtn').setDisabled(true);
    dijit.byId('navZoomNextBtn').setDisabled(true);
    
    // TEMPERATURE DIFFERENCE SERVICE
    tempDiffLayer = new esri.layers.ArcGISDynamicMapServiceLayer(tempDiffURL);
    tempDiffLayer.setOpacity(0.7);
    addLayerToMap(tempDiffLayer);
    
    // ADD VISIBILTY CHECKBOXES TO MAP SERVICE PANES	
    var tempDiffPane = dijit.byId('tempDiffPane');
    //console.log(tempDiffPane);
    tempDiffPane._buttonWidget.titleNode.innerHTML = '<table width="100%"><tr><td width="25px"><input id="tempDiffChk" dojoType="dijit.form.CheckBox" checked="checked" value="on" type="checkbox" onClick="toggleTempDiffLayer();"/></td><td align="left">' + tempDiffPane._buttonWidget.titleNode.innerHTML + "</td></tr></table>";
    
    yearChange(2025);
    
    dijit.byId('mainWindow').layout();
  });
  
  
  // IMAGE SERVICE         
  imageServiceLayer = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/ESRI_Imagery_World_2D/MapServer", {
    id: "Imagery"
  });
  // TOPO SERVICE         
  topoServiceLayer = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/NGS_Topo_US_2D/MapServer", {
    id: "Topo"
  });
  // STREETMAP SERVICE     
  streetMapServiceLayer = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/ESRI_StreetMap_World_2D/MapServer", {
    id: "StreetMap"
  });
  // BASE LAYERS
  baseLayers.push(imageServiceLayer.id);
  baseLayers.push(topoServiceLayer.id);
  baseLayers.push(streetMapServiceLayer.id);
  // ADD LAYERS TO MAP
  addLayerToMap(imageServiceLayer);
  addLayerToMap(topoServiceLayer);
  addLayerToMap(streetMapServiceLayer);
  
  
}

function changeTransp() {

  switch (tempDiffLayer.opacity) {
    case 0.7:
      tempDiffLayer.setOpacity(0.8);
      break;
    case 0.8:
      tempDiffLayer.setOpacity(0.9);
      break;
    case 0.9:
      tempDiffLayer.setOpacity(1.0);
      break;
    case 1.0:
      tempDiffLayer.setOpacity(0.7);
      break;
  }
}


// RESIZE THE MAP
function resizeMap() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function() {
    map.resize();
    map.reposition();
  }, 500);
}

// ADD LAYER TO MAP
function addLayerToMap(newLayer) {

  // LISTEN TO LAYER ONLOAD EVENT
  dojo.connect(newLayer, "onLoad", function() {
    // ADD LAYER
    map.addLayer(newLayer);
    
    // MAKE SURE ONLY STREETMAP LAYER IS VISIBLE
    if (map.layerIds.length == baseLayers.length) {
      toggleBaseLayer(topoServiceLayer.id);
    }
  });
}

// TOGGLE VISIBLE BASE LAYER
function toggleBaseLayer(layerName) {
  if (map != null) {
    dojo.forEach(baseLayers, function(baseLayerId) {
      var layer = map.getLayer(baseLayerId);
      if (layer != null) {
        if (baseLayerId == layerName) {
          layer.show();
          dojo.style(baseLayerId + 'Btn', {
            'color': 'darkred'
          });
          dojo.byId('creditsDiv').innerHTML = layer.copyright + dataCopyright.fontcolor('red');
        } else {
          layer.hide();
          dojo.style(baseLayerId + 'Btn', {
            'color': 'seagreen'
          });
        }
      }
    });
  }
}

function onExtentHistoryChange() {
  dijit.byId('navZoomPrevBtn').setDisabled(navToolbar.isFirstExtent());
  dijit.byId('navZoomNextBtn').setDisabled(navToolbar.isLastExtent());
  navToolbar.deactivate();
}

// TOGGLE ANIMATION
function toggleAnimation() {

  if (animationTimer == null) {
    animationTimer = new dojox.timing.Timer(1000);
    dojo.connect(animationTimer, 'onTick', onTimerTick);
  }
  
  if (animationTimer.isRunning) {
    stopTimer();
  } else {
    advanceAnimation();
    startTimer();
  }
}

// STOP ANIMATION TIMER
function stopTimer() {
  if (animationTimer != null) {
    animationTimer.stop();
    dojo.byId('animateLayerBtnLabel').innerHTML = 'Animate';
  }
}

// START ANIMATION TIMER
function startTimer() {
  if (animationTimer != null) {
    animationTimer.start();
    dojo.byId('animateLayerBtnLabel').innerHTML = 'STOP';
  }
}

// ON ANIMATION TIMER EVENT
function onTimerTick() {
  advanceAnimation();
}

// ADVANCE ANIMATION
function advanceAnimation() {
  var slider = dijit.byId('animationSlider');
  var currentValue = slider.getValue();
  var newValue = (currentValue + 1 <= 2099) ? (currentValue + 1) : 1990;
  slider.setValue(newValue);
}

// SLIDER YEAR CHANGE
function yearChange(yearVal) {

  if ((yearVal < 1990) || (yearVal > 2099)) {
    return;
  }
  
  var year = parseInt(yearVal);
  dojo.byId('yearLabel').innerHTML = year;
  
  var subLayerID = (year - 1990);
  tempDiffLayer.setVisibleLayers([subLayerID]);
}


// TOGGLE TEMPERATURE DIFFERENCE SERVICE
function toggleTempDiffLayer() {
  if (tempDiffLayer.visible) {
    // HIDE MAP SERVICE
    tempDiffLayer.hide();
    // STOP ANIMATION
    stopTimer();
    // DISABLE ANIMATION BUTTON AND SLIDER
    dijit.byId('btnAnimateTempLayer').setDisabled(true);
    dijit.byId('animationSlider').setDisabled(true);
  } else {
    // SHOW MAP SERVICE
    tempDiffLayer.show();
    // ENABLE ANIMATION BUTTON AND SLIDER
    dijit.byId('btnAnimateTempLayer').setDisabled(false);
    dijit.byId('animationSlider').setDisabled(false);
  }
}

dojo.addOnLoad(initialize);
