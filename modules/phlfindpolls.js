var http = require('http');

PHLfindpolls = function(options) {
	var geometryType = options.geometryType || 'esriGeometryPoint';
	var inSR = options.inSR || 4326;
	var spatialRel = options.spatialRel || 'esriSpatialRelWithin';
	var returnCountOnly = options.returnCountOnly || 'false';
	var returnIdsOnly = options.returnIdsOnly || 'false'
	var returnGeometry = options.returnGeometry || 'false';
	var f = options.f || 'pjson';

	this.responseBody;
	this.apiHost = 'http://gis.phila.gov/ArcGIS/rest/services/PhilaGov';
	this.locationPath = '/PollingPlaces/MapServer/1/query';
	this.settings = {
		geometryType: geometryType,
		inSR: inSR,
		spatialRel: spatialRel,
		returnCountOnly: returnCountOnly,
		returnIdsOnly: returnIdsOnly,
		returnGeometry: returnGeometry,
		outFields: encodeURI(options.outFields.join(',')),
		f: f
	};
};

PHLfindpolls.prototype.findLocation = function(latitude, longitude, callback) {
	var url = this.apiHost + this.locationPath;
	url += '?';
	for(item in this.settings) {
		url +=  item + '=' + encodeURI(this.settings[item]) + '&';
	}
	url += 'geometry={"x":"' + longitude + '","y":"' + latitude + '"}';
	this.makeApiCall(url, callback);
};

PHLfindpolls.prototype.makeApiCall = function (url, callback) {
	var self = this;
	self.responseBody = '';
	http.get(url, function(res) {
		res.setEncoding('utf8');
		res.on('data', function(chunk) {
			self.responseBody += chunk;
		});
		res.on('end', function(){
			var result = JSON.parse(self.responseBody);
			callback(result.features);
		});
	});
};

exports.PHLfindpolls = PHLfindpolls;
