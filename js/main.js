/* jshint -W100 */
var app = app || {};
(function ($, app) {
	NProgress.configure({ showSpinner: false });
	var ADDRESS_SOURCE = [];
	var DEBUG = false;

	if( ! DEBUG){
		console.log = function(){};
	}
	/// Fetch varable from 'GET' request
	var get_url_parameter = function (name) {
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
	};

	var mobile = false;
	if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
		mobile = true;
	}

	var lang = get_url_parameter("lang");
	if ((!lang) || ($.inArray(lang, ["en", "ru"]) === -1))
		lang = "en";

	$.localise('lang/', {language: lang});

	/// Load scripts
	function load_script(src, callback) {
		var script = document.createElement("script");
		script.setAttribute("type","text/javascript");
		script.setAttribute("charset","UTF-8");
		script.setAttribute("src", src);
		if (callback && typeof callback === "function") {
			if ($.browser.msie) {
				script.onreadystatechange = function () {
					if (this.readyState === 'complete' || this.readyState === 'loaded') {
						callback();
					}
				};
			} else {
				script.onload = callback;
			}
		}
		document.getElementsByTagName("head")[0].appendChild(script);
	}

	Array.prototype.prepend = function(index, data) {
		var next_data = this.splice(index);
		this.push(data);
		var res = this.concat(next_data);
		var i = 0;
		this.length = 0;
		while(i < res.length){
			this.push(res[i]);
			i++;
		}
	};

	// update info (lat, lng)
	/**
	* Update labels of value (such as lat, lng)
	* @param item {Object} - location of point in form {lat: Y, lon: X}
	* @param $parent {Object} - Jquery element
	*/
	function show_coord(item, $parent){
		$parent.find('.lon').html('E'+item.lon+'&deg;');
		$parent.find('.lat').html('N'+item.lat+'&deg;,');
	}

	app.routes = {};
	app.routess = {};

	var _loadded = 0;

	app.gurtamMaps = (function(){
		var MAP,
				ROUTE = [],
				MARKERS = {},
				LAST_ROUTE,
				POINTS = [],
				_firstChangeTab = true,
				_indexTab = 1,
				_afterLogin = null,
				searchField = null,
				_lastFind,
				_activeTab = null,
				MAX_POINTS = 26,
				_preStateInfoPoints = true,
				_timeout = null,
				lables = {
					km: $.localise.tr('km'),
					h: $.localise.tr('h'),
					min: $.localise.tr('min'),
				},
				self;

		var getAttribute = function(e, attrs){
			var attr = attrs || 'data-id';
			var el = e.target;
			while (el) {
				if (!el.getAttribute) {
					break;
				}
				if (el.getAttribute(attr)) {
					return el.getAttribute(attr);
				}
				el = el.parentNode;
			}
			return false;
		};

		var _initSDK = function(login, callback){
			var url = get_url_parameter("baseUrl") || get_url_parameter("hostUrl");
			if (!url) {
				return null;
			}

			_afterLogin = callback;
			// null 0x800
			wialon.core.Session.getInstance().initSession(url);
			var sid = get_url_parameter("sid");
			var authHash = get_url_parameter("authHash");

			if (authHash) {
				wialon.core.Session.getInstance().loginAuthHash(authHash, login);
			} else if (sid) {
				wialon.core.Session.getInstance().duplicate(sid, "", true, login);
			}
		};

		/**
		* Update info such as distance, duration trip
		* @param item {Object} - response from method getRouteViaWaypoints
		*/
		var _updateInfo = function(result){
			var res = $.extend({
				distance: {text:'&ndash;'},
				duration: {text:'&ndash;'}
			}, result);
			$('.label-distance span').html(res.distance.text);
			$('.label-time span').html(res.duration.text);
		};

		/**
		* Initialize map (Leaflet)
		*
		* Added handler on click and some one, setting of map
		*/
		var _initMap = function(){
			// create Gurtam Maps layer
			app.sections = [];
			var gurtam = L.tileLayer.webGis(wialon.core.Session.getInstance().getBaseGisUrl(), {
				attribution: "Gurtam Maps",
				minZoom: 4,
				userId: wialon.core.Session.getInstance().getCurrUser().getId()
			});
			// create map object
			MAP = L.map("map", {
				center: [53.505,28.49],
				zoom: 6,
				layers: [gurtam],
				doubleClickZoom: false,
				dragging: true
			});

			maps = MAP;

			// create map object
			ROUTE = L.polyline([], {color: 'red'}).addTo(MAP);

			MAP.on('mouseup',function(e){
				MAP.removeEventListener('mousemove');
			});

			MAP.on("click", function (evt) {
				var $input;
				/* jshint eqeqeq: false*/
				if(_activeTab == 'tab-search'){
					$input = $('.search-point.selected');
					$('input.address-input').removeClass('selected');
				}else{
					$input = $('input.address-input.selected');
				}
				_searchBlock();
				// var $input = $('input.address-input.selected');
				if($input && $input.length){
					show_marker(evt.latlng, false, $input, true, function(){
						$('.add-point').trigger('click', true);
						_searchBlock();
					});
				}
			});

			MAP.on("dblclick", function (evt) {
				var $input, cb = function(){};
				/* jshint eqeqeq:false */
				if(_activeTab == 'tab-search'){
					$input = $('.search-point');
					if($input.length){
						show_marker(evt.latlng, false, $input, true, function(){
							$('.add-point').trigger('click', true);
						});
					}
				}else	if(POINTS.length >= 2 && !$('.find-address').val() && POINTS.length < MAX_POINTS){
					var notFillInputs = _.filter(POINTS, function(point){ return !point.lat || !point.lon; });
					if(notFillInputs.length){
						var id = notFillInputs[0].id;
						if(id)
							$input = $('.point[data-point-index='+id+']').find('input');
					}else{
						$input = $('.find-address');
						cb = function(){
							$('.add-point').trigger('click', true);
						};
					}
					_searchBlock();
					if($input && $input.length){
						show_marker(evt.latlng, false, $input, true, cb);
					}
				}else{
					app.notify.add($.localise.tr('You have reached the limit of points.'), true, 'error');
				}
			});
		};

		var Routes = (function(){
			var styles = {
				success: {"color": "#17adfb", "opacity": 0.7},
				error: {"color": "red", "opacity": 0.7}
			};
			// var routes = {};
			var routes = [];
			return {
				add: function(index, options, style){
					var st = style ? style : styles.success;
					var tmp = L.polyline([], st).addTo(MAP);

					if(tmp && tmp.options){
						$.extend(tmp.options, options || {});
					}

					if( ! routes.length){
						// routes[index] = tmp;
						routes.push(tmp);
					}else{
						routes.prepend(index, tmp);
					}

					return tmp;
				},
				get: function(index){
					if(index === undefined)
						return routes;

					return (this.exist(index)) ? routes[index] : null;
				},
				set: function(index, options){
					if(options && this.exist(index)){
						var tmp = this.get(index);
						$.extend(tmp.options, options || {});
					}
				},
				update: function(section_key, data, isOk, isRemove){
					var style = isOk ? styles.success : styles.error;
					var tmp_route;

					if(this.exist(section_key)){
						this.get(section_key).setStyle(style).setLatLngs(data);
					}else{
						// debugger;
						if( ! isRemove){
							tmp_route = this.add(section_key, {}, style);
							tmp_route.setLatLngs(data);
							lineHandler(tmp_route);
						}
					}

					if(this.exist(section_key)){
						this.set(section_key, {index: section_key, success: isOk});
					}
				},
				prepend: function(index){
					var new_route = this.add(index, {
						index: index
					});

					lineHandler(new_route);

					_.map(routes, function(route, key){
						if(key > index){
							routes[key].options.index = routes[key].options.index*1 + 1;
						}
					});

					// console.clear();
					// _.forEach(Routes.get(), function(r){
					// 	console.log(r.options.index);
					// });
				},
				exist: function(index){
					return routes[index] ? true : false;
				},
				remove: function(index){
					var key = 1;
					if(key !== null && this.exist(index)){
						// MAP.removeLayer(this.get(key));
						MAP.removeLayer(this.get(index));
						routes.splice(index, 1);
						// delete routes[key];

						_.map(routes, function(route, key){
							// if(key > index){
								routes[key].options.index = key;
							// }
						});
					}
				},
				clearAll: function(){
					_.forEach(routes, function(route){
						MAP.removeLayer(route);
					});

					routes = [];

					return this;
				}
			};
		}());

		/**
		* Handler of login
		*
		* @param code {int} - type of code [code == 0 - success]
		*/
		var _login = function(code){
			if (code !== 0) {
				alert("Login error.");
				return null;
			}
			// init map
			_initMap();

			if(_afterLogin){
				_afterLogin();
			}
		};

		var lineHandler = function(polyline){
			var circle;
			var _onMouseDown,
					self = polyline;
			var handlers = {
				stopDnD: function (evt) {
					console.log('mouseup on circle');
					if( ! circle)
						return;

					var index = circle.options.index;
					if(index !== undefined && Routes.exist(index)){
						var $input, cb = function(){};
						/* jshint eqeqeq:false */
						if(_activeTab == 'tab-search'){
							$input = $('.search-point');
							if($input.length){
								show_marker(evt.latlng, false, $input, true, function(){
									$('.add-point').trigger('click', true);
								});
							}
						}else	if(POINTS.length >= 2 && !$('.find-address').val() && POINTS.length < MAX_POINTS){
							var notFillInputs = _.filter(POINTS, function(point){ return !point.lat || !point.lon; });
							if(notFillInputs.length){
								var id = notFillInputs[0].id;
								if(id)
									$input = $('.point[data-point-index='+id+']').find('input');
							}else{
								$input = $('.find-address');
								cb = function(){
									Routes.prepend(index);
									$('.add-point').trigger('click', [true, app.sections[index]]);
								};
							}
							_searchBlock();
							if($input && $input.length){
								show_marker(evt.latlng, false, $input, true, cb);
							}
						}else{
							app.notify.add($.localise.tr('You have reached the limit of points.'), true, 'error');
						}
					}

					_onMouseDown = false;
					MAP.removeLayer(circle);
					MAP.removeEventListener('mouseup', handlers.stopDnD);
					circle = null;
					self.setStyle({weight: 5});
				},
				mousemove: function(evt){
					console.log('move on');

					if( ! this.options.success || POINTS.length === MAX_POINTS)
						return;

					this.setStyle({weight: 8});

					var latlng = [evt.latlng.lat, evt.latlng.lng];
					if( ! circle){
						circle = L.circleMarker(latlng, {
							color: '#17adfb',
							fillColor: '#17adfb',
							clickable: true,
							index: this.options.index,
							opacity: 1,
							fillOpacity: 0.7
						});
						circle.setRadius(7);
					}else{
						circle.setLatLng(latlng);
					}
					circle.addTo(MAP);
					circle.on({
						mousedown: function () {
							MAP.on('mousemove', function (e) {
								if(circle)
									circle.setLatLng(e.latlng);
							});

							MAP.on('mouseup', handlers.stopDnD);
						}
					});
					circle.bringToBack();
				},
				mousedown: function(){
					console.log('down');
					_onMouseDown = true;
					if(circle)
						circle.fire('mousedown');
				},
				mouseout: function(evt){
					if(circle && !_onMouseDown){
						this.setStyle({weight: 5});
						MAP.removeLayer(circle);
						circle = null;
					}
				}
			};

			polyline.on(handlers);
		};

		/**
		* Render trip by points
		* unused
		*
		* @param points {Object} - array of points [{lat:y, lon:x}]
		*/
		var _renderWay = function(points){
			debugger;
			NProgress.start();
			var origin, destination;
			var waypoints = [],
					tmp_points = [];
			_.forEach(points, function(point, key){
				if(key === 0)
					origin = {lat:point.lat, lon:point.lon};
				else if(key === points.length -1)
					destination = {lat:point.lat, lon:point.lon};
				else
					waypoints.push({lat:point.lat, lon:point.lon});

				tmp_points.push({lat:point.lat, lon:point.lon});
			});

			// paint red line by trip
			ROUTE.setStyle({"color": "red"}).setLatLngs(tmp_points);
			LAST_ROUTE = new Date().getTime();
			var rt = LAST_ROUTE;


			// removed delay for getting the points of trip
			// was agreed with shmi (25.02.2015)

			// if(_timeout){
			// 	window.clearTimeout(_timeout);
			// }

			app.sections = [];
			// _timeout = setTimeout(function(){
				// build trip
				wialon.util.Gis.getRouteViaWaypoints(origin, destination, waypoints, function (code, data) {
					if (code === 0 && data && data.status !== 'NOT FOUND') {
						if(rt === LAST_ROUTE && data.sections){
							_updateInfo(data);
							var	point,
									tmp_route;
							_.forEach(data.sections, function(datas, key){
								point = POINTS[key];
								if(point){
									app.sections.push({from: point.id, to: POINTS[key+1].id, index: key, data: datas});
									point.updateData(datas, key);
									if( ! Routes.exist(point.id))
										Routes.add(point.id, {"color": "#17adfb", "opacity": 0.7});

									if( ! Routes.exist(key))
										Routes.add(key, {"color": "#17adfb", "opacity": 0.7, index: key, success: true});

									tmp_route = Routes.get(key);
									lineHandler(tmp_route);

									tmp_route.setStyle({"color": "#17adfb", "opacity": 0.7}).setLatLngs(wialon.util.Gis.decodePoly(datas.points));

									// points = points.concat(wialon.util.Gis.decodePoly(data.points));
								}

								if(key === data.sections.length && data.sections.length > 2)
									app.routes[POINTS[key+1].id] = L.polyline([], {"color": "#17adfb", "opacity": 0.7}).addTo(MAP);
							});

							ROUTE.setStyle({"color": "#17adfb", "opacity": 0.7}).setLatLngs([]);

							POINTS[POINTS.length-1].updateData({});
							//paint green line by trip
							// ROUTE.setStyle({"color": "#17adfb", "opacity": 0.7}).setLatLngs(points);
							_calculateTotalData();
							NProgress.done();
						}
					} else {
						_updateInfo();
						app.notify.add($.localise.tr('Unable to find a route.'), true, 'error');
						NProgress.done();
					}
				}, 1);
			// }, 1000);

			_searchBlock();
			_resizeHandler();
		};

		/**
		* Getting location by coordinates
		*
		* @param lonlat {Object} - {lat:y, lon:x}]
		* @param iscenter {Boolean} - show marker by center
		* @param $el {Object} - jquery element
		* @param isTMP {Boolean} - true - this point is temp
		*/
		var fetch_location = function(lonlat, iscenter, $el, isTMP, callback, isPart){
			// async get locations
			var coord = {lon: lonlat.lng || lonlat.lon, lat: lonlat.lat};
			show_coord(coord, $el.parent());
			wialon.util.Gis.getLocations([coord], function (code, result) {
				if (code === 0 && result){
					if (iscenter){
						show_marker(lonlat, iscenter, $el);
					}
					$el.val(result[0]);
					var data = $.extend({}, coord, {value: result[0]});

					// the first transition to the new tab
					if(_firstChangeTab){
						searchField = [data, $el];
					}

					// get id
					var id = $el.attr('data-id') || 'tmp';
					var key = self.getIndexBy(POINTS, 'id', id);
					if(id && key !== false){
						POINTS[key] = $.extend({}, POINTS[key], data);

						if(isPart){
							var b = _getPointsOrder();
							// debugger;
							var ids = [POINTS[key].id];
							var indexpoint = b.indexOf(POINTS[key].id);
							if(indexpoint !== 0)
								ids.push(b[indexpoint+1]);
							// if(indexpoint === 0)
							// 	ids.push(b[indexpoint-1]);
							_preRenderWay(true, ids);
						}else{
							// prerender trip
							_preRenderWay();
						}
					}

					if(isTMP){
						_lastFind = data;
					}

					if(callback && typeof callback === 'function'){
						callback();
					}
				}
			});
		};

		/**
		* Checking fill points
		*
		* If checking is successfully, then render trip by these points, and length of points >= 2
		*/
		var _preRenderWay = function(type, ids, isRemove, preventOrder){
			_resizeHandler();
			var fillPoints = _.filter(POINTS, function(point){ return point.lat && point.lon; });
			if(POINTS.length === 2){
				$('.points').addClass('way2');
			}
			else{
				$('.points').removeClass('way2');
			}

			if(fillPoints.length === POINTS.length && POINTS.length >= 2){
				$('.label-block').show();
				if(type){
					preventOrder = preventOrder || _getPointsOrder();
					_buildDndWay(preventOrder, _getPointsOrder(), ids || [], isRemove);
					return;
				}
				_renderWay(fillPoints);
			}else{
				$('.label-block').hide();
			}

			return false;
		};

		/**
		* Updating icon of marker
		*
		* @param marker {Object} - Marker
		* @param $block {Object} - jquery element
		* @param number {mix(int|boolean)} - position HTML element into the DOM
		*/
		var _updateIcon = function(marker, $block, number){
			if( ! marker){
				var marker_id = $block.find('input').attr('data-id');
				if( ! marker_id || ! MARKERS[marker_id])
					return;
				marker = MARKERS[marker_id];
			}

			marker.setIcon(new L.NumberedDivIcon({
				number: number !== undefined ? setNamePoint($block, number) : $block.find('.item-label').html(),
				iconUrl: "img/marker_"+getPointsType($block)+".png",
				iconSize: [30, 42],
				iconAnchor: [15, 42],
				cssColorText: 'icon-text-'+getPointsType($block)
			}));
		};

		/**
		* Getting and updating name of point by alphabet
		*
		* @param $el {Object} - jquery element
		* @param number {mix(int|boolean)} - position HTML element into the DOM
		*/
		var setNamePoint = function($el, numer){
			numer = numer !== undefined ? numer : POINTS.length;
			var name = String.fromCharCode(65+numer);
			$el.find('.item-label').html(name);
			return name;
		};

		/**
		* Choose color of marker
		*
		* @param $block {Object} - jquery element
		* If $block is last ement into DOM, then color = red, else green
		*/
		var getPointsType = function($block){
			var $last = $('.points div.point:last');
			/* jshint eqeqeq:false */
			return ($last.attr('data-point-index') == $block.attr('data-point-index') && $last.length !== 0) ? 'red' : 'green';
		};

		/**
		* Checking and updating position of points
		*
		* this method used for sorting and removing
		*/
		var checkMarkers = function(){
			_.forEach(POINTS, function(point, key){
				if(point && point.id !== 'tmp'){
					var marker = MARKERS[point.id];
					if(marker)
						_updateIcon(marker, marker.options.$el.parent(), key);
				}
			});

			_searchBlock();
		};

		/**
		* Sorting points
		*
		* This method used after drag and drop
		*/
		var _sortablePoints = function(){
			if($('.points').length){
				var $items = $('.points').children();
				if($items.length){
					var tmp_points = [], index;

					$items.each(function(k, item){
						index = item.getAttribute('data-point-index');
						if(index){
							var ob = _.findWhere(POINTS, {id: index});
							if(ob)
								tmp_points[k] = ob;
						}
					});

					POINTS = tmp_points;
					checkMarkers();
					// _preRenderWay();
				}
			}
		};

		/**
		* Adding point in the HTML, and storage point
		*
		* @param $tab {Object} - jquery element
		* @param data {Object} - data
		* @param isFocus {Boolean} - set focus on element
		* @param isTmpMarker {Boolean} - checking type of point
		*/
		var addPoint = function($tab, data, isFocus, isTmpMarker, section){
			data.id = _.uniqueId();
			var tpl = ' \
					<div class="point tab-content-item" data-point-index="'+data.id+'"> \
						<div class="dnd-icon"></div> \
						<div class="item-label">A</div> \
						<input type="text" class="address-input" data-id="'+data.id+'"> \
						<span class="icon-close">&times;</span> \
						<div class="item-coord"> \
							<span class="lat"></span> \
							<span class="lon"></span> \
						</div> \
						<div class="data-section"> \
							<span class="duration"></span> \
							<span class="distance"></span> \
						</div> \
					</div>';
			var $block = $(tpl);
			var tmp_data = $.extend({}, data, {
				updateData: function(data){
					var d = $.extend({
						distance:{
							text: '- '+ lables.km,
						},
						duration: {
							text: '- '+ lables.min
						}
					}, data);
					d.distance.text = d.distance.text.replace('km', lables.km);
					d.duration.text = d.duration.text.replace('h', lables.h).replace('min', lables.min);

					this.$block.find('.distance').html(d.distance.text);
					this.$block.find('.duration').html(d.duration.text);
				},
				$block: $block
			});

			var number, ids;
			if(section && (POINTS.length === 2 || POINTS.length > 2 && data.id)){
				var $last = $tab.find('.points > div[data-point-index='+section.to+']');
				$last.before($block);
				number = self.getIndexBy(POINTS, 'id', section.to);
				setNamePoint($last);
				setNamePoint($block, number);
				POINTS.prepend(number, tmp_data);

				app.sections.prepend(section.index, section);

				ids = [tmp_data.id];
				if(POINTS[number+1])
					ids.push(POINTS[number+1].id);
			}
			else{
				$tab.find('.points').append($block);
				setNamePoint($block);
				POINTS.push(tmp_data);
				ids = [tmp_data.id];
			}
			if(data && data.value){
				$block.find('input').val(data.value);
				show_coord(data, $block);
			}
			if(isFocus){
				setTimeout(function(){
					$block.find('input').trigger('click');
					$block.find('input').focus();
				}, 100);
			}

			if(isTmpMarker && MARKERS['tmp']){
				var tmp_marker = MARKERS['tmp'];
				tmp_marker.options.$el = $block.find('input');
				_updateIcon(tmp_marker, $block, number);
				MARKERS[data.id] = tmp_marker;
				delete MARKERS['tmp'];

				if($block.prev()){
					if(number)
						number -=1;
					_updateIcon(null, $block.prev(), number);
				}
			}

			_preRenderWay(true, ids);
		};

		/**
		* Painting marker on the map
		*
		* @param lonlat {Object} - data
		* @param iscenter {Boolean} - set focus on element
		* @param $el {Object} - jquery element
		* @param isFetch {Boolean} - this param used after click on the map
		*/
		var show_marker = function(lonlat, iscenter, $el, isFetch, cb){
			var id = $el.attr('data-id') || 'tmp';
			var marker;
			if (id && MARKERS[id]) {
				// update marker
				marker = MARKERS[id];
				marker.setLatLng(lonlat).addTo(MAP);
			} else {
				var text = $el.parent().find('.item-label').html();
				// create marker
				/* jshint eqeqeq:false */
				marker = L.marker(lonlat, {
					draggable: true,
					$el: $el,
					isTMP: id == 'tmp' ? true : false,
					id: id,
					icon:	new L.NumberedDivIcon({
						number: text,
						iconUrl: "img/marker_"+getPointsType($el.parent())+".png",
						iconSize: [30, 42],
						iconAnchor: [15, 42],
						cssColorText: 'icon-text-'+getPointsType($el.parent())
					})
				}).addTo(MAP);

				MARKERS[id] = marker;
				// bind drag event
				marker.on('dragstart', function(){
					$('.address-input').removeClass('selected');
				}).on('dragend', function () {
					fetch_location(this.getLatLng(), false, this.options.$el, this.options.isTMP, null, true);
				});
			}

			// center
			if (iscenter) {
				MAP.panTo(lonlat);
			}

			var myCb = function(){
				if(cb)
					cb();

				$('.address-input').removeClass('selected');
				if(POINTS.length === 2){
					var fillPoints = _.filter(POINTS, function(o){ return o.value});
					var oId;
					if(fillPoints.length !== 2){
						var indexMarker = self.getIndexBy(POINTS, 'id' , id);
						if(indexMarker === 0){
							oId = POINTS[1].id;
						}else{
							oId = POINTS[0].id;
						}
						$('.tab-content-item[data-point-index='+oId+']').find('.address-input').addClass('selected');
					}
				}
			};

			if(isFetch){
				var renderSection = id !== 'tmp' ? true : false;
				fetch_location(lonlat, false, $el, marker.options.isTMP, myCb, renderSection);
			}else{
				myCb();
			}
		};

		/**
		* Calculate distance and duration for route
		*/
		var _calculateTotalData = function(){
			var total = {
				distance: {
					value: 0,
					text: ''
				},
				duration: {
					value: 0,
					text: ''
				}
			};
			_.forEach(app.sections, function(section){
				if(section.data){
					// total.distance.value += Math.floor(section.data.distance.value);
					total.distance.value += Math.round(section.data.distance.value/1000*100)*10;
					total.duration.value += Math.floor(section.data.duration.value - section.data.duration.value % 60);
				}
			});

			var distance = total.distance.value /1000;
			total.distance.text = Math.floor(distance * 100) / 100 + ' '+lables.km;
			// total.distance.text = Math.floor(total.distance.value/1000) + '.' + Math.floor(total.distance.value % 1000).toString().substring(0,2) + ' km';
			// total.distance.text = Math.floor(total.distance.value/1000) + '.' + (total.distance.value/1000).toString().split('.')[1].substring(0,2) + ' km';
			total.duration.text = Math.floor(total.duration.value/3600) + ' '+lables.h+ ' '+ Math.floor(total.duration.value%3600/60) + ' '+lables.min;
			_updateInfo(total);
		};

		/**
		* Getting order of points
		*
		* @return stack {Array} - list ids of points
		*/
		var _getPointsOrder = function(){
			var stack = [];
			$('.point').each(function(k, el){
				var ind = $(el).attr('data-point-index');
				if(ind && $(el).css('position') !== 'absolute')
					stack.push(ind);
			});

			return stack;
		};

		/**
		* Getting differents order of points before (add/remove/change) and after.
		*
		* @param start {Array} - list ids of points before they were changed
		* @param end {Array} - list ids of points after they were changed
		* @param ids {Array} - list ads which necessary change
		* @param isRemove {Boolean} - flag - true for removing point
		*
		* @return stack {Array} - list of sections which were changed (example: {from: 1, to: 2, index: 0})
		*/
		var _getAffectPoints = function(start, end, ids, isRemove){
			var res = [];
			var first_point = false;
			var set  = function(data, key){
				if(first_point){
					if(data.next){
						app.sections[key] = {from: data.after, to: data.next, index: key};
						res.push({from: data.after, to: data.next, index: key});
					}
					return;
				}

				if(data.prev && data.after){
					app.sections[key] = {from: data.prev, to: data.after, index: key};
					res.push({from: data.prev, to: data.after, index: key});
				}
				else if(data.next){
					app.sections[key] = {from: data.prev, to: data.after, index: key};
					res.push({from: data.prev, to: data.after, index: key});
				}else{
					app.sections.splice(key, 1);
					// if(app.routess[key]){
					// 	MAP.removeLayer(app.routess[key]);
					// 	delete app.routess[key];
					// }
				}
			};

			if(start.length === end.length || isRemove){
				var i = 0;
				var changedInds = {};
				var prev, p;
				var allow_add = false;
				var length = (isRemove) ? start.length : end.length;
				while(i < length){
					if(end[i] !== start[i] || allow_add || ids && (ids.indexOf(end[i]) !== -1)){ //|| ids.indexOf(p) !== -1
						if(isRemove && _.keys(changedInds).length){
							i++;
							continue;
						}

						if(i === 0)
							first_point = true;

						if(end[i] === undefined){
							console.log('was remove point');
							i++;
							continue;
						}

						changedInds[i] = {
							after: end[i],
							before: start[i],
							next: end[i+1],
							prev: end[i-1]
						};

						if(i && i % 2 === 0 && !ids){
							allow_add = true;
							i++;
							p = end[i];
							continue;
						}
					}

					if( ! first_point){
						prev = {
							after: end[i],
							before: start[i],
							next: end[i+1],
							prev: end[i-1]
						};
					}

					p = end[i];

					allow_add = false;
					i++;
				}


				_.forEach(changedInds, function(data, key){
					if( ! first_point)
						key = key -1;
					set(data, key);
				});

				_.forEach(app.sections, function(section, key){
					section.index = key;
				});

				return res;
			}
		};

		/**
		* Rendering trip by section.
		*
		* @param dnd_s {Array} - list ids of points before they were changed
		* @param dnd_e {Array} - list ids of points after they were changed
		* @param ids {Array} - list ads which necessary change
		* @param isRemove {Boolean} - flag - true for removing point
		*/
		var _buildDndWay = function(dnd_s, dnd_e, ids, isRemove){
			_sortablePoints();
			NProgress.start();
			console.log(dnd_s, dnd_e, ids);

			var points = _getAffectPoints(dnd_s, dnd_e, ids, isRemove);

			console.log(points);

			var updateRoute = function(section_key, data, isOk, remove){
				// var style = isOk ? {"color": "#17adfb", "opacity": 0.7} : {"color": "red", "opacity": 0.7};
				var currect_ind = section_key;
				if(remove && section_key !== 0){
					section_key -= 1;
					if(app.sections[currect_ind])
						app.sections.splice(currect_ind, 1);
				}

				Routes.update(section_key, data, isOk, remove);
			};

			var cache = {},
					tmp_point_from,
					tmp_point_to,
					p = [],
					waypoints = [],
					tmp_points;

			_.forEach(points, function(point, key){

				tmp_points = [];
				if( ! cache[point.from]){
					tmp_point_from = _.findWhere(POINTS, {id: point.from});
					if(tmp_point_from){
						cache[point.from] = tmp_point_from;
					}
				}
				tmp_point_from = cache[point.from];
				tmp_point_from.updateData({});

				if(!p.length || p[p.length-1].id !== tmp_point_from.id)
					p.push(tmp_point_from);

				tmp_points.push({lat:tmp_point_from.lat, lon:tmp_point_from.lon});

				if( ! cache[point.to]){
					tmp_point_to = _.findWhere(POINTS, {id: point.to});
					if(tmp_point_to){
						cache[point.to] = tmp_point_to;
					}
				}

				tmp_point_to = cache[point.to];
				// tmp_point_to.updateData({});
				if(!p.length || p[p.length-1].id !== tmp_point_to.id)
					p.push(tmp_point_to);

				tmp_points.push({lat:tmp_point_to.lat, lon:tmp_point_to.lon});

				var k = null;
				_.forEach(app.sections, function(o, keySection){
					if(o.from === tmp_point_from.id || o.to === tmp_point_to.id)
						k = keySection;
				});

				if( !_.isNull(k))
					updateRoute(k, tmp_points, null, isRemove);
			});

			var origin, destination;

			_.forEach(p, function(point, key){
				if(key === 0)
					origin = {lat:point.lat, lon:point.lon};
				else if(key === p.length -1)
					destination = {lat:point.lat, lon:point.lon};
				else
					waypoints.push({lat:point.lat, lon:point.lon});
			});

			_updateInfo();

			if( ! p.length){
				NProgress.done();
				_calculateTotalData();
				return;
			}

			_loadded++;
			// setTimeout(function(){
				wialon.util.Gis.getRouteViaWaypoints(origin, destination, waypoints, function (code, data) {
					_loadded--;
					if (code === 0 && data.status !== "NOT FOUND"){
						var point,
								tmp_points,
								error = false,
								tmp,
								index;
						_.forEach(data.sections, function(data, key){
							point = points[key];
							// index = null;
							_.map(app.sections, function(section){
								index = null;
								if(section.from === point.from){
									index = section.index;
									tmp = _.findWhere(POINTS, {id: point.from});
								}
								else if(section.to === point.to){
									index = section.index;
									tmp = _.findWhere(POINTS, {id: point.to});
								}

								if(index !== null){
									section.data = data;
								}
							});
							if(point){
								tmp.updateData(data, index);
								tmp_points = wialon.util.Gis.decodePoly(data.points);
								if(tmp_points.length > 2){
									updateRoute(point.index, wialon.util.Gis.decodePoly(data.points), true);
								}else
									error = true;
							}
						});

						// _.forEach(app.routess, function(route, key){
						// 	if(! app.sections[key]){
						// 		MAP.removeLayer(route);
						// 		delete app.routess[key];
						// 	}
						// });
						if(error)
							app.notify.add($.localise.tr('Unable to find a route.'), true, 'error');

						_calculateTotalData();

					} else {
						_updateInfo();
						app.notify.add($.localise.tr('Unable to find a route.'), true, 'error');
					}

					if(! _loadded)
						NProgress.done();
				}, 1);
			// }, 2000);
		};

		/**
		* Adding handler for new field and adding autocomplete
		*
		* Adding drag and drop of points (html elements)
		*/
		var _bindAutoCompleate = function(){
			// bind events
			// var expr = new RegExp('^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?,[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$', 'i');
			// var expr = /(\d+)[.]*/ig;
			var expr = /[n|e]{0,1}[-+]*(\d)+[.]+\d+/ig;

			$(".address-input").each(function (j, elem) {
				if(elem.autocomplete){
					return;
				}

				var $block = $(elem).parent(),
						dnd_s = {},
						dnd_e = {},
						drag_index = null;
				if($block.parent().hasClass('points')){
					var config = {
						containment: ".tab-index-2",
						cancel: ".item-coord, .address-input, .icon-close, .label-block, .data-section",
						helper: "clone",
						start: function(e, drag) {
							drag_index = null;
							var prevElmts = drag.item.prevAll();

							dnd_s = _getPointsOrder(true);

							console.log('start dnd:');
							console.log(dnd_s);
							drag_index = prevElmts.length + 1;
							drag.helper.find('.icon-close').hide();
						},
						stop: function(e, drag) {
							console.log('end dnd:' + drag.item.attr('data-point-index'));
							var prevElmts = drag.item.prevAll();
							if(drag_index !== null && (prevElmts.length+1) !== drag_index){
								dnd_e = _getPointsOrder();

								console.log('end dnd:');
								console.log(dnd_e);

								_buildDndWay(dnd_s, dnd_e);

								_sortablePoints();
							}
							drag.item.find('.icon-close').show();
						}
					};

					if(mobile){
						config.cancel = "";
					}
					$block.parent().sortable(config);
				}

				$(elem).autocomplete({
					open: function(event, ui){
						var $input = $(event.target),
								$results = $input.autocomplete("widget"),
								top = $results.position().top,
								height = $results.height(),
								inputHeight = $input.height(),
								newTop = top - height - inputHeight;

						$results.removeClass('min-autocompleate');

						if($(window).height() < $input.offset().top + $input.height()+$results.height()){
							$results.addClass('min-autocompleate');
							if($(window).height() < $input.offset().top + $input.height()+$results.height())
								$results.css("top", newTop + "px");
						}
					},
					source: function (request, response) {
						var r =request.term.match(expr);
						if (request.term === ""){
							return [];
						}

						if(r && r.length === 2){
							var coord = {
								lat: r[0].replace(/[n|e]/gi, '')*1,
								lng: r[1].replace(/[n|e]/gi, '')*1
							};
							show_marker(coord, true, this.element, true, function(){
								$('.add-point').trigger('click', true);
							});
							return [];
						}

						wialon.util.Gis.searchByString(request.term, 0x800, 10, function(code, data) {
							if (code || !data){
								return;
							}
							ADDRESS_SOURCE = [];

							var i, len, temp, loc, params;

							$(elem).parent().children(".search-result").empty();

							for(i=0, len=data.length; i<len; i++) {
								temp = data[i];
								if (temp && temp.items && temp.items[0]) {
									loc = temp.items[0];
									params = {
										label: loc.formatted_path,
										lon: loc.x,
										lat: loc.y
									};
									ADDRESS_SOURCE.push(params);
								}
							}

							response(ADDRESS_SOURCE);
						});
					},
					select: function (event, ui) {
						var id = $(this).attr('data-id');

						if($(this).hasClass('find-address')){
							_lastFind = ui.item;
						}
						if(_firstChangeTab){
							searchField = [ui.item, $(this)];
						}else{
							var item = _.findWhere(POINTS, {id: id});
							if(item){
								item = $.extend(item, ui.item);
							}
						}
						show_marker(ui.item, true, $(this), true, function(){
							if(!id){
								$('.add-point').trigger('click', true);
							}
						});
						show_coord(ui.item, $(this).parent());
						if( ! $(this).hasClass('find-address')){
							_preRenderWay(true, [id]);
						}
					},
					delay: 500,
					minLength: 2
				});

				elem.autocomplete = true;
			});
		};

		var _searchBlock = function(){
			var fillPoints = _.filter(POINTS, function(point){ return point.lat && point.lon; });
			if(POINTS.length >= MAX_POINTS){
				$('.find-block').hide();
			}
			else
				$('.find-block').show();

			if(fillPoints.length < 2)
				$('.find-block').hide();

			if( ! fillPoints.length && POINTS.length && !_preStateInfoPoints){
				$('.points').addClass('hide-info');
			}
			if(fillPoints.length === 2 && !_preStateInfoPoints){
				$('.points').removeClass('hide-info');
			}
		};

		/**
		* Adding handlers (click|keypress|etc)
		*
		* Adding handler on each tab
		*/
		var _initHandlers = function(){
			var $tabs = $('.tabs');
			var $body = $('body');
			$tabs.each(function(key, item){
				var $tab = $(item);
				var $controls = $tab.find('.tabs-control a');
				$controls.on('click', function(e){
					e.preventDefault();
					var index = $(this).attr('data-tab-index');
					/* jshint eqeqeq:false */
					if( ! index || _indexTab == index)
						return;

					$controls.removeClass('active');
					$(this).addClass('active');
					$('.tab-content').hide();
					$('.tab-index-'+index).show();
					var data = {};

					if(_firstChangeTab){
						addPoint($tab, data, true);
						if(searchField)
							data = $.extend(data, searchField[0]);

						addPoint($tab, data, false, true);
					}else{
						if(MARKERS['tmp'])
							MAP.removeLayer(MARKERS['tmp']);
					}

					_setActiveTab();
					_bindAutoCompleate();

					_firstChangeTab = false;
					_indexTab = index;
					_resizeHandler();
				});

				$body.on('click', '.add-point', function(e, a, section){
					_searchBlock();
					if(POINTS.length >= MAX_POINTS){
						if(_activeTab !== 'tab-search')
							app.notify.add($.localise.tr('You have reached the limit of points.'), true, 'error');
						return;
					}

					if($(this).parent().find('.address-input').val()){
						var data = {};
						if(_lastFind)
							data = _lastFind;

						addPoint($tab, data, null, true, section);
						_bindAutoCompleate();

						$('.address-input').removeClass('selected');

						if(_lastFind)
							_lastFind = null;
						$(this).parent().find('.address-input').val('');
					}
				});

				$body.on('click', '.icon-close', function(e){
					var index = getAttribute(e, 'data-point-index');
					if(index){
						var item = _.findWhere(POINTS, {id: index});
						if(item && POINTS.length > 2){
							var $block = $('.point[data-point-index='+item.id+']');
							var marker_id = $block.find('input').attr('data-id');
							if(MARKERS[marker_id])
								MAP.removeLayer(MARKERS[marker_id]);
							delete MARKERS[marker_id];
							var ind = self.getIndexBy(POINTS, 'id', index);
							if(ind !== false)
								POINTS.splice(ind*1,1);

							var sectionInd = null, wasFound = false;
							_.map(app.sections, function(section){
								if(section.from === item.id && ! wasFound){
									wasFound = true;
									sectionInd = section.index;
								}
								else if(section.to === item.id && ! wasFound){
									wasFound = true;
									sectionInd = section.index;
								}
							});

							if(!_.isNull(sectionInd) && Routes.exist(sectionInd)){
								// app.routess[sectionInd].
								Routes.remove(sectionInd);
								app.sections[sectionInd].data.distance.value = 0;
								app.sections[sectionInd].data.duration.value = 0;
								// app.sections.splice(sectionInd, 1);
							}

							var preventItems = _getPointsOrder();
							$block.remove();
							_preRenderWay(true, [item.id], true, preventItems);
							checkMarkers();
							_calculateTotalData();
						}
					}
				});

				$body.on('click', '.btn-clear-trip', function(){
					$('.points').html('');
					// MAP.removeLayer(ROUTE);
					ROUTE.setStyle({}).setLatLngs([]);

					_.forEach(MARKERS, function(marker){
						MAP.removeLayer(marker);
					});

					MARKERS = {};
					POINTS = [];
					Routes.clearAll();
					app.sections = [];
					var data = {};
					addPoint($tab, data, true);
					addPoint($tab, data, false, true);
					_preStateInfoPoints = $('.points').hasClass('hide-info');

					_searchBlock();
					_setActiveTab();
					_bindAutoCompleate();
					_calculateTotalData();

					_firstChangeTab = false;
					_resizeHandler();

				});
			});

			$body.on('click', '.toggle-btn', function(){
				$('.points').toggleClass('hide-info');
				_preStateInfoPoints = $('.points').hasClass('hide-info');
				$(this).toggleClass('collapse');
				_resizeHandler();
				setTimeout(function(){
					_resizeHandler();
				}, 500);
			});

			$body.on('click', '.btn-download-kml', function(e){
				e.preventDefault();
				self.export.kml('gurtamMaps.kml');
			});

			$body.on('keypress', '.address-input', function (event) {
				if (event.which === 13) {
					$(this).autocomplete("search");
					// $(this).parent().children(".btn").trigger("click");
				}
			});

			$body.on("click", '.address-input', function (e){
				$(".address-input.selected").removeClass("selected");
				$(this).addClass("selected");
				this.focus();
				return true;
			});

			$tabs.on('click', function(e, silent){
				if(e.target && !$(e.target).hasClass('address-input') && !silent){
					$('.address-input').removeClass('selected');
				}
			});
		};

		var _setActiveTab = function(){
			var $tabs = $('.tabs-control').children();
			$tabs.each(function(k, el){
				var $el = $(el);
				if($el.hasClass('active')){
					if($el.hasClass('tab-search'))
						_activeTab = 'tab-search';
					else if($el.hasClass('tab-routes'))
						_activeTab = 'tab-routes';
				}
			});
		};

		var _resizeHandler = function(){
			var prev_scrollTop = $('.tab-content.tab-index-2').find('.points').scrollTop();
			$('.tabs').css('height', 'auto');
			var $tab2 = $('.tab-content.tab-index-2'),
				win_h = $(window).height(),
				header_h = $('.header').height(),
				h_tab = $tab2.outerHeight(),
				h_points = $('.points').height(),
				h_labes = $tab2.find('.label-block').outerHeight(), // 15 - padding+border
				CONTROL_HEIGHT = 35,
				MARGIN = 15,
				h_find_block = $tab2.find('.find-block').outerHeight();
				// h_find_block += h_find_block ? 21 : 0; // 21 -padding + border

			if(h_tab && $tab2[0].clientHeight){
				$('.points').css('height', '100%');
				if($.browser.opera)
					h_tab = (win_h - header_h-CONTROL_HEIGHT);

				if(h_tab+CONTROL_HEIGHT+header_h+30 >= win_h){
					if(!$.browser.opera && !mobile || $.browser.chrome){
						// if(mobile)
						// 	h_labes += 2;
						// else
						// 	h_labes -= 2;
						if(!$('.find-block').get(0).clientHeight)
							$('.points').css('height', 'calc(100% - '+h_labes+'px)');
						else
							$('.points').css('height', 'calc(100% - '+(h_labes+h_find_block)+'px)');

						$('.tabs').css('height', '100%');
					}else{
						// h_points = $('.points').children().length*58;
						// if(mobile){
						h_points = 0;
						$('.points').children().each(function(k, el){
							h_points += $(el).outerHeight();
						});
						// }
						if(h_points+15+CONTROL_HEIGHT+header_h+h_labes+h_find_block > win_h){
							h_points = win_h - header_h-MARGIN-CONTROL_HEIGHT;
							if(!$('.find-block').get(0).clientHeight)
								$('.points').css('height', (h_points-h_labes-MARGIN)+'px');
							else
								$('.points').css('height', (h_points-(h_find_block+h_labes)-MARGIN) + 'px');
						}else{
							h_points = h_points;
							$('.points').css('height', h_points+'px');
						}

						$('.points').css('overflow-y','auto');
						$('.tabs').css('height', 'auto');
					}
				}
			}
			$('.tab-content.tab-index-2').find('.points').scrollTop(prev_scrollTop);
		};

		/**
		* global methods
		*
		*/
		return {
			init: function(){
				self = this;
				_initSDK(_login, function(){
					_initHandlers();
					_bindAutoCompleate();
					_setActiveTab();
				});

				$(window).on('beforeunload', function(){
					wialon.core.Session.getInstance().logout();
				});

				return this;
			},
			export: (function(){
				return {
					kml: function(name){
						var buildPoints = function(){
							var point_tpl = function(point, index){
								return ('<Placemark> \
													<name>'+point.value+'</name> \
													<description></description> \
														<Point> \
														<coordinates>'+point.lon + ',' + point.lat +',0</coordinates> \
														</Point> \
														' +buildLines(index)+'\
												</Placemark>');
							};
							var data = [];
							_.forEach(POINTS, function(point, key){
								data.push(point_tpl(point, key));
							});

							return data.join('');
						};

						var buildLines = function(index){
							if ( ! app.sections[index])
								return '';

							var lines = [],
									tmp_points;
							var section = app.sections[index];
							if(section.data && section.data.points){
								tmp_points = wialon.util.Gis.decodePoly(section.data.points);
								_.forEach(tmp_points, function(line){
									lines.push(line.lon + ',' + line.lat+',0.0');
								});
							}

							return ('<LineString> \
												<extrude>1</extrude> \
												<tessellate>1</tessellate> \
												<altitudeMode>absolute</altitudeMode> \
												<coordinates>'+lines.join(' ')+'</coordinates> \
											</LineString>');
						};

						var output = '<?xml version="1.0" encoding="UTF-8"?> \
													<kml xmlns="http://www.opengis.net/kml/2.2"> \
													<Document> \
														<name>Gurtam maps</name> \
														'+ buildPoints() +' \
													</Document> \
													</kml>';

						var blob = new Blob([output], {type: "text/plain;charset=utf-8"});
						/* global saveAs */
						saveAs(blob, name || 'gurtamMaps.kml');
					}
				};
			})(),
			initResize: function(){
				$(window).on('resize', _resizeHandler);
				_resizeHandler();
				if(!mobile){
					$('.tab-content.tab-index-2 .points').niceScroll({
						cursorcolor:"#ECECEC",
						// touchbehavior: true,
						// nativeparentscrolling: true,
						// touchbehavior: true,
						// preventmultitouchscrolling: false,
						horizrailenabled: false
					});
					$('.tab-content.tab-index-2 .points').getNiceScroll().hide();
				}
			},
			/**
			* Getting unique id
			*/
			uniqid: function (pr, en) {
				pr = pr || '', en = en || false;
				var result;

				this.seed = function (s, w) {
					s = parseInt(s, 10).toString(16);
					return w < s.length ? s.slice(s.length - w) : (w > s.length) ? new Array(1 + (w - s.length)).join('0') + s : s;
				};

				result = pr + this.seed(parseInt(new Date().getTime() / 1000, 10), 8) + this.seed(Math.floor(Math.random() * 0x75bcd15) + 1, 5);
				if (en) result += (Math.random() * 10).toFixed(8).toString();

				return result;
			},
			/**
			* Getting index of data in array by the key and value
			*/
			getIndexBy: function (pull, name, value) {
				/* jshint eqeqeq:false */
				for (var i = 0; i < pull.length; i++) {
					if (pull[i][name] == value) {
						return i;
					}
				}

				return false;
			}
		};
	}());

	//DOM is ready
	$(document).ready(function () {
		NProgress.start();
		var url = get_url_parameter("baseUrl");
		if (!url)
			url = get_url_parameter("hostUrl");
		if (!url)
			return null;
		url += "/wsdk/script/wialon.js";
		$('.label-distance').html($.localise.tr('Total:')+' <span></span>');
		$('.btn-clear-trip').html($.localise.tr('Clear All'));
		$('.label-time').html(', <span></span>'); //$.localise.tr('Time')
		// load wialon sdk
		load_script(url, function(){
			app.notify.init();
			app.gurtamMaps.init().initResize();
			$(".address-input").val('');
			NProgress.done();
		});
	});
})(jQuery, app || {});
