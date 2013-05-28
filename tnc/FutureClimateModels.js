
dojo.require("esri.map");

dojo.require("dojo.fx.easing");
dojo.require("dojo.dnd.Source");
dojo.require("dojo.cookie");

var theOptions = {
  WebFolder: 'http://climatewizard.gis.com/ClimateChangeData',
  Legend: '_noLegend',
  Delimeter: "_",
  MapOption: '???',
  AnalyisArea: '???',
  Model: '???',
  Scenario: '???',
  Measurement: '???',
  Cycle: '???',
  TimePeriod: '???'
};

function init() {

  // PROXY PAGE
  esri.config.defaults.io.proxyUrl = "./resources/proxy.ashx";
  
  displayMsg("Loading...");
  
  var modelsGC = dijit.byId('allModelsList');
  dojo.forEach(futureClimateModels, function(model, modelIndex) {
  
    var infoPane = new dijit.layout.ContentPane({
      id: dijit.getUniqueId('infoPane'),
      content: model.description
    });
    dojo.addClass(infoPane.domNode, 'scenarioInfo');
    
    var modelPane = new dijit.TitlePane({
      id: 'modelPane_' + model.value,
      title: model.name,
      content: infoPane,
      attachParent: true,
      open: false
    });
    modelPane.containerNode.style.backgroundColor = '#E4E6D7';
    modelsGC.addService(modelPane, 0, modelIndex);
    
    dojo.forEach(emmisionScenarios, function(scenario) {
    
      var scenarioNamePane = new dijit.layout.ContentPane({
        id: dijit.getUniqueId('scenarioNamePane'),
        title: scenario.description,
        content: scenario.name
      });
      dojo.addClass(scenarioNamePane.domNode, 'scenarioNamePane');
      modelPane.containerNode.appendChild(scenarioNamePane.domNode);
      esri.hide(scenarioNamePane.domNode);
      
      var img = dojo.create('img');
      dojo.addClass(img, 'scenarioImg');
      
      var scenarioPane = new dijit.layout.ContentPane({
        id: dojo.string.substitute("${0}!${1}", [model.value, scenario.value]),
        title: scenario.description,
        content: img
      });
      dojo.addClass(scenarioPane.domNode, 'scenarioPreviewPane');
      modelPane.containerNode.appendChild(scenarioPane.domNode);
      esri.hide(scenarioPane.domNode);
      
      dojo.connect(scenarioPane, 'onClick', function() {
        var scenarioOptions = getScenarioOptions(scenarioPane);
        
        var title = dojo.string.substitute("${0} ( ${1} )", [model.value, scenario.value]);
        
        // PREVIEW DIALOG
        var previewDlg = dijit.byId('previewDlg');
        previewDlg.attr('title', title);
        dojo.addClass(previewDlg.closeButtonNode, "iconCollapse");
        var tab = dijit.byId('previewTabContainer');
        tab.selectChild(tab.getChildren()[0]);
        previewDlg.show();
        
        var so = new apl.ScenarioOptions(scenarioOptions);
        var previewImageLegend = so.getStaticImage();
        
        var staticPane = dijit.byId('staticPane');
        staticPane.attr('content', previewImageLegend);
        
        var previewMapPane = dijit.byId('previewMapPane');
        previewMapPane.containerNode.innerHTML = "";
        var cp = new dijit.layout.ContentPane({
          id: dijit.getUniqueId('previewMap'),
          style: 'width:100%; height:100%'
        }).placeAt(previewMapPane.containerNode);
        
        dijit.byId('animationSlider').attr('scenarioOptions', scenarioOptions);
        dijit.byId('animationSlider').attr('value', 1);
        setCurrentSubLayer(scenarioOptions, 1);
        
        setTimeout(function() {
          // CREATE THE MAP
          var m = createMap(cp, scenarioOptions);
          
          // SET ZOOM FULL ACTION
          var previewZoomFullBtn = dijit.byId('previewMapZoomFull');
          dojo.connect(previewZoomFullBtn, 'onClick', function(e) {
            zoomFullMap(m);
          });
          // SET IDENTIFY ACTION
          var previewIdentifyBtn = dijit.byId('previewMapIdentify');
          dojo.connect(previewIdentifyBtn, 'onClick', function(e) {
            var mapClickEvent = dojo.connect(m, 'onClick', function(evt) {
              dojo.disconnect(mapClickEvent);
              m.getLayer('ClimateChange').getCellValues(m, evt);
            });
          });
        }, 500);
      });
    });
  });
  
  var displayModels = dijit.byId('displayModels');
  dojo.forEach(initialDisplayModels, function(model) {
    var modelPane = dijit.byId('modelPane_' + model.value);
    modelPane.toggle();
    setPreviewDisplay(modelPane.domNode, true);
    displayModels.addService(modelPane, model.zoneIndex, 0);
  });
  
  changemap();
  
  dojo.subscribe("/dnd/drop", onDndDrop);
  dojo.subscribe("previewTabContainer-selectChild", null, onTabSelectChild);
  
  displayMsg("Drag Future Climate Models from the left pane onto the center display...");
}



