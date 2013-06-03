//"use strict";
var map, basemapLayer, grayLayer, extentGraphicsLayer, provLayer;
var birdsQueryLayer, mammalsQueryLayer, amphibiansQueryLayer;
var birdsLayer, mammalsLayer, amphibiansLayer, gainLossTurnoverRichnessLayer;
var mammalsStore, amphibiansStore, birdsStore;
var mammalsStore_sc, amphibiansStore_sc, birdsStore_sc;
var currentLayer, species_type, species_ID, newMapExtent, currentMosaicName, currentCategory, currentOption, currentModel;
var birdsURL, mammalsURL, amphibiansURL, gainLossTurnoverRichnessURL;
var cwcontentlayer;
var lookup;
var gpBusy = false, timeoutHandler, iTip;

dojo.require("esri.layers.FeatureLayer");


function secondinit() {

	//esri.config.defaults.map.zoomDuration = 300;
	//esri.config.defaults.map.panDuration = 600;

	var tcombo = dijit.registry.byId('timecombo');	
	dojo.connect(tcombo, 'onChange', changeCategory);
	
	var tcombo = dijit.registry.byId('modelcombo');	
	dojo.connect(tcombo, 'onChange', changeCategory);
	
	var tcombo = dijit.registry.byId('emcombo');	
	dojo.connect(tcombo, 'onChange', changeCategory);
	
	var initialExtent = new esri.geometry.Extent({
		"xmin" : 8167354,
		"ymin" : 1931985,
		"xmax" : 15120415,
		"ymax" : 7200383,
		"spatialReference" : {
			"wkid" : 102100
		}
	});
	
	//custom zoom-levels for the map
	var lods = [{
		"level" : 2,
		"resolution" : 39135.7584820001,
		"scale" : 147914381.897889
	}, {
		"level" : 3,
		"resolution" : 19567.8792409999,
		"scale" : 73957190.948944
	}, {
		"level" : 4,
		"resolution" : 9783.93962049996,
		"scale" : 36978595.474472
	}, {
		"level" : 5,
		"resolution" : 4891.96981024998,
		"scale" : 18489297.737236
	}, {
		"level" : 6,
		"resolution" : 2445.98490512499,
		"scale" : 9244648.868618
	}];

	//create the map control
	map = new esri.Map("mapdiv", {
		extent : initialExtent,
		fitExtent : true,
		//lods : lods,
		navigationMode : 'classic',
		//infoWindow : popup,
		wrapAround180 : true
	});

	//connect events on the map control
	dojo.connect(map, "onUpdateStart", function() {
		dojo.byId("loadingImage").style.display = "";
	});
	dojo.connect(map, "onUpdateEnd", function() {
		dojo.byId("loadingImage").style.display = "none";
	});

	dojo.connect(map, 'onLoad', function() {
		dojo.connect(dijit.byId('mapdiv'), 'resize', map, map.resize);
		showBaseMapGallery();
		dojo.connect(map, "onMouseMove", showCoords);
		dojo.connect(map, "onExtentChange", onMapExtentChange);
//
		onMapExtentChange();
		showCoords(map.extent.getCenter());
//		console.log("*** MAP Loaded ****");
		
//		hideLoader();
		
//		dojo.byId("preloader_loading_image").style.display = "none";
//		dojo.byId("preloader_button").style.display = "block";
		//setTimeout(hideLoader, 2000);
	});
	//add a default base map
	
	var basemapurl = "http://services.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer";
	basemapLayer = new esri.layers.ArcGISTiledMapServiceLayer(basemapurl, {
		id : "basemapLayer"
	});
	map.addLayer(basemapLayer);
	
   cwcontentlayer = new esri.layers.ArcGISDynamicMapServiceLayer(
  "http://tnc.usm.edu/ArcGIS/rest/services/cwchina/cwchina/MapServer",
  {useMapImage:true, opacity:0.7});
  
  dojo.style("legend_image", "opacity", 0.7);
  
  lookup=new Object();
  
  	dojo.connect(cwcontentlayer, "onLoad", function() {
  	
  		layinfos = cwcontentlayer.layerInfos;
  		
  		for (li in layinfos)
  			{
	  			lookup[layinfos[li].name] = layinfos[li].id;
	  	     }
  
  	    afterInit();
	});
	
  
  	map.addLayer(cwcontentlayer);
  
  	provLayer = new esri.layers.FeatureLayer("http://tnc.usm.edu/ArcGIS/rest/services/cwchina/provinces/MapServer/0",{
	        mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
	        outFields: ["*"]
	       });
	
	selectionSymbol = new esri.symbol.SimpleFillSymbol().setColor(new dojo.Color([255,255,0,0]));
	provLayer.setSelectionSymbol(selectionSymbol);
	       
	dojo.connect(provLayer, 'onUpdateEnd', selProv);       
	
	         
	map.addLayers([provLayer]);
	       
	//query = new esri.tasks.Query();
	//query.where = "FID > -1";
	//provLayer.selectFeatures(query,esri.layers.FeatureLayer.SELECTION_NEW, selProv);
	
	
				
}


