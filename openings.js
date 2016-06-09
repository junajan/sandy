require('colors');
var async = require("async");
var moment = require("moment");
var server = require('./modules/Server');
var conf = require("./config/public")(server.app);
conf.port++;
var app = server.run(conf);
app.set("db",require('./modules/Mysql')(conf.mysql));
app.set("config", conf);

var Openings = require('./modules/Openings')(app);


console.log('Loading openings');

Openings.importData(function(err, res) {
	if(err) throw err;
	console.log('Openings was loaded: ', res);
	process.exit(0);
});