function onTabSelectChild(page) {
  if (page.id === 'timeSeriesPane') {
    var scenarioOptions = dijit.byId('animationSlider').attr('scenarioOptions');
    var month = dijit.byId('animationSlider').attr('value');
    setCurrentSubLayer(scenarioOptions, month);
  }
}

function setCurrentSubLayer(scenarioOptions, month) {
  var scenarioMonthOptions = dojo.clone(scenarioOptions);
  scenarioMonthOptions.Cycle = month;
  var marginBox = dojo.marginBox(dojo.byId('timeSeriesDiv'));
  var so = new apl.ScenarioOptions(scenarioMonthOptions);
  var previewUrl = so.getImageUrl(null, marginBox.w, marginBox.h);
  dojo.byId('timeSeries').src = previewUrl;
}


function createMap(contentPane, scenarioOptions) {

  var initialExtent = null;
  if (scenarioOptions.AnalyisArea === 'AR4_US_12k') {
    initialExtent = new esri.geometry.Extent({
      "xmin": -14568286.09492447,
      "ymin": 2685691.425827251,
      "xmax": -7249899.258790501,
      "ymax": 6746026.368334735,
      "spatialReference": {
        "wkid": 102113
      }
    });
  } else {
    initialExtent = new esri.geometry.Extent({
      "xmin": -14401959.121376038,
      "ymin": -5968203.168505022,
      "xmax": 14871588.223160036,
      "ymax": 10273136.601525018,
      "spatialReference": {
        "wkid": 102113
      }
    });
  }
  
  // CRAETE THE MAP
  var map = new esri.Map(contentPane.containerNode, {
    nav: true,
    slider: true,
    extent: initialExtent
  });
  //dojo.connect(map, 'onExtentChange', function(extent){
  //    displayMsg(dojo.toJson(extent.toJson()));
  //});
  
  dojo.connect(map, 'onLoad', function(theMap) {
    try {
      var climateChangeLayer = new apl.ClimateChangeLayer({
        id: 'ClimateChange'
      });
      map.addLayer(climateChangeLayer);
      climateChangeLayer.setOpacity(0.7);
      climateChangeLayer.setScenarioOptions(scenarioOptions, true);
      
      dojo.byId('previewMapLegend').src = climateChangeLayer.getScenarioLegend();
    } catch (e) {
      console.error(e);
    }
  });
  
  // ADD BASELAYER    
  var baseLayerUrl = "http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer";
  var baseLayer = new esri.layers.ArcGISTiledMapServiceLayer(baseLayerUrl, {
    id: 'AGOLTopo'
  });
  map.addLayer(baseLayer);
  
  return map;
}

function zoomFullMap(map) {
  var layer = map.getLayer('AGOLTopo');
  var zoomExtent = layer.initialExtent;
  map.setExtent(zoomExtent);
}


function displayMsg(msg) {
  dojo.byId('infoPane').innerHTML = msg;
}