function selProv() {
	
	selfeats = provLayer.graphics;	
	
	//alert(selfeats)
	
	
	for (sel in selfeats) {
		
		//alert(selfeats[sel].attributes['prov_name']);

		provc = dijit.registry.byId('provcombo');
		
		var newoption = {};
		newoption.selected = false;
		newoption.disabled = false;
		
		newoption.value = sel;
		newoption.label = selfeats[sel].attributes['prov_name'];

		//provc.store.put({ type : 'options', value : 3, text : 'Bbbbb, Bbb' });
		provc.addOption(newoption);
		
	}
	
	
	FeatureExtent = esri.graphicsExtent(provLayer.graphics);
		
	map.setExtent(FeatureExtent, true);
		
	
	
}

function zoomto(val) {

	selfeats = provLayer.graphics;	
	
	if (val == "All") {
	
	FeatureExtent = esri.graphicsExtent(selfeats);
	
	provLayer.clearSelection()
		
	} else {

	pname = selfeats[val].attributes['prov_name']
	
	query = new esri.tasks.Query();
	query.where = "prov_name = '" + pname + "'";
	
	provLayer.selectFeatures(query,esri.layers.FeatureLayer.SELECTION_NEW)
	
	FeatureExtent = esri.graphicsExtent([selfeats[val]]);
	
	}
	
	
	map.setExtent(FeatureExtent, true);
	
	
}


function worldzoomto(val) {

	element = document.getElementById('worldregions');
	
	element.value = val;
	
	changemap();

}


//things that can be done after initlization to speedup the app
function afterInit() {
	iTip = new infoTip("itipdiv", "infoTip round shadow", {
		x : 10,
		y : 0
	}, false);
	iTip.setLocation("right");
	dojo.query(".tip").forEach(function(node, index, nodeList) {
		dojo.connect(node, 'onmouseover', showTip);
		dojo.connect(node, 'onmouseout', hideTip);
	});

	//set this as the default option
	chooseOption("historical");
	currentCategory = "specific_species";
}

function showTip(evt) {
	dojo.stopEvent(evt);
	//console.log(evt);
	if (evt && evt.target && evt.target.id && (evt.x || evt.clientX)) {
		var id = evt.target.id;
		iTip.setContent(helpcontent_data[id]);
		iTip.show({
			x : evt.x || evt.clientX,
			y : evt.y || evt.clientY
		});
	}
}

function hideTip(evt) {
	iTip.hide();
}

function hideLoader() {
	dojo.fadeOut({
		node : "preloader",
		duration : 700,
		onEnd : function() {
			dojo.style("preloader", "display", "none");
		}
	}).play();
}

