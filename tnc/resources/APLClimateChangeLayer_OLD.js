/**
 * @author John Grayson, APL ESRI, Nov 2009
 *
 * apl.ClimateChangeLayer : esri.layers.DynamicMapServiceLayer
 *
 */
//============================================================================================
//============================================================================================
//============================================================================================
//
// **** SCENARIO OPTIONS ****
//
// ** HISTORICAL **
// {MapOption}_{AnalyisArea}_{Measurement}_{Cycle}_{TimePeriod}     
//
// MapOption: mean, trend_change_rate, trend_pVal
// AnalyisArea: cru50k, prism
// Measurement: tmean, pptPct
// Cycle: 1-18 (except 13!)
// TimePeriod: 1951_2002, 1951_2006
//
// ** FUTURE **
// {MapOption}_{AnalyisArea}_{Model}_{Scenario}_{Measurement}_{Cycle}_{TimePeriod}         
// * ENSAMBLE MODELS *
// {MapOption}_{Model}_{AnalyisArea}_{Scenario}_{Measurement}_{Cycle}_{TimePeriod}     
//
// MapOption: mean, depart_change
// AnalyisArea: AR4_Global_50k, AR4_US_12k
// Model: cccma_cgcm3_1.1, etc... (See ClimateModelsInfo.js for complete list.)
// Scenario: a2, a1b, b1
// Measurement: tmean, pptPct
// Cycle: 1-18 (except 13!)
// TimePeriod: 2040_2069, 2070_2099
//
//============================================================================================
//============================================================================================
//============================================================================================