function onDndDrop(source, nodes, copy, target) {

  var modelNode = nodes[0];
  var modelPane = dijit.byId(modelNode.id);
  var sourceGC = dijit.byId(source.dom.id);
  var targetGC = dijit.byId(target.dom.id);
  
  if (source.dom.id != target.dom.id) {
    if (target.dom.id === 'displayModels') {
      if (!modelPane.open) {
        modelPane.toggle();
      }
    } else {
      if (modelPane.open) {
        modelPane.toggle();
      }
    }
  }
  
  if (target.dom.id === 'displayModels') {
    dojo.forEach(target.getAllNodes(), function(node, nodeIdx) {
      if (node.id === modelNode.id) {
        setPreviewDisplay(node, true);
      } else {
        var otherPane = dijit.byId(node.id);
        if (source.dom.id === 'allModelsList') {
          if (otherPane.open) {
            otherPane.toggle();
          }
          setPreviewDisplay(node, false);
        }
        var zoneIdx = getIndexZone(sourceGC, source.node);
        sourceGC.addService(otherPane, zoneIdx, 0);
      }
    });
  } else {
    setPreviewDisplay(target.dom, false);
  }
  
  changemap();
}

function setPreviewDisplay(parentNode, visible) {
  dojo.query('.scenarioPreviewPane', parentNode).forEach(function(previewNode) {
    if (visible) {
      esri.show(previewNode);
    } else {
      esri.hide(previewNode);
    }
  });
  
  dojo.query('.scenarioNamePane', parentNode).forEach(function(previewNode) {
    if (visible) {
      esri.show(previewNode);
    } else {
      esri.hide(previewNode);
    }
  });
  
  dojo.query('.scenarioInfo', parentNode).forEach(function(infoNode) {
    if (!visible) {
      esri.show(infoNode);
    } else {
      esri.hide(infoNode);
    }
  });
}

function changemap() {

  // CLEAR IMAGE URLS FROM MASTER LIST
  dojo.query('.scenarioPreviewPane', 'allModelsList').forEach(function(node) {
    // IMAGE NODE
    node.childNodes[0].src = '';
  });
  
  // SET CYCLE OPTION
  theOptions.Cycle = dijit.byId('cycleList').attr('value');
  // SET OTEHR OPTIONS
  dojo.query('input', 'inputsTable').forEach(function(node) {
    var radio = dijit.byId(node.id);
    var value = radio.attr('value');
    if (value) {
      theOptions[radio.name] = value;
    }
  });
  //console.log(theOptions); 
  
  // SET IMAGE URLS FOR DISPLAY LIST
  dojo.query('.scenarioPreviewPane', 'displayModels').forEach(function(node) {
  
    // SCENARIO OPTIONS
    var scenarioOptions = getScenarioOptions(node);
    var so = new apl.ScenarioOptions(scenarioOptions);
    
    // MARGIN BOX OF PARENT NODE
    var marginBox = dojo.marginBox(node)
    // PREVIEW IMAGE URL
    var previewUrl = so.getImageUrl(null, marginBox.w, marginBox.h);
    
    // IMAGE NODE
    node.childNodes[0].src = previewUrl;
  });
}

// SCENARIO OPTIONS ARE SPECIFIC TO A MODEL AND SCENARIO 
function getScenarioOptions(scenarioPane) {
  // THE NODE ID CONTAINS THE MODEL AND SCENARIO VALUES
  var modelScenario = scenarioPane.id.split('!');
  // USE CURRENT SETTINGS AND SET THE MODEL AND SCENARIO
  var scenarioOptions = dojo.mixin(theOptions, {
    Model: modelScenario[0],
    Scenario: modelScenario[1]
  });
  // RETURN SCENARION OPTIONS
  return scenarioOptions;
}

// GET THE INDEX ZONE
function getIndexZone(gridContainer, zone) {
  for (var zIdx = 0; zIdx < gridContainer.grid.length; zIdx++) {
    var gZone = gridContainer.grid[zIdx];
    if (gZone.node == zone) {
      return zIdx;
    }
  }
  return -1;
}

dojo.addOnLoad(init);