//called when category radio buttons are clicked
function changeCategory(e) {


	globalcombo = dijit.registry.byId('globalRadio');
	
	
	var tcombo = dijit.registry.byId('timecombo');	
	
	
	 timelookup = {"Annual": "14", "Dec - Feb":"15", "Mar - May":"16", "June - Aug":"17", "Sept - Nov":"18","January":"1","February":"2","March":"3","April":"4","May":"5","June":"6","July":"7","August":"9","September":"9","October":"10","November":"11","December":"12"}
	 
	 tv = timecombo.value;
	 
	 tv = tv.replace("Sept_Nov","Sept - Nov").replace("Mar_May","Mar - May").replace("Dec_Feb","Dec - Feb").replace("June_Aug","June - Aug")
	 
	outtv = timelookup[tv];
	
	element = document.getElementById('cycledropdown');
	element.value = outtv;	
	
	var mcombo = dijit.registry.byId('modelcombo');	
	
	var ecombo = dijit.registry.byId('emcombo');	

	var mradio = dijit.registry.byId('midRadio');
	var eradio = dijit.registry.byId('endRadio');
	var pradio = dijit.registry.byId('preRadio');
	var tradio = dijit.registry.byId('tempRadio');
	var cradio = dijit.registry.byId('changeRadio');
	var aradio = dijit.registry.byId('averageRadio');
		
	element = document.getElementById('precip');
	element.checked = pradio.checked;

	element = document.getElementById('averagetemp');
	element.checked = tradio.checked;
	
	element = document.getElementById('mapdifference');
	element.checked = cradio.checked;
	
	element = document.getElementById('mapaverage');
	element.checked = aradio.checked;

	element = document.getElementById('mid');
	element.checked = mradio.checked;
	
	element = document.getElementById('end');
	element.checked = eradio.checked;	
	
	element = document.getElementById('emmiscenario');
	element.value = ecombo.value.toLowerCase();	

	if (currentOption == "historical") { 
		aradio.set('checked', true);
		element = document.getElementById('past');
		element.checked = true;	
	}
	
	if (mcombo.value == "RegCM3") {
		ecombo.set('value', "A1B");
	}
	
	
	var mappart, clvpart, ypart
	
	if (aradio.checked == true) {
		
		mappart = "map_mean"
		
	} else {
		
		mappart = "map_depart"
	}
	
	
	if (tradio.checked == true) {
		
		clvpart = "tmp"
		
	} else {
		
		clvpart = "ppt"
	}
	
	if (mradio.checked == true) {
		
		ypart = "2040_2069"
	
	} else {
		
		ypart = "2070_2099"
	}
	
	if (currentOption == "historical") { 
		var qstring = mappart + "_" + clvpart + "_" + tcombo.value + "_1961_2008"
	} else {
		var qstring = mappart + "_" + mcombo.value + "_" + ecombo.value + "_" + clvpart + "_" + tcombo.value + "_" + ypart
	}

	//alert(qstring)
	
	var slay = lookup[qstring];
	
	var lays = [];
	
	lays.push(slay);
	
	cwcontentlayer.setVisibleLayers(lays)
	
	if (globalcombo.checked == true) {
	
		
		dojo.byId("globaloptions").style.display = "";
		dojo.byId("chinaoptions").style.display = "none";
		
		cwcontentlayer.hide();
		provLayer.hide();
		
		climateChangeLayer.show();
		
		dojo.style("legend_image", "display", "none");
	    dojo.style("legend", "display", "");
		
	} else {
		
	    dojo.byId("globaloptions").style.display = "none";
		dojo.byId("chinaoptions").style.display = "";
	
				
		prcombo = dijit.registry.byId('provcombo');	
		
		if (provLayer.loaded == true) {
		 zoomto(prcombo.value);
		}
		
		cwcontentlayer.show();
		provLayer.show();
		
		climateChangeLayer.hide();
		
		dojo.style("legend_image", "display", "");
	    dojo.style("legend", "display", "none");
	    
	    
	    alegloc = clvpart + mappart.replace("map","");
	    
	    dojo.byId("legend_image").src = "images/legends/" + alegloc + ".png";

		
	}
	
	
	changemap();
	
	
		
	//console.log("Inside change categorgy");
	//currentCategory = e.target.value;
	//console.log("Got value: " + currentCategory);
	//if (currentCategory == "specific_species") {
	//	hideSpeciesSelection(false);
	//	updateOptions();
	//} else {
	//	hideSpeciesSelection(true);
	//	updateOptions();
	//}
}

function getCellValues() {
	if (gpBusy) {
		return;
	}

	hideChart();

	dojo.byId("cmap_info").innerHTML = "Click on the map to get values";

	var clickHandler = dojo.connect(map, 'onClick', function(evt) {
		gpBusy = true;
		dojo.byId("loadingImage").style.display = "";
		var gPoint = esri.geometry.webMercatorToGeographic(evt.mapPoint);
		dojo.byId("cmap_info").innerHTML = "Trying to find values for location " + gPoint.y.toFixed(2) + " , " + gPoint.x.toFixed(2);
		//console.log(evt.mapPoint);
		//console.log(species_type + " - " + currentMosaicName);
		dojo.disconnect(clickHandler);
		var graphic = new esri.Graphic(gPoint, null, {
			OBJECTID : 11
		});
		var featureSet = new esri.tasks.FeatureSet();
		featureSet.features = [graphic];
		//var gp = new
		// esri.tasks.Geoprocessor("http://maps.esri.com/apl12/rest/services/Lawler/ReturnSpecies/GPServer/Return%20a%20list%20of%20species%20at%20a%20location%20");
		//var gp = new
		// esri.tasks.Geoprocessor("http://lapilli:6080/arcgis/rest/services/Lawler/ReturnSpecies/GPServer/Return%20a%20list%20of%20species%20at%20a%20location%20");
		//GP expects Amphibian | Bird | Mammal
		var lookupForGP = {
			"mammals" : "Mammal",
			"birds" : "Bird",
			"amphibians" : "Amphibian"
		};

		var gp = new esri.tasks.Geoprocessor("http://maps.esri.com/apl12/rest/services/Lawler/ReturnSpecies/GPServer/ReturnAListOfSpecies");

		var params = {
			Input_Point : featureSet,
			Scenario_Info : currentMosaicName,
			//SpeciesType : lookupForGP[species_type]
			SpeciesType : species_type
		};
		console.log(params);

		gp.execute(params, function(result) {
			//callback do something
			console.log("Got GP results back");
			console.log(result);
			var table_values = result[0].value.features;
			var features = result[1].value.features;
			//var pdfurl = result[2]

			if (table_values.length > 0) {
				var csv;
				dojo.forEach(table_values, function(feature) {
					//todo: output formatted table
				});
			}

			if (features.length > 0) {
				dojo.byId("cmap_info").innerHTML = "Success! Summarizing " + table_values.length + " results";
				var stable = 0, expanding = 0, contracting = 0;
				dojo.forEach(features, function(feature) {
					if (feature.attributes.Range == 2)
						contracting = feature.attributes.FREQUENCY;
					if (feature.attributes.Range == 3)
						expanding = feature.attributes.FREQUENCY;
					if (feature.attributes.Range == 4)
						stable = feature.attributes.FREQUENCY;
				});
				drawchart(gPoint.y.toFixed(4), gPoint.x.toFixed(4), contracting, expanding, stable);
			} else {
				clearTimeout(timeoutHandler);
				dojo.byId("cmap_info").innerHTML = "Sorry! No results for this location.";
				timeoutHandler = setTimeout(hideChart, 5000);
			}
			dojo.byId("loadingImage").style.display = "none";
			gpBusy = false;

		}, function(err) {
			//err
			console.error(err);
			dojo.byId("cmap_info").innerHTML = "Sorry! Unable to get values for this location.";
			dojo.byId("loadingImage").style.display = "none";
			gpBusy = false;
			timeoutHandler = setTimeout(hideChart, 3000);
		});
		/*
		 gp.submitJob(params,function(jobInfo){
		 gp.getResultData(jobInfo.jobId,"Output_Table",function(result){
		 //callback do something
		 console.log("Got GP results back");
		 console.log(result);
		 },function(err){
		 //err
		 console.error(err);
		 })
		 },function(jobInfo){
		 console.log(jobInfo.jobStatus);
		 },function(){});
		 */
	});
}

