
dojo.require("esri.map");

var map;
var resizeTimer;
var climateChangeLayer = null;

var initialUSExtent;
var initialGlobalExtent;


function init(){

    initialUSExtent = new esri.geometry.Extent({
        "xmin": -14568286.09492447,
        "ymin": 2685691.425827251,
        "xmax": -7249899.258790501,
        "ymax": 6746026.368334735,
        "spatialReference": {
            "wkid": 102113
        }
    });
    
    initialGlobalExtent = new esri.geometry.Extent({
        "xmin": -14401959.121376038,
        "ymin": -5968203.168505022,
        "xmax": 14871588.223160036,
        "ymax": 10273136.601525018,
        "spatialReference": {
            "wkid": 102113
        }
    });
    
    map = new esri.Map("mapDiv", {
        extent: initialUSExtent
    });
    
    dojo.connect(map, 'onLoad', function(theMap){
        dojo.connect(dijit.byId('mapDiv'), 'resize', function(){
            resizeMap();
        });
        
        try {
            climateChangeLayer = new apl.ClimateChangeLayer({
                id: 'ClimateChange'
            });
            map.addLayer(climateChangeLayer);
            climateChangeLayer.setOpacity(0.7);
        } 
        catch (e) {
            console.error(e);
        }
        
        var scenarioOptions = {
            //WebFolder: 'http://maps.esri.com/Labs6/ClimateChangeData',
            //Legend: '_noLegend',
            //Delimeter: "_",
            MapOption: 'depart_change',
            AnalyisArea: 'AR4_US_12k',
            Model: 'cccma_cgcm3_1.1',
            Scenario: 'a2',
            Measurement: 'tmean',
            Cycle: '14',
            TimePeriod: '2070_2099'
        };
        
        var urlObj = esri.urlToObject(window.location.search);
        if (urlObj.query) {
            scenarioOptions = dojo.mixin(scenarioOptions, urlObj.query);
        }
        
        dijit.byId('scenarioOptionsNode').attr('value', dojo.toJson(scenarioOptions, true));
        getImage();
    });
    
    // ADD BASELAYER    
    var baseLayerUrl = "http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer";
    var baseLayer = new esri.layers.ArcGISTiledMapServiceLayer(baseLayerUrl, {
        id: 'AGOLTopo'
    });
    map.addLayer(baseLayer);
}

function getImage(){

    var scenarioOptionsStr = dijit.byId('scenarioOptionsNode').attr('value');
    // console.log(scenarioOptionsStr);
    var scenarioOptions = dojo.fromJson(scenarioOptionsStr);
    
    climateChangeLayer.setScenarioOptions(scenarioOptions);
    var mosaicName = climateChangeLayer.getMosaicName("_");
    dijit.byId('imageName').attr('value', mosaicName);
    
    //dojo.byId('footer').innerHTML = imageNameWhereClause;   
    
    if (climateChangeLayer.isGlobal()) {
				map.setExtent(initialGlobalExtent);
    }
    else {
			map.setExtent(initialUSExtent);
    }
    
}

//Handle resize of browser
function resizeMap(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function(){
        map.resize();
        map.reposition();
    }, 800);
}

//show map on load 
dojo.addOnLoad(init);
