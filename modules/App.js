var express = require('express');
var https = require('https');
var fs = require('fs');
var ssl = require('express-ssl');
var reload = require('reload');

module.exports = (function() {
	var self = this;
	var options = {
	    key: fs.readFileSync('./cert/server.key'),
	    cert: fs.readFileSync('./cert/server.crt'),
	};
	
	this.app = express();

	this.run = function(conf) {
		var server = https.createServer(options, self.app);

		server.listen(conf.port, function(){
			console.log("Express server listening on port " + conf.port);
		});

		if(conf.livereload)
			reload(server, self.app, conf.livereloadTime || 2000);

		return self.app;
	};

	return this;
})();