function hideChart() {
	dojo.byId("chartdiv").style.display = "none";
	dojo.byId("cmap_info").innerHTML = "Choose one of the combinations OR Choose different fauna";
	clearTimeout(timeoutHandler);
}

function drawchart(lat, lon, c, e, s) {
	var chartdiv = dojo.byId("chartdiv");
	chartdiv.style.display = "";
	// Create our data table.
	var data = new google.visualization.DataTable();
	data.addColumn('string', 'Range:');
	data.addColumn('number', 'Total:');
	data.addRows([['Contracting', c], ['Expanding', e], ['Stable', s]]);

	// Instantiate and draw our chart, passing in some options.
	var chart = new google.visualization.PieChart(dojo.byId("chartcont"));
	chart.draw(data, {
		width : dojo.style("chartdiv", "width"),
		height : dojo.style("chartdiv", "height"),
		legend : {
			position : 'bottom'
		},
		pieSliceText : 'value',
		pieSliceTextStyle : {
			color : '#222222',
			fontSize : 12
		},
		is3D : true,
		colors : ["#fe0000", "#98e405", "#257400"],
		//series: [{color:"#fe0000"},{color:"#98e405"},{color:"#257400"}],
		title : 'Range values for ' + lat + ',' + lon
	});

}

function showCoords(ext) {
	var o = dojo.byId("coordsinfo");
	if (o === null || o === undefined) {
		console.error("coords div not defined");
		return;
	}
	var pnt = esri.geometry.webMercatorToGeographic(ext.mapPoint || ext);
	if (pnt === null || pnt === undefined)
		return;
	o.innerHTML = "Lat: " + pnt.y.toFixed(3) + "&nbsp;&nbsp;Lon: " + pnt.x.toFixed(3);
}

function onMapExtentChange() {
	var scale = Math.round(esri.geometry.getScale(map));

	if (scale > 999 && scale <= 999999) {
		scale = Math.round(scale / 1000) + " K";
	} else if (scale > 999999) {
		scale = Math.round(scale / 1000000) + " M";
	} else if (scale > 0 && scale <= 999) {
		scale = Math.round(scale) + " Ft";
	}
	dojo.byId("scaleinfo").innerHTML = "Scale: 1 <b>:</b> " + scale;
}

function showBaseMapGallery() {
	var basemapGallery = new esri.dijit.BasemapGallery({
		showArcGISBasemaps : true,
		map : map
	}, "basemapGallery");

	basemapGallery.startup();
}

function changeTransparency(val) {
	cwcontentlayer.setOpacity(val.toFixed(2));
	//grayLayer.setOpacity(val.toFixed(2));
	dojo.style("legend_image", "opacity", val.toFixed(2));
}

