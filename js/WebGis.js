OpenLayers.Layer.WebGIS = OpenLayers.Class(OpenLayers.Layer.TMS, {
	/* Parameters */
	map_tags: "",
	res_name: "/gis_render",
	img_name: "tile",
	compress_url: false,
	minZoom: 4,
	url: "",
	urls: [],
	buffer: 1,
	transitionEffect: null,
	/* Functions */
	/// Initialization routne
	initialize: function(name, url, params, options) {
		this.isBaseLayer = true;
		this.url = url;
		this.urls = [];
		OpenLayers.Layer.TMS.prototype.initialize.apply(this, arguments);
		var arr = this.url.split(",");
		if (arr.length >= 2) {
			for (var i = 0; i < arr.length; i++)
				this.urls.push(arr[i]);
			this.url = arr[0];
		}
	},
	/// Determine tile URL
	getURL: function (bounds) {
		var res = this.map.getResolution();
		var x = Math.round((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
		var y = Math.round((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
		var z = this.map.getZoom();
		var limit = Math.pow(2, z);
		if (y < 0 || y >= limit || z > 20) {
			return OpenLayers.Util.getImagesLocation() + "404.png";
		} else {
			x = ((x % limit) + limit) % limit;
			var url = this.url;
			if (this.urls.length >= 2) {
				// select server
				var index = x % this.urls.length;
				url = this.urls[Math.floor(index)];
			}
			url += this.res_name + "/" + x + "_" + y + "_" + (17 - z) + "/" + this.img_name + ".png";
			if (!this.compress_url)
				url += "?m=" + this.map_tags;
			return url;
		}
	},

	/**
	 * Method: clone
	 *
	 * Parameters:
	 * obj - {<OpenLayers.Layer.VelcomWebGIS>} The layer to be cloned
	 *
	 * Returns:
     * {<OpenLayers.Layer.VelcomWebGIS>} An exact clone of this <OpenLayers.Layer.VelcomWebGIS>
	 */
	clone: function (obj) {
		if (obj === null) {
			obj = new OpenLayers.Layer.WebGIS("Gurtam Maps", 
											  wialon.core.Session.getInstance().getBaseGisUrl("render"), 
											  {compress_url: true});
		}
		obj = OpenLayers.Layer.TMS.prototype.clone.apply(this, [obj]);
		return obj;
	},
	
	CLASS_NAME: "OpenLayers.Layer.WebGIS"
});
