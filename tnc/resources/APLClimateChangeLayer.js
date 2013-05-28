
/**
 * @author John Grayson, APL ESRI, Nov 2009
 *
 * apl.ClimateChangeLayer : esri.layers.DynamicMapServiceLayer
 *
 */
//============================================================================================
//============================================================================================
//============================================================================================

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

//============================================================================================
//============================================================================================
//============================================================================================


dojo.declare("apl.ScenarioOptions", null, {

  initialUSExtent: null,
  initialGlobalExtent: null,
  
  options: {
    //WebFolder: 'http://174.129.35.252/ClimateChangeData',
	WebFolder: 'http://www.climatewizard.org/ClimateChangeData',
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
    
    _isEnsemble: function(scenarioOptions) {
      return (scenarioOptions.Model.indexOf('ensemble') > -1);
    },
    _isHistorical: function(scenarioOptions) {
      return (scenarioOptions.TimePeriod.indexOf('1951') > -1);
    },
    getUrlTemplate: function(scenarioOptions) {
      if (this._isHistorical(scenarioOptions)) {
        return this._historicalUrl;
      } else {
        return (this._isEnsemble(scenarioOptions)) ? this._ensembleUrl : this._nonEnsembleUrl;
      }
    },
    getMosaicNameTemplate: function(scenarioOptions) {
      return (this._isHistorical(scenarioOptions)) ? this._mosaicNameHistoricalTemplate : this._mosaicNameFutureTemplate;
    }
  },
  
  constructor: function(scenarioOptions) {
  
    // SET INITIAL SCENARIO OPTIONS
    if (scenarioOptions != null) {
      this.options = dojo.mixin(this.options, scenarioOptions);
    }
    
    // US EXTENT
    this.initialUSExtent = new esri.geometry.Extent({
      "xmin": -14568286.09492447,
      "ymin": 2685691.425827251,
      "xmax": -7249899.258790501,
      "ymax": 6746026.368334735,
      "spatialReference": {
        "wkid": 102113
      }
    });
    
    // GLOBAL EXTENT
    this.initialGlobalExtent = new esri.geometry.Extent({
      "xmin": -20037507.0671618,
      "ymin": -19971868.8804086,
      "xmax": 20037507.0671618,
      "ymax": 19971868.8804086,
      "spatialReference": {
        "wkid": 102113
      }
    });
  },
  
  // SET SCENARIO OPTIONS (SEE 'SCENARIO OPTIONS' SECTION ABOVE)
  setOptions: function(scenarioOptions) {
    this.options = scenarioOptions;
  },
  
  // ARE THE CURRENT OPTIONS SET FOR GLOBAL OR US?
  isGlobal: function() {
    return ((this.options.AnalyisArea === 'AR4_Global_50k') || (this.options.AnalyisArea === 'cru50k'));
  },
  
  // GET THE IMAGE SERVICE URL
  getImageServiceUrl: function() {
    var imageServiceName = this.isGlobal() ? "Global3Band" : "US3Band";
    var imageServiceUrl = dojo.string.substitute("http://www.climatewizard.org/ArcGIS/rest/services/TNC/${0}/ImageServer", [imageServiceName]);
    //console.log(imageServiceUrl);
    return imageServiceUrl;
  },
  
  // SCENARIO MOSAIC NAME
  getMosaicName: function(delim) {
  
    // MOSAIC NAME TEMPLATE
    var mosaicNameTemplate = this.theTemplates.getMosaicNameTemplate(this.options);
    
    // IMAGE SERVIVE OPTIONS
    var imageServiceOptions = dojo.clone(this.options);
    // IMAGE SERVICE CHANGES:
    // depart_change = 'c'
    // trend_change_rate = 'c'
    // mean = 'm'
    // trend_pVal = 'p'
    // AR4_Global_50k_ = ''
    // AR4_US_12k_ = ''
    // cru50k = ''
    // prism = ''
    // ensemble = 'ens' (*** NO LONGER DOING THIS ?!?!? ***)         
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
  getLegend: function() {
    var scenarioLegendOptions = dojo.clone(this.options);
    scenarioLegendOptions.WebFolder = 'http://www.climatewizard.org/ClimateChangeData/Legends';
    scenarioLegendOptions.Legend = '_Legend';
    var urlTemplate = this.theTemplates.getUrlTemplate(scenarioLegendOptions);
    var legendUrl = dojo.string.substitute(urlTemplate, scenarioLegendOptions);
    //console.log(legendUrl);        
    return legendUrl;
  },
  
  getStaticImage: function() {
    var scenarioLegendOptions = dojo.clone(this.options);
    scenarioLegendOptions.Legend = '';
    var urlTemplate = this.theTemplates.getUrlTemplate(scenarioLegendOptions);
    var staticUrl = dojo.string.substitute(urlTemplate, scenarioLegendOptions);
    var staticImage = dojo.string.substitute("<img src='${0}' align='absmiddle' width='100%' height='100%' />", [staticUrl]);
    return staticImage;
  },
  
  // THIS METHOD GENERATES AN IMAGE URL
  getImageUrl: function(extent, width, height) {
  
    if (extent == null) {
      extent = this.isGlobal() ? this.initialGlobalExtent : this.initialUSExtent;
    }
    
    var mosaicName = this.getMosaicName("_");
    var mosaicWhere = dojo.string.substitute("Name = '${0}'", [mosaicName]);
    
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
        where: mosaicWhere,
        sortField: "Name"
      }),
      f: "image"
    };
    
    // GET THE IMAGE SERVICE URL        
    var imageSericeUrl = this.getImageServiceUrl();
    // BUILD IMAGE SERVICE REQUEST URL
    var imageUrl = dojo.string.substitute("${0}/exportImage?${1}", [imageSericeUrl, dojo.objectToQuery(params)]);
    //console.log(imageUrl);
    
    // SEND BACK SERVER URL OF IMAGE
    return imageUrl;
  }
  
});