function chooseOption(choice) {
	dojo.query(".selected").removeClass("selected");
	var div = "#" + choice + "_card";
	dojo.query(div).addClass("selected");
	currentOption = choice;
	
	if (choice == "historical") {
		
		dojo.byId("modem").style.display = "none";
		dojo.byId("futureoptions").style.display = "none";
		dojo.byId("mapofchange").style.display = "none";
		
	} else {
		
		dojo.byId("modem").style.display = "";
		dojo.byId("futureoptions").style.display = "";
		dojo.byId("mapofchange").style.display = "";
	}

	changeCategory();
	
}

function hideSpeciesSelection(bool) {
	if (bool) {
		//hide
		dijit.byId("dd_species").attr('disabled', true);
		dijit.byId("dd_species_sc").attr('disabled', true);
		if (currentOption == "all") {
			dijit.byId("radioOne").attr('disabled', true);
			//dijit.byId("radioTwo").set('checked', true);
		}

	} else {
		dijit.byId("dd_species").attr('disabled', false);
		dijit.byId("dd_species_sc").attr('disabled', false);
		if (currentOption != "all") {
			dijit.byId("radioOne").attr('disabled', false);
		}
	}
}

function resetUI() {
	//dijit.byId("dd_species").set('displayedValue','Resetting...');
	//dijit.byId("dd_species_sc").set('displayedValue','Resetting...');
	if (dojo.byId("infobox")) {
		dojo.byId("infobox").style.display = "none";
	}
	if (currentLayer) {
		currentLayer.hide();
		grayLayer.hide();
		//extentGraphicsLayer.hide();
		extentGraphicsLayer.clear();
	}
	newMapExtent = null;
	//species_ID = null;
	//species_type = null;
}

function selectSpeciesType(type) {
	//duplicate clicks
	if (species_type && type == species_type)
		return;

	console.log("Species Type Selected : " + type);
	resetUI();
	species_type = type;
	var dd = dijit.byId("dd_species");
	var dd_sc = dijit.byId("dd_species_sc");

	if (species_type == "mammals") {
		dd.store = mammalsStore;
		dd_sc.store = mammalsStore_sc;
	} else if (species_type == "birds") {
		dd.store = birdsStore;
		dd_sc.store = birdsStore_sc;
	} else if (species_type == "amphibians") {
		dd.store = amphibiansStore;
		dd_sc.store = amphibiansStore_sc;
	}

	//initialize the species selection drop-downs to the first value, this triggers
	// map
	if (dd.store && dd.store._jsonData && dd.store._jsonData.items.length > 0) {
		//dd.setValue(dd.store._arrayOfAllItems[0].ID[0]);
		//dd.setValue(dd.store._jsonData.items[0].ID);
		//dd_sc.setValue(dd_sc.store._jsonData.items[0].ID);
		dd.set('value', dd.store._jsonData.items[0].ID);
		dd_sc.set('value', dd_sc.store._jsonData.items[0].ID);
	} else if (dd.store && dd.store._arrayOfAllItems && dd.store._arrayOfAllItems.length > 0) {
		dd.set('value', dd.store._arrayOfAllItems[0].ID[0]);
		dd_sc.set('value', dd_sc.store._arrayOfAllItems[0].ID[0]);
	} else {
		//console.log(dd.store);
		console.log("***** Store not set ****");
	}
}

function selectSpecies(item) {
	//console.log(item);
	if (item) {
		//console.log("You have selected : " + item);

		//duplicate request, just return
		if (species_ID && item == species_ID) {
			console.log("Duplicate request for " + item);
			return;
		}

		console.log("Processing selection : " + item);

		var dd = dijit.byId("dd_species");
		var dd_sc = dijit.byId("dd_species_sc");

		//console.log("Current: " + species_ID + "  New: " + item);

		species_ID = item;

		//show the map based on current options
		updateOptions();

		var current_dd = dd_sc.value == item ? dd_sc : dd;

		current_dd.store.fetch({
			query : {
				ID : item
			},
			onComplete : function(key, request) {
				//console.log(key);
				if (key && key.length > 0) {
					updateInfoBox(key[0]);
				}
			}
		});

		//make both the drop-downs the same
		if (dd_sc.value !== dd.value) {
			//console.log("Species selection drop-downs are not the same");
			if (dd_sc.value != item) {
				console.log("Resetting scientific name drop-down to " + item);
				dd_sc.set('value', item);
			}
			if (dd.value != item) {
				console.log("Resetting common name drop-down to " + item);
				dd.set('value', item);
			}
		}

	}
}

