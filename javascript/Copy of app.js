var map, basemapLayer, grayLayer, testGraphicsLayer;
var birdsQueryLayer, mammalsQueryLayer, amphibiansQueryLayer;
var birdsLayer, mammalsLayer, amphibiansLayer, speciesTable;
var mammalsStore, amphibiansStore, birdsStore;
var mammalsStore_sc, amphibiansStore_sc, birdsStore_sc;
var currentLayer, species_type, species_ID, newMapExtent, currentMosaicName;
var birdsURL, mammalsURL, amphibiansURl;
var gpBusy = false, timeoutHandler;

function init() {

	esri.config.defaults.map.zoomDuration = 600;
	esri.config.defaults.map.panDuration = 600;

	var initialExtent = new esri.geometry.Extent({
		"xmin" : -21345286.56759694,
		"ymin" : -4757666.328089946,
		"xmax" : 3701598.860882933,
		"ymax" : 6709110.907135996,
		"spatialReference" : {
			"wkid" : 102100
		}
	});
	map = new esri.Map("centerDiv_map", {
		extent : initialExtent,
		fitExtent : true,
		navigationMode : 'classic',
		//infoWindow : popup,
		wrapAround180 : true
	});

	dojo.connect(map, "onUpdateStart", function() {
		dojo.byId("loadingImage").style.display = "";
	});
	dojo.connect(map, "onUpdateEnd", function() {
		dojo.byId("loadingImage").style.display = "none";
	});
	// Resize the map when the browser resizes
	dojo.connect(map, 'onLoad', function() {
		dojo.connect(dijit.byId('centerDiv_map'), 'resize', map, map.resize);
		showBaseMapGallery();
		dojo.connect(map, "onMouseMove", showCoords);
		dojo.connect(map, "onExtentChange", onMapExtentChange);

		onMapExtentChange();
		showCoords(map.extent.getCenter());
	});
	var basemapurl = "http://services.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer";
	basemapLayer = new esri.layers.ArcGISTiledMapServiceLayer(basemapurl, {
		id : "basemapLayer"
	});
	map.addLayer(basemapLayer);

	//initalize species table to build the UI
	speciesTable = new esri.tasks.QueryTask("http://maps.esri.com/apl12/rest/services/Lawler/Lawler/MapServer/4");
	var query = new esri.tasks.Query();
	query.returnGeometry = false;
	query.outFields = ['*'];
	query.where = "type='amphibian'";
	
	sathya_a = [];
	
	speciesTable.execute(query, function(results) {
		console.log("Amphibians : " + results.features.length);
		
		dojo.forEach(results.features,function(a){
			sathya_a.push(a.attributes);
		});
		
		var items = dojo.map(results.features, function(result) {			
			return result.attributes;
		});	
		var data = {
			identifier : "ID",
			label : "common_name",
			items : dojo.clone(items)
		};
		amphibiansStore = new dojo.data.ItemFileReadStore({
			data : data
		});

		var data_sc = {
			identifier : "ID",
			label : "scientific_name",
			items : dojo.clone(items)
		};
		amphibiansStore_sc = new dojo.data.ItemFileReadStore({
			data : data_sc
		});
		items = [], data = [];
	});
	query.where = "type='bird'";
	speciesTable.execute(query, function(results) {
		console.log("Birds : " + results.features.length);
		var items = dojo.map(results.features, function(result) {
			return result.attributes;
		});
		var data = {
			identifier : "ID",
			label : "common_name",
			items : dojo.clone(items)
		};
		birdsStore = new dojo.data.ItemFileReadStore({
			data : data
		});
		var data_sc = {
			identifier : "ID",
			label : "scientific_name",
			items : dojo.clone(items)
		};
		birdsStore_sc = new dojo.data.ItemFileReadStore({
			data : data_sc
		});
		items = [], data = [];
		//set this as the default option
		chooseOption("birds");
	});
	query.where = "type='mamal'";
	speciesTable.execute(query, function(results) {
		console.log("Mammals : " + results.features.length);
		var items = dojo.map(results.features, function(result) {
			return result.attributes;
		});
		var data = {
			identifier : "ID",
			label : "common_name",
			items : dojo.clone(items)
		};
		mammalsStore = new dojo.data.ItemFileReadStore({
			data : data
		});
		var data_sc = {
			identifier : "ID",
			label : "scientific_name",
			items : dojo.clone(items)
		};
		mammalsStore_sc = new dojo.data.ItemFileReadStore({
			data : data_sc
		});
		items = [], data = [];
	});
	
	birdsURL = "http://maps.esri.com/apl12/rest/services/Lawler/BirdsNew/ImageServer";
	amphibiansURL = "http://maps.esri.com/apl12/rest/services/Lawler/AmphibsNew/ImageServer";
	mammalsURL = "http://maps.esri.com/apl12/rest/services/Lawler/MammalsNew/ImageServer";

	//initialize query tasks for image-services to get extents
	birdsQueryLayer = new esri.tasks.QueryTask(birdsURL);
	mammalsQueryLayer = new esri.tasks.QueryTask(mammalsURL);
	amphibiansQueryLayer = new esri.tasks.QueryTask(amphibiansURL);

	var params = new esri.layers.ImageServiceParameters();
	params.noData = 0;
	params.format = "png";
	params.interpolation = "RSP_NearestNeighbor";

	//birds layer
	birdsLayer = new esri.layers.ArcGISImageServiceLayer(birdsURL, {
		id : "birdsLayer",
		visible : false,
		opacity : 0.7,
		imageServiceParameters : params
	});

	//mammals layer
	mammalsLayer = new esri.layers.ArcGISImageServiceLayer(mammalsURL, {
		id : "mammalsLayer",
		visible : false,
		opacity : 0.7,
		imageServiceParameters : params
	});

	//amphibians layer
	amphibiansLayer = new esri.layers.ArcGISImageServiceLayer(amphibiansURL, {
		id : "amphibiansLayer",
		visible : false,
		opacity : 0.7,
		imageServiceParameters : params
	});

	//reference gray layer
	grayLayer = new esri.layers.ArcGISDynamicMapServiceLayer("http://maps.esri.com/apl12/rest/services/Lawler/Lawler/MapServer", {
		id : "grayLayer",
		visible : false,
		opacity : 0.6
	});
	grayLayer.setVisibleLayers([3]);

	//test graphics layer
	testGraphicsLayer = new esri.layers.GraphicsLayer({
		id : "testGraphics",
		displayOnPan : true,
		visible : true
	});

	map.addLayers([grayLayer, birdsLayer, mammalsLayer, amphibiansLayer, testGraphicsLayer]);
}

