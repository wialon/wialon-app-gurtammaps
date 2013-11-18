/// Global event handlers
var callbacks = {};
/// Execute callback
function exec_callback(id) {
	if (!callbacks[id])
		return null;
	callbacks[id].call();
	delete callbacks[id];
}

(function ( $, _ ) {
	///
	var MAP = null;	
	///
	var MARKER = null;
	///
	var MARKERS = null;
	///
	var ADDRESS_SOURCE = [];
	///
	var ITEM_SELECTED = null;
	/// Wrap callback
	function wrap_callback(callback) {
		var id = (new Date()).getTime();
		callbacks[id] = callback;
		return id;
	}
	/// Fetch varable from 'GET' request
	var get_url_parameter = _.memoize(function (name) {
		if (!name) {
			return null;
		}
		var pairs = decodeURIComponent(document.location.search.substr(1)).split("&");
		for (var i = 0; i < pairs.length; i++) {
			var pair = pairs[i].split("=");
			if (pair[0] === name) {
				pair.splice(0, 1);
				return pair.join("=");
			}
		}
		return null;
	});
	/// Load scripts
	function load_script(src, callback) {
		var script = document.createElement("script");
		script.setAttribute("type","text/javascript");
		script.setAttribute("charset","UTF-8");
		script.setAttribute("src", src);
		if (callback && typeof callback === "function") {
			var id = wrap_callback(callback);
			if ($.browser.msie) {
				script.onreadystatechange = function () {
					if (this.readyState === 'complete' || this.readyState == 'loaded') {
						callback();
					}
				};
			} else {
				script.setAttribute("onLoad", "exec_callback(" + wrap_callback(callback) + ")");
			}
		}
		document.getElementsByTagName("head")[0].appendChild(script);
	}
	/// Init SDK
	function init_sdk () {
		var url = get_url_parameter("baseUrl");
		if (!url) {
			url = get_url_parameter("hostUrl");
		}
		if (!url) {
			return null;
		}
		wialon.core.Session.getInstance().initSession(url, undefined, 0x800);
		wialon.core.Session.getInstance().duplicate(get_url_parameter("sid"), "", true, login);
	}
	///s
	function show_marker (lonlat, iscenter) {
		var size = new OpenLayers.Size(28, 32);
		var offset = new OpenLayers.Pixel(-(size.w/2), -(size.h));
		var px = MAP.getLayerPxFromLonLat(new OpenLayers.LonLat(lonlat.lon, lonlat.lat).transform(MAP.displayProjection, MAP.projection));
		if (px) {			
			if (!MARKER.isDrawn())
				MARKERS.addMarker(MARKER);
							
			MARKER.icon.size = size;
			MARKER.icon.offset = offset;
			MARKER.moveTo(px.clone());
			MARKER.display(true);
			MARKERS.redraw();
			
			if (iscenter) {
				var tlonlat = MAP.getLonLatFromLayerPx(px);			
				MAP.setCenter(tlonlat, (MAP.getZoom() < 10) ? 7 : MAP.getZoom());
			}
		}
	}
	///
	function fetch_location (lonlat, iscenter) {
		wialon.util.Gis.getLocations([{lon: lonlat.lon, lat: lonlat.lat}], qx.lang.Function.bind(function (lonlat, code, result) {
			if (code === 0 && result) {
				var slonlat = "";
				show_marker(lonlat, iscenter);
				$("#sas-result").text(result[0]);
				slonlat = wialon.util.String.sprintf("%.6f,%.6f", lonlat.lon, lonlat.lat);
				$("#address_input").val(slonlat);
				ITEM_SELECTED = null;
			}
		}, this, lonlat));
	}
	/// Login result
	function login (code) {
		if (code !== 0) {
			alert("Login error.");
			return null;
		} 
		
		var opts = {};
		opts.maxExtent = new OpenLayers.Bounds(-20037508.3427892,-20037508.3427892,20037508.3427892,20037508.3427892);
		opts.numZoomLevels = 19;
		opts.maxResolution = 156543.0339;
		opts.units = 'm';
		opts.projection = "EPSG:900913";
		opts.displayProjection = new OpenLayers.Projection("EPSG:4326");
		// create layer
		layer = new OpenLayers.Layer.WebGIS("Gurtam Maps", wialon.core.Session.getInstance().getBaseGisUrl("render"), opts);

		opts.controls = [new OpenLayers.Control.GPanZoomBar(),
						 new OpenLayers.Control.MousePosition(),
						 new OpenLayers.Control.GNavigation()];

		MAP = new OpenLayers.GMap("map", opts);	
		MAP.addLayers([layer]);
		MAP.zoomToMaxExtent();

		MARKERS = new OpenLayers.Layer.Markers("address");
		MAP.addLayer(MARKERS);

		var size = new OpenLayers.Size(28, 32);
		var offset = new OpenLayers.Pixel(-(size.w/2), -(size.h));
		var icon = new OpenLayers.Icon('./img/marker.png', size.clone(), offset.clone());
		MARKER = new OpenLayers.Marker(new OpenLayers.LonLat(0,0), icon.clone());

		var dblClickHandler = new OpenLayers.Handler.Click(
			{map: MAP}, {dblclick: function(e) {				
				var lonlat = MAP.getLonLatFromViewPortPx(e.xy);				
				lonlat.transform(MAP.getProjectionObject(), MAP.displayProjection);
				fetch_location(lonlat);
			}}, {'double': true, stopDouble: true});
		dblClickHandler.activate();

		var expr = new RegExp('^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?,[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$', 'i');

		$("#address_input").autocomplete({
			source: function (request, response) {
				if (request.term === "" || expr.test(request.term))
					return [];
				wialon.util.Gis.searchByString(request.term, 0x800, 10, function(code, data) {
					ITEM_SELECTED = null;
					if (code || !data)
						return;
					ADDRESS_SOURCE = [];
					
					var i, len, temp, loc, spath, params;
					$("#sas-result").empty();
					for(i=0, len=data.length; i<len; i++) {
						temp = data[i];
						if (temp && temp.items && temp.items[0]) {
							loc = temp.items[0];
							params = {
								label: loc.formatted_path,
								lon: loc['x'],
								lat: loc['y']
							};
							ADDRESS_SOURCE.push(params);							
							$(".ui-autocomplete").css("display", "");					
						}						
					}
					response(ADDRESS_SOURCE);
				});
			},
			select: function (event, ui) {
				ITEM_SELECTED = ui.item;
				show_marker(ITEM_SELECTED, true);
			},
			delay: 500
		});

		$("#address_input").keypress(function (event) {
			if (event.which === 13) {
				$("#show-btn").trigger("click");
			}
		});
				
		$("#show-btn").click(function () {
			var val, lotlat;			
			if (ITEM_SELECTED !== null) {
				show_marker(ITEM_SELECTED, true);
			} else if (expr.test($("#address_input").val())) {				
				val = $("#address_input").val().split(",");
				lotlat = new OpenLayers.LonLat(val[0], val[1]);
				if ((lotlat.lon >= -180.0 && lotlat.lon <= 180.0) && (lotlat.lat >= -90.0 && lotlat.lat <= 90.0)) {
					fetch_location(lotlat, true);
				} else {
					MARKER.display(false);
					$("#sas-result").text("Не удалось найти это место: "+$("#address_input").val());
				}
			} else {
				MARKER.display(false);
				$("#sas-result").text("Не удалось найти это место: "+$("#address_input").val());
			}
		});

		/*setTimeout(function () {
			var height = $(document).height() - $("#header").height();
			$("#map").height(height-80);
			$("#map").offset({top: $("#header").height() + 20});
		}, 200);

		$(document).resize(function () {
			setTimeout(function () {
				if (MAP !== null) {
					var height = $(document).height() - $("#header").height();
					$("#map").height(height-80);
					MAP.updateSize();
				}
			}, 200);
		}); */
	}
	///
	$(document).ready(function () {
		var url = get_url_parameter("baseUrl");
		if (!url) 
			url = get_url_parameter("hostUrl");
		if (!url)
			return null;
		url += "/wsdk/script/wialon.js";
		load_script(url, init_sdk);		
	});
}) (jQuery, _);
