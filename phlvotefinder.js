// Include required modules.
var http = require('http');
var smsified = require('smsified');
var geo = require('geo');
var cradle = require('cradle');
require('./modules/phlfindpolls');
require('./modules/phlgeolocate');

// Include and instantiate config.
require('./config/config');
var config = new Config();

// Create HTTP server to process inbound requests from SMSified
var server = http.createServer(function inboundSMSServer(req, res) {


	// Variable to hold JSON payload.
	var payload = '';

	// Get JSON payload from SMSified.
	req.addListener('data', function getPayload(data) {
		payload += data;
	});

	// Process inbound message.
	req.addListener('end', function processPayload() {

		var json = JSON.parse(payload);
		var inbound = new InboundMessage(json);
		var address = inbound.message;
		var senderNumber = inbound.senderAddress;

		try {

			var geo = new PHLgeolocate();
			geo.getCoordinates(address, function(coords) {
				
				if(coords.length > 0) {
					var options = {};
					options.outFields = ['POLLING_PL,ADDRESS'];
					var poll = new PHLfindpolls(options);
					poll.findLocation(coords[0].latitude, coords[0].longitude, function(result) {						
						answer = result[0].attributes['POLLING_PL'] + ', ' + result[0].attributes['ADDRESS'];
						sendMessage(coords[0].latitude, coords[0].longitude, answer.replace('&', 'AND'));
					});
				}
				else {
					answer = "No results found for that address, please try again."
					sendMessage(coords[0].latitude, coords[0].longitude, answer);
				}

				function sendMessage(lat, lon, answer) {

					// Create CouchDB log record.
					var logRecord = {
						user: senderNumber,
						address: address,
						lat: lat,
						lon: lon,
						message: answer
					};

					// Set up connection to CouchDB instance for logging.
					var logdb = new (cradle.Connection)(config.couchdb_host, config.couchdb_port, {
						auth : {
							username : config.couchdb_user,
							password : config.couchdb_password
						}
					}).database(config.couchdb_name);

					// Send response SMS message.
					var sms = new SMSified(config.smsified_user, config.smsified_password);
					var options = {senderAddress: config.smsified_sender_address, address: senderNumber, message: answer};

					// Send response to user & log result.
					sms.sendMessage(options, function sendSMSMessage(result) {
						logRecord.result = result;
						logdb.save(logRecord, function saveLogRecord(err, res){
							if(err) {
								console.log('An error occured when saving message log: ' + err.error + ' ' + err.reason);
							}
						});
					});

				}				

				res.writeHead(200);
	        	res.end();

			});

		}

		catch(e) {
			// Send response SMS message.
			var sms = new SMSified(config.smsified_user, config.smsified_password);
			var answer = "There was a problem, please try again later."
			var options = {senderAddress: config.smsified_sender_address, address: senderNumber, message: answer};
			sms.sendMessage(options, function(result) {});
		}

	});

}).listen(config.listen_port);

console.log('Listening on port ' + config.listen_port);