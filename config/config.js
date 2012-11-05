Config = function() {

	// General
	this.listen_port = 3000;
	
	// SMSified
	this.smsified_user = '';
	this.smsified_password = '';
	this.smsified_sender_address = '';

	// CouchDB
	this.couchdb_host = '';
	this.couchdb_port = '';
	this.couchdb_user = '';
	this.couchdb_password = '';
	this.couchdb_name = '';

};

exports.Config = Config;