//============================================================================================
//============================================================================================
//============================================================================================



// CLIMATE CHANGE LAYER
//  - THIS CUSTOM DYNAMIC LAYER WILL RETRIEVE IMAGES FROM TWO
//    IMAGE SERVER SERVICES BASED ON USER SPECIFIED OPTIONS.
//    SEE 'SCENARIO OPTIONS' SECITON ABOVE.  
dojo.declare("apl.ClimateChangeLayer", esri.layers.DynamicMapServiceLayer, {

  // SCENARIO OPTIONS (apl.ScenarioOptions)
  scenarioOptions: null,
  
  // GET CELL VALUES DIJIT
 // getCellValuesDijit: null,
  
  constructor: function(params) {
  
    // SCENARIO OPTIONS
    this.scenarioOptions = new apl.ScenarioOptions();
    
    // LAYER ID
    this.id = params.id;
    
    // GLOBAL EXTENT
    var initialGlobalExtent = new esri.geometry.Extent({
      "xmin": -20037507.0671618,
      "ymin": -19971868.8804086,
      "xmax": 20037507.0671618,
      "ymax": 19971868.8804086,
      "spatialReference": {
        "wkid": 102113
      }
    });
    
    // INITIAL EXTENT
    this.initialExtent = this.fullExtent = initialGlobalExtent;
    // SPATIAL REFERENCE
    this.spatialReference = this.initialExtent.spatialReference;
    
    // GET CELL VALUES DIJIT
 //   this.getCellValuesDijit = new apl.dijit.GetCellValues();
    
    // LAYER IS LOADED
    this.loaded = true;
    this.onLoad(this);
  },
  
  // SET SCENARIO OPTIONS (SEE 'SCENARIO OPTIONS' SECTION ABOVE)
  setScenarioOptions: function(scenarioOptions, refreshLayer) {
    this.scenarioOptions.setOptions(scenarioOptions);
    if (refreshLayer) {
      this.refresh();
    }
  },
  
  // THIS METHOD GENERATES AN IMAGE URL THAT THE LAYER DISPLAYS ON THE MAP
  getImageUrl: function(extent, width, height, callback) {
    if (this.scenarioOptions == null) {
      console.warn("No Scenario Options specified...");
      return;
    }
    var imageUrl = this.scenarioOptions.getImageUrl(extent, width, height);
    //console.log(imageUrl);    
    // SEND BACK SERVER URL OF IMAGE
    callback(imageUrl);
  },
  
  getMosaicName: function(delim) {
    if (this.scenarioOptions == null) {
      console.warn("No Scenario Options specified...");
      return;
    }
    var mosaicName = this.scenarioOptions.getMosaicName(delim);
    //console.log(mosaicName);
    return mosaicName;
  },
  
  isGlobal: function() {
    if (this.scenarioOptions == null) {
      console.warn("No Scenario Options specified...");
      return;
    }
    var isGlobal = this.scenarioOptions.isGlobal();
    //console.log(isGlobal); 
    return isGlobal;
  },
  
  // GET STATIC LEGEND BASED ON CURRENT SCENARIO OPTIONS
  getScenarioLegend: function() {
    if (this.scenarioOptions == null) {
      console.warn("No Scenario Options specified...");
      return;
    }
    var legendUrl = this.scenarioOptions.getLegend();
    //console.log(legendUrl);        
    return legendUrl;
  },
  
  getScenarioStatic: function() {
    if (this.scenarioOptions == null) {
      console.warn("No Scenario Options specified...");
      return;
    }
    var staticUrl = this.scenarioOptions.getStatic();
    //console.log(staticUrl);        
    return staticUrl;
  }//,
  
  // GET ALL MODEL AND SCENARIO VALUES AT INPUT LOCATION
//  getCellValues: function(map, evt) {
//    try {
 //     if (this.getCellValuesDijit != null) {
 //       this.getCellValuesDijit.getCellValues(evt, map, this.scenarioOptions);
//      }
//    } catch (e) {
//      console.error(e);
//      throw new Error("Not able to Identify at this location.");
 //   }
 // }
  
});

//============================================================================================
//============================================================================================
//============================================================================================