function fixTimePeriod() {
	//hack to fix the time-period issue
	var testcond = dd_model.get("value") + dd_scenario.get("value");
	//console.log("Current/Option2 timeperiod value: " , options.timeperiod,
	// dd_timeperiod.options[2].value);
	var newoption = {};
	newoption.selected = false;
	newoption.disabled = false;
	if (testcond == "ukmo-hadcm3a2" || testcond == "ncar_ccsm3.0a2" || testcond == "ncar_ccsm3.0a1b" || testcond == "cnrm-cm3a2") {
		//console.log("inside 2071-2099 hack");
		if (dd_timeperiod.options[2].value != "2071-2099") {
			newoption.value = "2071-2099";
			newoption.label = "2071 to 2099";
			//console.log("Current timeperiod value: " ,dd_timeperiod.value);
			if (dd_timeperiod.value == "2071-2100") {
				//dd_timeperiod.set('value','2071-2099');
				newoption.selected = true;
			}
			//console.log(dojo.toJson(newoption));
			dd_timeperiod.addOption(newoption);
			dd_timeperiod.removeOption(2);

			//console.log("Updated Current/Option2 timeperiod value: ", dd_timeperiod.value,
			// dd_timeperiod.options[2].value);
		}
	} else {
		if (dd_timeperiod.options[2].value != "2071-2100") {
			newoption.value = "2071-2100";
			newoption.label = "2071 to 2100";
			//console.log("Current timeperiod value: " ,dd_timeperiod.value);
			if (dd_timeperiod.value == "2071-2099") {
				//dd_timeperiod.set('value','2071-2100');
				newoption.selected = true;
			}
			//console.log(dojo.toJson(newoption));
			dd_timeperiod.addOption(newoption);
			dd_timeperiod.removeOption(2);
			//console.log("Updated Current/Option2 timeperiod value: ", dd_timeperiod.value,
			// dd_timeperiod.options[2].value);
		}
	}
}

function changeLegend() {
	if (currentCategory.indexOf("specific_species") > -1 && currentModel.indexOf("Ensemble") > -1) {
		dojo.byId("legend_image").src = "images/legends/ensemble_model.png";
		dojo.byId("legend_image").style.width = "188px";
	} else if (currentCategory.indexOf("specific_species") > -1) {
		dojo.byId("legend_image").src = "images/legends/specific_species.png";
		//dojo.byId("legend_image").style.width = "203px";
	} else if (currentCategory.indexOf("Loss") > -1) {
		dojo.byId("legend_image").src = "images/legends/Loss_" + currentOption +  ".png";
		//dojo.byId("legend_image").style.width = "120px";
	} else if (currentCategory.indexOf("Gain") > -1) {
		dojo.byId("legend_image").src = "images/legends/Gain_" + currentOption +  ".png";
		//dojo.byId("legend_image").style.width = "120px";
	} else if (currentCategory.indexOf("turnover") > -1) {
		dojo.byId("legend_image").src = "images/legends/Turnover.png";
		//dojo.byId("legend_image").style.width = "120px";
	} else if (currentCategory.indexOf("richness") > -1) {
		dojo.byId("legend_image").src = "images/legends/Richness_" + currentOption +  ".png";
		//dojo.byId("legend_image").style.width = "120px";
	}
}

function updateOptions() {
	//hack to fix the time-period issue
	fixTimePeriod();

	var options = {
		field : "", //NAME
		type : "", //A, B or M
		aggregateType : "", //amphibs,birds,all,mammals
		species : "", //A19
		model : "", //ensemble,cnrm-cm3
		scenario : "", //a1b,a2 or b1,
		category : "", //specific_species,gain,loss,turnover,richness
		timeperiod : "" //1=2011-2040, 2=2041-2070, 3=2071-2100
	};

	if (species_type == "mammals") {
		//test data : M132_cnrm_cm3_a1b_2011_2040
		options.type = "M";
		options.aggregateType = "mammals";
	} else if (species_type == "birds") {
		options.type = "B";
		options.aggregateType = "birds";
	} else if (species_type == "amphibians") {
		options.type = "A";
		options.aggregateType = "amphibs";
	} else if (species_type == "all") {
		options.type = "all";
		options.aggregateType = "all";
	}

	if (options.category == "specific_species") {
		options.aggregate = null;
	} else {
		options.aggregate = currentCategory + "." + options.aggregateType;
	}
	options.species = species_ID;
	options.model = dd_model.get("value");
	options.scenario = dd_scenario.get("value");
	options.timeperiod = dd_timeperiod.get("value");
	options.category = currentCategory;
	options.field = "Name";

	updateLayer(options);
	//changeLegend(options.model);
}

