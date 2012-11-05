var http = require('http');

PHLgeolocate = function() {
	this.geoHost = 'http://services.phila.gov';
	this.locationPath = '/ULRS311/Data/Location/';
	this.liAddressKeyPath = '/ULRS311/Data/LIAddressKey/';
	this.minConfidence = 85;
	this.responseBody;
};

PHLgeolocate.prototype.getCoordinates = function (address, callback) {
	var url = this.geoHost + this.locationPath + encodeURI(address);
	this.makeApiCall(url, callback);
};

PHLgeolocate.prototype.getAddressKey = function (address, callback) {
	var url = this.geoHost + this.liAddressKeyPath + encodeURI(address);
	this.makeApiCall(url, callback);
};

PHLgeolocate.prototype.makeApiCall = function (url, callback) {
	var self = this;
	self.responseBody = '';
	http.get(url, function(res) {
		res.setEncoding('utf8');
		res.on('data', function(chunk) {
			self.responseBody += chunk;
		});
		res.on('end', function(){
			var result = self.parseResponse(JSON.parse(self.responseBody));
			callback(result);
		});
	});
};

PHLgeolocate.prototype.parseResponse = function (result) {
	var self = this;
	locations = [];
	for(var i=0; i<result.Locations.length; i++) {
		var location = result.Locations[i]
		if(location.Address.Similarity >= self.minConfidence) {
			var geometry = { address: location.Address.StandardizedAddress, similarity: location.Address.Similarity, latitude: location.YCoord, longitude: location.XCoord };
			locations.push(geometry);
		}
	}
	return locations;
};

exports.PHLgeolocate = PHLgeolocate;