
dojo.provide("apl.dijit.GetCellValues");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.require("dijit.Dialog");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");

dojo.require("esri.map");

//
// IF USING LOCAL COPY: CHANGE URL TO WEB ACCESSIBLE FOLDER LOCATION OF THIS JS FILE
//
//dojo.registerModulePath("apl.dijit.GetCellValues", "http://climatewizard.gis.com/TNC/GetCellValuesDijit");
dojo.registerModulePath("apl.dijit.GetCellValues", "/TNC/GetCellValuesDijit");

//=========================================================================
//
// apl.dijit.GetCellValues
//
//=========================================================================
dojo.declare("apl.dijit.GetCellValues", [dijit._Widget, dijit._Templated], {

  templatePath: dojo.moduleUrl("apl.dijit.GetCellValues", "templates/GetCellValues.html"),
  
  _dialog: null,
  
  constructor: function() {
  
    // WAIT 4 SECONDS...
    setTimeout(function() {
      // LOAD CHARTING COMPONENTS AFTER STARTUP
      dojo.require("dojo.fx.easing");
      dojo.require("dojox.charting.Chart2D");
      dojo.require("dojox.charting.themes.PlotKit.red");
      dojo.require("dojox.charting.themes.PlotKit.blue");
      dojo.require("dojox.charting.action2d.Highlight");
      dojo.require("dojox.charting.action2d.Magnify");
      dojo.require("dojox.charting.action2d.Tooltip");
      dojo.require("dojox.charting.widget.Legend");
    }, 4000);
  },
  
  buildRendering: function() {
    this.inherited("buildRendering", arguments);
    
    _dialog = new dijit.Dialog({
      id: dijit.getUniqueId('CCDlg'),
      title: 'GET ALL MODEL AND SCENARIO VALUES AT INPUT LOCATION',
      content: this.containerNode
    });
    
    dojo.parser.parse(this.domNode);
  },
  
  clearUI: function() {
    //...
  },
  
  getCellValues: function(evt, map, scenarioOptions) {
  
    this.clearUI();
    
    _dialog.show();
    
    esri.show(this.identifyBusy);
    this.identifyChartNode.innerHTML = '';
    this.identifyChartLegendNodeParent.innerHTML = '';
    dijit.byId(this.id + '.identifyResultsTable').containerNode.innerHTML = '';
    
    
    var isGlobal = scenarioOptions.isGlobal();
    var queryDelimeter = "~";
    var mosaicQueryName = scenarioOptions.getMosaicName(queryDelimeter);
    var geoPoint = (map.spatialReference.wkid === 102113) ? esri.geometry.webMercatorToGeographic(evt.mapPoint) : evt.mapPoint;
    
    var gpInputParams = {
      Input_Name: mosaicQueryName,
      Delimiter: queryDelimeter,
      Scope: isGlobal,
      X: geoPoint.x,
      y: geoPoint.y
    };
    console.log(dojo.toJson(gpInputParams, true));
    
    var _mc = this._makeChart;
    var _so = scenarioOptions;
    
    var _identifyGPStatus = this.identifyGPStatus;
    var _identifyBusy = this.identifyBusy;
    var _thisId = this.id;
    
    try {
    
	var gpTaskUrl = "http://ec2-174-129-36-42.compute-1.amazonaws.com/ArcGIS/rest/services/TNC/TNC_CellValue/GPServer/TNC_GetCellValuesAll";
      
      var gpTask = new esri.tasks.Geoprocessor(gpTaskUrl);
      gpTask.submitJob(gpInputParams, function(results) {
        //console.log(results);
        _identifyGPStatus.innerHTML = "Getting Cell Values...";
        
        gpTask.getResultData(results.jobId, 'Model_Values', function(result) {
          _identifyGPStatus.innerHTML = "Creating Chart...";
          try {
            _mc(result.value, _so, _thisId);
            esri.hide(_identifyBusy);
            _identifyGPStatus.innerHTML = dojo.string.substitute("Lon: <b>${x}</b><br/>Lat: <b>${y}</b>", geoPoint, function(val) {
              return dojo.number.format(val, {
                places: 4
              })
            });
          } catch (e) {
            console.error(e);
            esri.hide(_identifyBusy);
            _identifyGPStatus.innerHTML = '';
          }
        });
      }, function(jobInfo) {
        var lastMsg = jobInfo.messages[jobInfo.messages.length - 1].description;
        _identifyGPStatus.innerHTML = lastMsg;
        
      }, function(gpError) {
        console.error(gpError);
        esri.hide(_identifyBusy);
        _identifyGPStatus.innerHTML = '';
      });
    } catch (e) {
      console.error(e);
      esri.hide(_identifyBusy);
      _identifyGPStatus.innerHTML = '';
    }
    
  },
  
  _makeChart: function(cellValues, scenarioOptions, thisId) {
    //console.log(cellValues);
    
    var minY = Number.MAX_VALUE;
    var maxY = Number.MIN_VALUE;
    
    var allData = [];
    var allScenarioNames = ["b1", "a1b", "a2"];
    dojo.forEach(allScenarioNames, function(scenarioName) {
      allData[scenarioName] = [];
    });    
    
    dojo.forEach(cellValues.features, function(feature, fIdx) {
      dojo.forEach(allScenarioNames, function(scenarioName) {
      
        var modelName = feature.attributes.Model;
        var thisY = feature.attributes[scenarioName];
        maxY = Math.max(maxY, thisY);
        minY = Math.min(minY, thisY);
        
        allData[scenarioName].push({
          x: fIdx,
          y: thisY,
          tooltip: dojo.string.substitute("Model: <b>${0}</b><br/>Value: <b>${1}</b>", [modelName, thisY])
        });
      });
      
    });
    
    var headerRow = "<tr style='color:#E4E6D7;background-color:gray;'><th>Model</th><th>B1</th><th>A1B</th><th>A2</th></tr>";
    var valuesRows = dojo.map(cellValues.features, function(feature, fIdx) {
      var bgColor = (fIdx % 2 === 0) ? 'gainsboro' : 'whitesmoke';
      var atts = feature.attributes;
      return dojo.string.substitute("<tr style='background-color:${4};'><th>${0}</th><td>${1}</td><td>${2}</td><td>${3}</td></tr>", [atts['Model'], atts['b1'], atts['a1b'], atts['a2'], bgColor], function(val) {
        return isNaN(val) ? val : dojo.number.format(val, {
          places: 2
        });
      });
    });
    
    var valuesTable = dojo.string.substitute("<center><table id='valTable' cellpadding='4' rules='cols' frame='box' style='font-size:x-small;'>${0}${1}</table></center>", [headerRow, valuesRows.join('')]);
    
    dijit.byId(thisId + '.identifyResultsTable').containerNode.innerHTML = valuesTable;
    
    dojo.query('th, td', 'valTable').forEach(function(tableNode) {
      dojo.attr(tableNode, 'align', 'center');
    });
    dojo.query('td', 'valTable').forEach(function(tableNode) {
      dojo.attr(tableNode, 'width', '30px');
    });
    
    var midY = (minY + ((maxY - minY) * 0.5));
    var maxCount = allData["b1"].length;
    var measurementType = (scenarioOptions.Measurement === 'pptPct') ? ' mm' : " \u00B0";
    var theme = (scenarioOptions.Measurement === 'pptPct') ? dojox.charting.themes.PlotKit.blue : dojox.charting.themes.PlotKit.red;
    
    
    var chartNode = dojo.byId(thisId + '.identifyChartNode');
    chartNode.innerHTML = '';
    
    var chart = new dojox.charting.Chart2D(chartNode);
    chart.setTheme(theme);
    chart.addPlot("default", {
      type: "Default",
      lines: false,
      markers: true
    });
    chart.addPlot("Mean", {
      type: "Default",
      lines: true,
      markers: false
    });
    chart.addAxis("x", {
      min: -1,
      max: maxCount,
      minorLabels: false,
      majorLabels: false
    });
    chart.addAxis("y", {
      vertical: true,
      minorLabels: true,
      majorLabels: true,
      min: (minY - 1.0),
      max: (maxY + 1.0),
      fixLower: "minor",
      fixUpper: "minor",
      labelFunc: function(value) {
        return value + measurementType;
      }
    });
    chart.addSeries("Mid Value", [{
      x: -1,
      y: midY
    }, {
      x: maxCount,
      y: midY
    }], {
      plot: "Mean",
      stroke: {
        color: "yellow",
        width: 2.0
      }
    });
    
    dojo.forEach(allScenarioNames, function(scenarioName) {
      chart.addSeries("Scenario " + scenarioName, allData[scenarioName]);
    });
    
    var animb = new dojox.charting.action2d.Highlight(chart, "default");
    var animc = new dojox.charting.action2d.Tooltip(chart, "default");
    var anima = new dojox.charting.action2d.Magnify(chart, "default", {
      scale: 2.0
    });
    chart.render();
    
    
    var chartLegendNode = dojo.create('div');
    dojo.byId(thisId + '.identifyChartLegendNodeParent').innerHTML = '';
    dojo.byId(thisId + '.identifyChartLegendNodeParent').appendChild(chartLegendNode);
    
    var chartLegend = new dojox.charting.widget.Legend({
      id: dijit.getUniqueId('identifyChartLegend'),
      chart: chart,
      horizontal: true
    }, chartLegendNode);
    //console.log(chart);        
  }
  
});