function updateInfoBox(attr) {
	//console.log(attr)
	var c = dojo.byId("infobox");
	var o = dojo.byId("infobox_content");
	var content = "";

	if (species_type == "mammals") {
		//content += "<img align='right'
		// style='padding:3px;width:64px;height:64px;float:right;vertical-align:bottom;'
		// src='images/seal.png'/>";
		content += "<span class='block'>Class : Mammalia</span>";
	} else if (species_type == "amphibians") {
		content += "<span class='block'>Class : Amphibia</span>";
	} else if (species_type == "birds") {
		content += "<span class='block'>Class : Aves</span>";
	}
	content += "<span class='block'>Order : " + attr.order_[0] + "</span>";
	content += "<span class='block'>Family : " + attr.family[0] + "</span>";
	content += "<span class='block'>Scientific Name : " + attr.scientific_name[0] + "</span>";
	content += "<span class='block'>Common Name : " + attr.common_name[0] + "</span>";
	//content += "<span class='block'>SPP Code : " + attr.sppcode[0] + "</span>";
	content += "<span class='block'>More Info : ";
	//content += "<a href='http://www.flickr.com/search/?q=" + attr.common_name[0] +
	// "&l=cc&ct=0&mt=photos&adv=1' target='_blank' title='Link opens in new
	// window'>Flickr Photos</a>&nbsp;|&nbsp;";
	content += "<a target='_blank' title='Link opens in new window' href='http://en.wikipedia.org/wiki/" + attr.scientific_name[0] + "'>Wikipedia</a></span>";

	o.innerHTML = content;
	c.style.display = "";
}

function updateLayer(queryOptions) {
	console.log("***** Inside Update Layer ******");
	var options = queryOptions;
	console.log(options);

	resetUI();

	currentModel = options.model;

	if (grayLayer)
		grayLayer.show();

	dojo.byId("infobox").style.display = "";

	//Mosaic rule format:
	// <species>_<model>_<scenario>_<timeperiodstart>_<timeperiodend>
	var where = options.field + "='";
	where += options.category == "specific_species" ? options.species : options.aggregate;
	where += "_" + options.model + "_" + options.scenario + "_" + options.timeperiod + "'";
	options.where = where;

	console.log("Mosaic Query to send: " + where);

	var mosaicRule = new esri.layers.MosaicRule();
	mosaicRule.sortField = options.field;
	mosaicRule.method = esri.layers.MosaicRule.METHOD_ATTRIBUTE;
	mosaicRule.where = where;
	
	//alert(options.field)

	if (options.category == "percLoss" || options.category == "percGain" || options.category == "turnover" || options.category == "richness") {
		gainLossTurnoverRichnessLayer.setMosaicRule(mosaicRule);
		gainLossTurnoverRichnessLayer.show();
		currentLayer = gainLossTurnoverRichnessLayer;
	} else if (options.category == "specific_species") {

		if (options.type == "B") {
			//check if ensemble is selected
			if (options.model == "Ensemble") {
				birdsLayer._url.path = birdsLayer._url.path.replace("BirdsNew", "birdsEnsemble");
			} else {
				birdsLayer._url.path = birdsLayer._url.path.replace("birdsEnsemble", "BirdsNew");
			}

			//Query for extent
			if (options.category == "specific_species") {
				//Update the image service
				birdsLayer.setMosaicRule(mosaicRule);
				birdsLayer.show();
				currentLayer = birdsLayer;

				//Query for extent
				queryAndZoomToExtent(birdsQueryLayer, options);
			}
		} else if (options.type == "M") {

			//check if ensemble is selected
			if (options.model == "Ensemble") {
				mammalsLayer._url.path = mammalsLayer._url.path.replace("MammalsNew", "mammalsEnsemble");
			} else {
				mammalsLayer._url.path = mammalsLayer._url.path.replace("mammalsEnsemble", "MammalsNew");
			}

			if (options.category == "specific_species") {
				//Update the image service
				mammalsLayer.setMosaicRule(mosaicRule);
				mammalsLayer.show();
				currentLayer = mammalsLayer;
				//Query for extent
				queryAndZoomToExtent(mammalsQueryLayer, options);
			}
		} else if (options.type == "A") {

			//check if ensemble is selected
			if (options.model == "Ensemble") {
				amphibiansLayer._url.path = amphibiansLayer._url.path.replace("AmphibsNew", "amphibiansEnsemble");
			} else {
				amphibiansLayer._url.path = amphibiansLayer._url.path.replace("amphibiansEnsemble", "AmphibsNew");
			}

			if (options.category == "specific_species") {
				//Update the image service
				amphibiansLayer.setMosaicRule(mosaicRule);
				amphibiansLayer.show();
				currentLayer = amphibiansLayer;
				//Query for extent
				queryAndZoomToExtent(amphibiansQueryLayer, options);
			}
		}
	}

	changeLegend();
}