function getCellValues() {

	if(gpBusy) {
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
		//var gp = new esri.tasks.Geoprocessor("http://lapilli:6080/arcgis/rest/services/Lawler/ReturnSpecies/GPServer/Return%20a%20list%20of%20species%20at%20a%20location%20");
		//GP expects Amphibian | Bird | Mammal
		var lookupForGP = {"mammals":"Mammal", "birds":"Bird", "amphibians":"Amphibian"};		
		
		var gp = new esri.tasks.Geoprocessor("http://maps.esri.com/apl12/rest/services/Lawler/ReturnSpecies2/GPServer/Return%20a%20list%20of%20species%20at%20a%20location2");
		
		var params = {
			Input_Point : featureSet,
			Scenario_Info : currentMosaicName,
			SpeciesType : lookupForGP[species_type]			
		};
		console.log(params);

		gp.execute(params, function(result) {
			//callback do something
			console.log("Got GP results back");
			console.log(result);
			var features = result[0].value.features;
			//var pdfurl = result[1]

			if(featureSet.length > 0) {
				dojo.byId("cmap_info").innerHTML = "Success! Got " + features.length + " results";
				var stable = 0, expanding = 0, contracting = 0;
				dojo.forEach(features, function(feature) {feature.attributes.Range == 2 ? contracting++ : "";
					feature.attributes.Range == 3 ? expanding++ : "";
					feature.attributes.Range == 4 ? stable++ : "";
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
	if(o === null || o === undefined) {
		console.error("coords div not defined");
		return;
	}
	var pnt = esri.geometry.webMercatorToGeographic(ext.mapPoint || ext);
	if(pnt === null || pnt === undefined)
		return;
	o.innerHTML = "Lat: " + pnt.y.toFixed(2) + "&nbsp;&nbsp;Lon: " + pnt.x.toFixed(2);
}

function onMapExtentChange() {
	var scale = Math.round(esri.geometry.getScale(map));

	if(scale > 999 && scale <= 999999) {
		scale = Math.round(scale / 1000) + " K";
	} else if(scale > 999999) {
		scale = Math.round(scale / 1000000) + " M";
	} else if(scale > 0 && scale <= 999) {
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
	currentLayer.setOpacity(val.toFixed(2));
	grayLayer.setOpacity(val.toFixed(2));
	dojo.style("legend_image", "opacity", val.toFixed(2));
}

function chooseOption(choice) {
	if(choice) {
		//TODO: check if all stores are loaded
		//dojo.style("centerDiv_cards", "display", "none");
		//dojo.style("centerDiv_options", "display", "");
		dojo.query(".selected").removeClass("selected");
		dojo.byId("cmap_info").innerHTML = "Choose one of the combinations OR Choose different fauna";
		selectSpeciesType(choice);
		dojo.style("cmap_legend", "display", "");
		var div = "#" + choice + "_card";
		dojo.query(div).addClass("selected");
	}
	/*
	 else {
	 dojo.style("centerDiv_options", "display", "none");
	 dojo.style("centerDiv_cards", "display", "");
	 dojo.byId("cmap_info").innerHTML = "Choose one of the categories to get
	 started";
	 dojo.style("cmap_legend", "display", "none");
	 if(currentLayer) {
	 currentLayer.hide();
	 }
	 }
	 */
}

function resetUI() {
	//dijit.byId("dd_species").set('displayedValue','Resetting...');
	//dijit.byId("dd_species_sc").set('displayedValue','Resetting...');
	dojo.byId("infobox").innerHTML = "";
	if(currentLayer) {
		currentLayer.hide();
		grayLayer.hide();
	}
	newMapExtent = null;
	//species_ID = null;
	//species_type = null;
}

function selectSpeciesType(type) {
	//duplicate clicks
	if(species_type && type == species_type)
		return;

	console.log("Species Type Selected : " + type);
	resetUI();
	species_type = type;
	var dd = dijit.byId("dd_species");
	var dd_sc = dijit.byId("dd_species_sc");

	if(species_type == "mammals") {
		dd.store = mammalsStore;
		dd_sc.store = mammalsStore_sc;
	} else if(species_type == "birds") {
		dd.store = birdsStore;
		dd_sc.store = birdsStore_sc;
	} else if(species_type == "amphibians") {
		dd.store = amphibiansStore;
		dd_sc.store = amphibiansStore_sc;
	}

	//initialize the species selection drop-downs to the first value, this triggers
	// map
	if(dd.store && dd.store._jsonData && dd.store._jsonData.items.length > 0) {
		//dd.setValue(dd.store._arrayOfAllItems[0].ID[0]);
		//dd.setValue(dd.store._jsonData.items[0].ID);
		//dd_sc.setValue(dd_sc.store._jsonData.items[0].ID);
		dd.set('value', dd.store._jsonData.items[0].ID);
		dd_sc.set('value', dd_sc.store._jsonData.items[0].ID);
	} else if(dd.store && dd.store._arrayOfAllItems && dd.store._arrayOfAllItems.length > 0) {
		dd.set('value', dd.store._arrayOfAllItems[0].ID[0]);
		dd_sc.set('value', dd_sc.store._arrayOfAllItems[0].ID[0]);
	} else {
		//console.log(dd.store);
		console.log("***** Store not set ****");
	}
}

function selectSpecies(item) {
	//console.log(item);
	if(item) {
		//console.log("You have selected : " + item);

		//duplicate request, just return
		if(species_ID && item == species_ID) {
			console.log("Duplicate request for " + item);
			return;
		}

		console.log("Processing selection : " + item);

		var dd = dijit.byId("dd_species");
		var dd_sc = dijit.byId("dd_species_sc");

		//console.log("Current: " + species_ID + "  New: " + item);

		species_ID = item;

		//show the map based on current options
		getOptions();

		var current_dd = dd_sc.value == item ? dd_sc : dd;

		current_dd.store.fetch({
			query : {
				ID : item
			},
			onComplete : function(key, request) {
				//console.log(key);
				if(key && key.length > 0) {
					updateInfoBox(key[0]);
				}
			}
		});

		//make both the drop-downs the same
		if(dd_sc.value !== dd.value) {
			//console.log("Species selection drop-downs are not the same");
			if(dd_sc.value != item) {
				console.log("Resetting scientific name drop-down to " + item);
				dd_sc.set('value', item);
			}
			if(dd.value != item) {
				console.log("Resetting common name drop-down to " + item);
				dd.set('value', item);
			}
		}

	}
}

function getOptions() {
	var options = {
		type : "", //A, B or M
		species : "", //A19
		model : "", //cnrm-cm3
		scenario : "", //a1b,a2 or b1
		timeperiod : "" //1=2011_2040, 2=2041_2070, 3=2071_2100
	};

	if(species_type == "mammals") {
		//test data : M132_cnrm_cm3_a1b_2011_2040
		options.type = "M";
	} else if(species_type == "birds") {
		options.type = "B";
		//options.species = 34;
	} else if(species_type == "amphibians") {
		options.type = "A";
		//options.species = 19;
	}
	options.species = species_ID;
	options.model = dijit.byId("dd_model").get("value");
	options.scenario = dijit.byId("dd_scenario").get("value");
	options.timeperiod = dijit.byId("dd_timeperiod").get("value");

	//updateLayer(getTestOptions(choice));
	updateLayer(options);
}

function updateInfoBox(attr) {
	//console.log(attr)
	var o = dojo.byId("infobox");
	var content = "";

	if(species_type == "mammals") {
		//content += "<img align='right'
		// style='padding:3px;width:64px;height:64px;float:right;vertical-align:bottom;'
		// src='images/seal.png'/>";
		content += "<span class='block'>Class : Mammals</span>";
	} else if(species_type == "amphibians") {
		content += "<span class='block'>Class : Amphibians</span>";
	} else if(species_type == "birds") {
		content += "<span class='block'>Class : Birds</span>";
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
}

function updateLayer(options) {
	//console.log(options);

	var type = options.type;
	//Mosaic rule format:
	// <species>_<model>_<scenario>_<timeperiodstart>_<timeperiodend>
	var query = options.species + "_" + options.model + "_" + options.scenario + "_" + options.timeperiod;

	console.log("Mosaic Query to send: " + query);

	//var where = "\"Name1\"='" + query + "'";
	var where = "\"NewName\"='" + query + "'";
	console.log("Where clause: " + where);

	var mosaicRule = new esri.layers.MosaicRule();
	mosaicRule.sortField = "Name";
	mosaicRule.method = esri.layers.MosaicRule.METHOD_ATTRIBUTE;
	mosaicRule.where = where;

	if(currentLayer) {
		currentLayer.hide();
		//grayLayer.hide();
		currentLayer = null;
		newMapExtent = null;
	}

	if(!grayLayer.visible) {
		grayLayer.show();
	}

	testGraphicsLayer.clear();

	//Query object for extent
	var extentQuery = new esri.tasks.Query();
	extentQuery.returnGeometry = true;
	extentQuery.outSpatialReference = map.spatialReference;
	extentQuery.outFields = ['Name'];
	//extentQuery.where = "NAME1='" + query + "'";
	extentQuery.where = where;

	if(type == "B") {
		//Update the image service
		birdsLayer.setMosaicRule(mosaicRule);
		birdsLayer.show();
		currentLayer = birdsLayer;

		//Query for extent
		birdsQueryLayer.execute(extentQuery, function(results) {
			if(results.features.length > 0 && results.features[0].geometry) {
				console.log("Mosaic name: " + results.features[0].attributes.Name);
				currentMosaicName = results.features[0].attributes.Name;
				console.log("Setting map extent to footprint extent");

				var graphic = results.features[0];
				var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_NULL, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new dojo.Color([39, 96, 151]), 3));
				graphic.setSymbol(symbol);
				testGraphicsLayer.add(graphic);
				newMapExtent = results.features[0].geometry.getExtent();
				map.setExtent(newMapExtent.expand(1.1), true);

				var mconnect = dojo.connect(map, "onExtentChange", function() {
					dojo.disconnect(mconnect);
					map.centerAt(newMapExtent.getCenter());
					//grayLayer.show();
					//birdsLayer.show();
					setTimeout(function() {
						testGraphicsLayer.clear();
					}, 1000);
				});
			} else {
				console.log("Unable to get extent. Using default.");
			}
		});
	} else if(type == "M") {
		//Update the image service
		mammalsLayer.setMosaicRule(mosaicRule);
		mammalsLayer.show();
		currentLayer = mammalsLayer;

		//Query for extent
		mammalsQueryLayer.execute(extentQuery, function(results) {
			if(results.features.length > 0 && results.features[0].geometry) {
				console.log("Setting map extent to footprint extent");
				console.log("Mosaic name: " + results.features[0].attributes.Name);
				currentMosaicName = results.features[0].attributes.Name;

				var graphic = results.features[0];
				var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_NULL, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new dojo.Color([39, 96, 151]), 3));
				graphic.setSymbol(symbol);
				testGraphicsLayer.add(graphic);
				newMapExtent = results.features[0].geometry.getExtent();
				/*
				 if(map.extent.contains(newExtent)) {
				 map.centerAt(newExtent.getCenter());
				 } else {
				 map.setExtent(newExtent, true);
				 }
				 */
				map.setExtent(newMapExtent.expand(1.1), true);

				var mconnect = dojo.connect(map, "onExtentChange", function() {
					console.log("Mammal: inside map extent change event");
					dojo.disconnect(mconnect);
					map.centerAt(newMapExtent.getCenter());
					//grayLayer.show();
					//mammalsLayer.show();
					setTimeout(function() {
						testGraphicsLayer.clear();
					}, 1000);
				});
			} else {
				console.log("Unable to get extent. Using default.");
			}
		});
	} else if(type == "A") {
		//Update the image service
		amphibiansLayer.setMosaicRule(mosaicRule);
		amphibiansLayer.show();
		currentLayer = amphibiansLayer;
		//Query for extent
		amphibiansQueryLayer.execute(extentQuery, function(results) {
			if(results.features.length > 0 && results.features[0].geometry) {
				console.log("Setting map extent to footprint extent");
				console.log("Mosaic name: " + results.features[0].attributes.Name);
				currentMosaicName = results.features[0].attributes.Name;

				var graphic = results.features[0];
				var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_NULL, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new dojo.Color([39, 96, 151]), 3));
				graphic.setSymbol(symbol);
				testGraphicsLayer.add(graphic);
				newMapExtent = results.features[0].geometry.getExtent();
				map.setExtent(newMapExtent.expand(1.1), true);

				var mconnect = dojo.connect(map, "onExtentChange", function() {
					dojo.disconnect(mconnect);
					map.centerAt(newMapExtent.getCenter());
					//grayLayer.show();
					//amphibiansLayer.show();
					setTimeout(function() {
						testGraphicsLayer.clear();
					}, 1000);
				});
			} else {
				console.log("Unable to get extent. Using default.");
			}
		});
	}
}

function showAdvancedSearch() {
	var dialog = null;
	if(!dijit.byId("advancedDialog")) {
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