// CLIMATE CHANGE LAYER
//  - THIS CUSTOM DYNAMIC LAYER WILL RETRIEVE IMAGES FROM TWO
//    IMAGE SERVER SERVICES BASED ON USER SPECIFIED OPTIONS.
//    SEE 'SCENARIO OPTIONS' SECITON ABOVE.  
dojo.declare("apl.ClimateChangeLayer", esri.layers.DynamicMapServiceLayer, {

    // CURRENT SCENARIO OPTIONS
    scenarioOptions: {
        WebFolder: 'http://maps.esri.com/Labs6/ClimateChangeData',
        Legend: '_noLegend',
        Delimeter: "_",
        MapOption: '???',
        AnalyisArea: '???',
        Model: '???',
        Scenario: '???',
        Measurement: '???',
        Cycle: '???',
        TimePeriod: '???'
    },
    
    // NAME AND URL TEMPLATES
    theTemplates: {
        _nonEnsembleUrl: "${WebFolder}/map_${MapOption}${Delimeter}${AnalyisArea}${Delimeter}${Model}${Delimeter}${Scenario}${Delimeter}${Measurement}${Delimeter}${Cycle}${Delimeter}${TimePeriod}${Legend}.png",
        _ensembleUrl: "${WebFolder}/map_${MapOption}${Delimeter}${Model}${Delimeter}${AnalyisArea}${Delimeter}${Scenario}${Delimeter}${Measurement}${Delimeter}${Cycle}${Delimeter}${TimePeriod}${Legend}.png",
        _historicalUrl: "${WebFolder}/map_${MapOption}${Delimeter}${AnalyisArea}${Delimeter}${Measurement}${Delimeter}${Cycle}${Delimeter}${TimePeriod}${Legend}.png",
        
        _mosaicNameFutureTemplate: "${MapOption}${Delimeter}${Model}${Delimeter}${Scenario}${Delimeter}${Measurement}${Delimeter}${Cycle}${Delimeter}${TimePeriod}",
        _mosaicNameHistoricalTemplate: "${MapOption}${Delimeter}${Measurement}${Delimeter}${Cycle}${Delimeter}${TimePeriod}",
        
        _isEnsemble: function(scenarioOptions){
            return (scenarioOptions.Model.indexOf('ensemble') > -1);
        },
        _isHistorical: function(scenarioOptions){
            return (scenarioOptions.TimePeriod.indexOf('1951') > -1);
        },
        getUrlTemplate: function(scenarioOptions){
            if (this._isHistorical(scenarioOptions)) {
                return this._historicalUrl;
            }
            else {
                return (this._isEnsemble(scenarioOptions)) ? this._ensembleUrl : this._nonEnsembleUrl;
            }
        },
        getMosaicNameTemplate: function(scenarioOptions){
            return (this._isHistorical(scenarioOptions)) ? this._mosaicNameHistoricalTemplate : this._mosaicNameFutureTemplate;
        }
    },
    
    // MOSAIC WHERE CLAUSE
    mosaicWhere: '',
    // INITIAL GLOBAL EXTENT
    initialGlobalExtent: null,
    
    constructor: function(params){
    
        // MOSAIC WHERE CLAUSE
        this.mosaicWhere = '';
        
        // LAYER ID
        this.id = params.id;
        
        var initialUSExtent = new esri.geometry.Extent({
            "xmin": -14568286.09492447,
            "ymin": 2685691.425827251,
            "xmax": -7249899.258790501,
            "ymax": 6746026.368334735,
            "spatialReference": {
                "wkid": 102113
            }
        });
        var initialGlobalExtent2 = new esri.geometry.Extent({
            "xmin": -20037507.0671618,
            "ymin": -19971868.8804086,
            "xmax": 20037507.0671618,
            "ymax": 19971868.8804086,
            "spatialReference": {
                "wkid": 102113
            }
        });
        
        // INITIAL GLOBAL EXTENT
        this.initialGlobalExtent = new esri.geometry.Extent({
            "xmin": -14401959.121376038,
            "ymin": -5968203.168505022,
            "xmax": 14871588.223160036,
            "ymax": 10273136.601525018,
            "spatialReference": {
                "wkid": 102113
            }
        });
        this.initialExtent = this.fullExtent = initialGlobalExtent2;
        this.spatialReference = this.initialExtent.spatialReference;
        
        this.loaded = true;
        this.onLoad(this);
        
        // WAIT 4 SECONDS...
        setTimeout(function(){
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
    
    // THIS METHOD GENERATES AN IMAGE URL THAT THE LAYER DISPLAYS ON THE MAP
    getImageUrl: function(extent, width, height, callback){
        if (this.mosaicWhere === '') {
            console.warn("No Mosaic Attribute Where specified...");
            return;
        }
        // BUILD REQUEST PARAMETERS
        var params = {
            size: width + "," + height,
            format: "png",
            transparent: true,
            noData: 0,
            interpolation: 'RSP_NearestNeighbor', // RSP_BilinearInterpolation | RSP_CubicConvolution | RSP_Majority | RSP_NearestNeighbor
            imageSR: extent.spatialReference.wkid,
            bboxSR: extent.spatialReference.wkid,
            bbox: dojo.string.substitute("${xmin},${ymin},${xmax},${ymax}", extent),
            mosaicRule: dojo.toJson({
                mosaicMethod: "esriMosaicAttribute",
                where: this.mosaicWhere,
                sortField: "Name"
            }),
            f: "image"
        };
        
        // GET THE IMAGE SERVICE URL
        var imageSericeUrl = this._getImageServiceUrl();
        // BUILD IMAGE SERVICE REQUEST URL
        var imageUrl = dojo.string.substitute("${0}/exportImage?${1}", [imageSericeUrl, dojo.objectToQuery(params)]);
        //console.log(imageUrl);
        
        // SEND BACK SERVER URL OF IMAGE
        callback(imageUrl);
    },
    
    // ARE THE CURRENT OPTIONS SET FOR GLOBAL OR US?
    isGlobal: function(){
        return ((this.scenarioOptions.AnalyisArea === 'AR4_Global_50k') || (this.scenarioOptions.AnalyisArea === 'cru50k'));
    },
    
    // GET THE IMAGE SERVICE URL
    _getImageServiceUrl: function(){
        var imageServiceName = this.isGlobal() ? "Global3Band" : "US3Band";
        var imageServiceUrl = dojo.string.substitute("http://maps.esri.com/APL6/rest/services/TNC2/${0}/ImageServer", [imageServiceName]);
        //console.log(imageServiceUrl);
        return imageServiceUrl;
    },
    
    // SCENARIO MOSAIC NAME
    getMosaicName: function(delim){
    
        // MOSAIC NAME TEMPLATE
        var mosaicNameTemplate = this.theTemplates.getMosaicNameTemplate(this.scenarioOptions);
        
        // IMAGE SERVIVE OPTIONS
        var imageServiceOptions = dojo.clone(this.scenarioOptions);
        // IMAGE SERVICE CHANGES:
        // depart_change = 'c'
        // trend_change_rate = 'c'
        // mean = 'm'
        // trend_pVal = 'p'
        // AR4_Global_50k_ = ''
        // AR4_US_12k_ = ''
        // cru50k = ''
        // prism = ''
        // ensemble = 'ens' (*** NO LONGER DOING THIS ***)         
        switch (imageServiceOptions.MapOption) {
            case 'mean':
                imageServiceOptions.MapOption = 'm';
                break;
            case 'depart_change':
                imageServiceOptions.MapOption = 'c';
                break;
            case 'trend_change_rate':
                imageServiceOptions.MapOption = 'c';
                break;
            case 'trend_pVal':
                imageServiceOptions.MapOption = 'p';
                break;
        }
        //if (imageServiceOptions.Model.indexOf('ensemble') > -1) {
        //    imageServiceOptions.Model = imageServiceOptions.Model.replace('ensemble', 'ens');
        // }
        imageServiceOptions.Delimeter = delim;
        
        // MOSAIC NAME        
        var mosaicName = dojo.string.substitute(mosaicNameTemplate, imageServiceOptions);
        
        return mosaicName;
    },
    
    // GET STATIC LEGEND BASED ON CURRENT SCENARIO OPTIONS
    getScenarioLegend: function(){
        var scenarioLegendOptions = dojo.clone(this.scenarioOptions);
        scenarioLegendOptions.WebFolder = 'http://maps.esri.com/Labs6/ClimateChangeData/Legends';
        scenarioLegendOptions.Legend = '_Legend';
        var urlTemplate = this.theTemplates.getUrlTemplate(scenarioLegendOptions);
        var legendUrl = dojo.string.substitute(urlTemplate, scenarioLegendOptions);
        //console.log(legendUrl);        
        return legendUrl;
    },
    
    // SET SCENARIO OPTIONS (SEE 'SCENARIO OPTIONS' SECTION ABOVE)
    setScenarioOptions: function(scenarioOptions){
        this.scenarioOptions = scenarioOptions;
        var mosaicName = this.getMosaicName("_");
        this.mosaicWhere = dojo.string.substitute("Name = '${0}'", [mosaicName]);
        //console.log(this.mosaicWhere);   				     
        this.refresh();
    },
    
    // IDENTIFY: GET ALL MODEL AND SCENARIO VALUES AT INPUT LOCATION
    identify: function(map, evt){
    
        try {
            this._identify(map, evt);
        } 
        catch (e) {
            console.error(e);
						throw new Error("Not able to Identify at this location.");
        }
    },
    
    _identify: function(map, evt){
    
        // IDENTIFY DIALOG
        var identifyDlg = dijit.byId('identifyDlg');
        identifyDlg.attr('title', 'Get Scenario values for all Models');
        identifyDlg.show();
        
        esri.show(dojo.byId('identifyBusy'));
        dojo.byId('identifyChartNode').innerHTML = '';
        dojo.byId('identifyChartLegendNodeParent').innerHTML = '';
        dijit.byId('identifyResultsTable').containerNode.innerHTML = '';
        
        var isGlobal = this.isGlobal();
        var queryDelimeter = "~";
        var mosaicQueryName = this.getMosaicName(queryDelimeter);
        var geoPoint = (map.spatialReference.wkid === 102113) ? esri.geometry.webMercatorToGeographic(evt.mapPoint) : evt.mapPoint;
        
        var gpInputParams = {
            Input_Name: mosaicQueryName,
            Delimiter: queryDelimeter,
            Scope: isGlobal,
            X: geoPoint.x,
            y: geoPoint.y
        };
        //console.log(dojo.toJson(gpInputParams, true));
        
        var _mc = this._makeChart;
        var _so = this.scenarioOptions;
        
        try {
        
            var gpTaskUrl = "http://maps.esri.com/APL4/rest/services/TNC/TNC_CellValue1/GPServer/TNC_GetCellValuesAll";
            //var gpTaskUrl = "http://maps.esri.com/APL4/rest/services/TNC/TNC_CellValue/GPServer/TNC_GetCellValuesAll";
            
            var gpTask = new esri.tasks.Geoprocessor(gpTaskUrl);
            gpTask.submitJob(gpInputParams, function(results){
                //console.log(results);
                dojo.byId('identifyGPStatus').innerHTML = "Getting Cell Values...";
                gpTask.getResultData(results.jobId, 'Model_Values', function(result){
                    dojo.byId('identifyGPStatus').innerHTML = "Creating Chart...";
                    try {
                        _mc(result.value, _so);
                        esri.hide(dojo.byId('identifyBusy'));
                        dojo.byId('identifyGPStatus').innerHTML = dojo.string.substitute("Lon: <b>${x}</b><br/>Lat: <b>${y}</b>", geoPoint, function(val){
                            return dojo.number.format(val, {
                                places: 4
                            })
                        });
                    } 
                    catch (e) {
                        console.error(e);
                        esri.hide(dojo.byId('identifyBusy'));
                        dojo.byId('identifyGPStatus').innerHTML = '';
                        //dojo.byId('identifyGPStatus').innerHTML = dojo.toJson(e, true);
                    }
                });
            }, function(jobInfo){
                var lastMsg = jobInfo.messages[jobInfo.messages.length - 1].description;
                dojo.byId('identifyGPStatus').innerHTML = lastMsg;
                
            }, function(gpError){
                console.error(gpError);
                esri.hide(dojo.byId('identifyBusy'));
                dojo.byId('identifyGPStatus').innerHTML = '';
                //dojo.byId('identifyGPStatus').innerHTML = dojo.toJson(gpError, true);
            });
        } 
        catch (e) {
            console.error(e);
            esri.hide(dojo.byId('identifyBusy'));
            dojo.byId('identifyGPStatus').innerHTML = '';
            //dojo.byId('identifyGPStatus').innerHTML = dojo.toJson(e, true);
        }
        
    },
    
    _makeChart: function(cellValues, scenarioOptions){
        //console.log(cellValues);
        
        var minY = Number.MAX_VALUE;
        var maxY = Number.MIN_VALUE;
        
        var allScenarioNames = ["b1", "a1b", "a2"];
        var allData = [];
        
        dojo.forEach(allScenarioNames, function(scenarioName){
            allData[scenarioName] = dojo.map(cellValues.features, function(feature, fIdx){
                var modelName = feature.attributes.Model;
                var thisY = feature.attributes[scenarioName];
                maxY = Math.max(maxY, thisY);
                minY = Math.min(minY, thisY);
                
                return {
                    x: fIdx,
                    y: thisY,
                    tooltip: dojo.string.substitute("Model: <b>${0}</b><br/>Value: <b>${1}</b>", [modelName, thisY])
                };
            });
        });
        
        var headerRow = "<tr style='color:#E4E6D7;background-color:gray;'><th>Model</th><th>B1</th><th>A1B</th><th>A2</th></tr>";
        var valuesRows = dojo.map(cellValues.features, function(feature, fIdx){
            var bgColor = (fIdx % 2 === 0) ? 'gainsboro' : 'whitesmoke';
            var atts = feature.attributes;
            return dojo.string.substitute("<tr style='background-color:${4};'><th>${0}</th><td>${1}</td><td>${2}</td><td>${3}</td></tr>", [atts['Model'], atts['b1'], atts['a1b'], atts['a2'], bgColor], function(val){
                return isNaN(val) ? val : dojo.number.format(val, {
                    places: 2
                });
            });
        });
        var valuesTable = dojo.string.substitute("<center><table id='valTable' cellpadding='4' rules='cols' frame='box' style='font-size:x-small;'>${0}${1}</table></center>", [headerRow, valuesRows.join('')]);
        dijit.byId('identifyResultsTable').containerNode.innerHTML = valuesTable;
        
        dojo.query('th, td', 'valTable').forEach(function(tableNode){
            dojo.attr(tableNode, 'align', 'center');
        });
        dojo.query('td', 'valTable').forEach(function(tableNode){
            dojo.attr(tableNode, 'width', '30px');
        });
        
        var midY = (minY + ((maxY - minY) * 0.5));
        var maxCount = allData["b1"].length;
        var measurementType = (scenarioOptions.Measurement === 'pptPct') ? ' mm' : " &#176;";
        var theme = (scenarioOptions.Measurement === 'pptPct') ? dojox.charting.themes.PlotKit.blue : dojox.charting.themes.PlotKit.red;
        
        var chartNode = dojo.byId('identifyChartNode');
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
            labelFunc: function(value){
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
        
        dojo.forEach(allScenarioNames, function(scenarioName){
            chart.addSeries("Scenario " + scenarioName, allData[scenarioName]);
        });
        
        var animb = new dojox.charting.action2d.Highlight(chart, "default");
        var animc = new dojox.charting.action2d.Tooltip(chart, "default");
        var anima = new dojox.charting.action2d.Magnify(chart, "default", {
            scale: 2.0
        });
        chart.render();
        
        
        var chartLegendNode = dojo.create('div');
        dojo.byId('identifyChartLegendNodeParent').innerHTML = '';
        dojo.byId('identifyChartLegendNodeParent').appendChild(chartLegendNode);
        
        var chartLegend = new dojox.charting.widget.Legend({
            id: dijit.getUniqueId('identifyChartLegend'),
            chart: chart,
            horizontal: true
        }, chartLegendNode);
        
        
        //console.log(chart);        
    }
    
});
//============================================================================================
//============================================================================================
//============================================================================================
// GET VALUES DIALOG: ADD TO BODY OF HTML
/*
 <div id="identifyDlg" class="nihilo" dojotype="dijit.Dialog" title="Identify" draggable="true" style="width:775px; height:575px; overflow:hidden;">
 <div id="identifyChartPane" dojotype="dijit.layout.BorderContainer" title="Model Values" style="width:755px; height:525px; overflow:hidden; font-size:small;">
 <div dojotype="dijit.layout.ContentPane" region="top" style="height:35px; overflow:hidden;">
 <center>
 <span id="identifyGPStatus"></span>
 <img id="identifyBusy" src="./images/busy.gif" align="absmiddle" />
 </center>
 </div>
 <div id="identifyChartParent" dojotype="dijit.layout.BorderContainer" region="center" design="sidebar">
 <div id="identifyResultsTable" dojotype="dijit.layout.ContentPane" region="right" style="width:240px;"></div>
 <div dojotype="dijit.layout.ContentPane" region="center" style="overflow:hidden;">
 <div id="identifyChartNode" style="width:450px; height:400px; overflow:hidden;"></div>
 </div>
 <div id="identifyChartLegendNodeParent" dojotype="dijit.layout.ContentPane" region="bottom" style="height:30px;"></div>
 </div>
 </div>
 </div>
 */
//============================================================================================
//============================================================================================
//============================================================================================