function queryAndZoomToExtent(queryLayer, options) {
	if (options.model == "Ensemble") {
		
		queryLayer._url.path = queryLayer._url.path.replace("New", "Ensemble").replace("Birds","birds").replace("Amphibs","amphibians").replace("Mammals","mammals");
	} else {
		queryLayer._url.path = queryLayer._url.path.replace("Ensemble", "New").replace("birds","Birds").replace("amphibians","Amphibs").replace("mammals","Mammals");
	}

	//Query object for extent
	var where = options.where;
	var extentQuery = new esri.tasks.Query();
	extentQuery.returnGeometry = true;
	extentQuery.outSpatialReference = map.spatialReference;
	extentQuery.outFields = ['Name'];
	//extentQuery.where = "NAME1='" + query + "'";
	extentQuery.where = where;
	newMapExtent = null;
	queryLayer.execute(extentQuery, function(results) {
		if (results.features.length > 0 && results.features[0].geometry) {
			console.log("Mosaic name: " + results.features[0].attributes.Name);
			currentMosaicName = results.features[0].attributes.Name;
			//console.log("Setting map extent to footprint extent");

			var graphic = results.features[0];
			var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_NULL, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new dojo.Color([39, 96, 151]), 3));
			graphic.setSymbol(symbol);
			extentGraphicsLayer.add(graphic);
			newMapExtent = results.features[0].geometry.getExtent();
			map.setExtent(newMapExtent.expand(1.1), true);

			var mconnect = dojo.connect(map, "onExtentChange", function() {
				dojo.disconnect(mconnect);
				map.centerAt(newMapExtent.getCenter());
				setTimeout(function() {
					extentGraphicsLayer.clear();
				}, 1000);
			});
		} else {
			console.log("Unable to get extent. Using default.");
		}
	});
}

function showAdvancedSearch() {
	var dialog = null;
	if (!dijit.byId("advancedDialog")) {
		dialog = new dijit.Dialog({
			id : "advancedDialog",
			title : "Advanced Filter Tool",
			style : "width: 600px; height:400px; max-height:50%; overflow:auto;",
			content : ""
		});
	} else {
		dialog = dijit.byId("advancedDialog");
	}
	dialog.show();
}

//info tips
function infoTip(e, b, d, c) {
	this.LOCATION = {
		left : "left",
		right : "right",
		top : "top",
		bottom : "bottom"
	};
	this._isShowing = false;
	this._coords = null;
	this._height = 0;
	this._width = 0;
	this._location = "top";
	this._padding = 15;
	this._xOffset = d.x;
	this._yOffset = d.y;
	this._id = e;
	this._animationRef = null;
	this._animation = c;
	var a = dojo.doc.createElement("div");
	dojo.attr(a, {
		id : e,
		"class" : b,
		style : "display:none"
	});

	var a1 = dojo.doc.createElement("div");
	dojo.attr(a1, {
		id : e + "_content"
		//"class" : b,
		//style : "display:none"
	});
	a.appendChild(a1);

	var a2 = dojo.doc.createElement("div");
	dojo.attr(a2, {
		id : e + "_arrow"
	});
	a.appendChild(a2);

	dojo.doc.body.appendChild(a);

	this.getId = function() {
		return this._id
	};
	this.setPadding = function(f) {
		this._padding = f
	};
	this.setLocation = function(f) {
		this._location = f
	};
	this.setSize = function(f, g) {
		dojo.style(this._id, {
			height : g + "px",
			width : f + "px"
		})
	};
	this.setContent = function(f) {
		dojo.byId(this._id + "_content").innerHTML = f;
		dojo.style(this._id, "display", "")
	};
	this.setClass = function(f) {
		dojo.byId(this._id).className = f
	};
	this.show = function(g) {
		this._coords = dojo.coords(this._id);
		this._height = this._coords.h;
		this._width = this._coords.w;
		var h, f;
		switch(this._location) {
			case"left":
				h = g.y + this._yOffset - (this._height / 2) + "px";
				f = g.x + this._xOffset - this._width - this._padding + "px";
				break;
			case"right":
				h = g.y + this._yOffset - (this._height / 2) + "px";
				f = g.x + this._xOffset + this._padding + "px";
				break;
			case"bottom":
				h = g.y + this._yOffset + this._padding + "px";
				f = g.x + this._xOffset - (this._width / 2) + "px";
				break;
			case"top":
				h = g.y + this._yOffset - this._height - this._padding + "px";
				f = g.x + this._xOffset - (this._width / 2) + "px";
				break
		}
		dojo.style(this._id, {
			left : f,
			top : h,
			display : ""
		});
		if (this._animation) {
			if (this._animationRef != null) {
				this._animationRef.stop()
			}
			this._animationRef = dojo.fadeIn({
				node : this._id,
				duration : 1000
			}).play()
		}
		this._isShowing = true
	};
	this.hide = function() {
		if (!this._isShowing) {
			return
		}
		if (this._animation) {
			this._animationRef = dojo.fadeOut({
				node : this._id,
				duration : 800,
				onEnd : function() {
					this.node.style.display = "none"
				}
			}).play()
		} else {
			dojo.style(this._id, "display", "none")
		}
		this._isShowing = false
	};
	this.isShowing = function() {
		return this._isShowing
	}
};
