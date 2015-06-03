var _ = require('lodash');
var fs = require('fs');
var assert = require('assert');
var cookieParser = require('cookie-parser');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var FileStore = require('session-file-store')(session);

var _config = {
	port: 3000,
	scheduleHour: 5,
	dateOffset: 30,
	api: "/api",
	auth: {
		username: "admin",
		password: "admin",
	},
	sms: {
		from: "s@a.ndy",
		to: "721235063@sms.cz.o2.com",
		subject: "q"
	},
	email: {
		from: "sandy",
		subject: "Sandy",
		to: "mail@janjuna.cz"
	},
};

module.exports = function(app) {
	var self = this;

	// check if we have config file for this env
	if (!fs.existsSync('./config/' + app.get('env') + '.js'))
		assert.fail(app.get('env'), 'development or production', 'Invalid environment was specified');

	// merge local and public config
	_config = _.merge(_config, require("./config"));

	// set to app so other modules can use it	
	app.set('conf', _config);

	app.set('views', __dirname + '/../web/views');
	app.set('view engine', 'ejs');
	app.set('view options', {
		layout: false
	});

	app.use(cookieParser());
	app.use(bodyParser.urlencoded({extended:false}));
	
    app.use(session({
        resave: true,
        saveUninitialized: true,
        store: new FileStore({ path: __dirname+'/../sessions/',}),
        secret: _config.sessionSecret || 'keyboard cat'
    }));
    
	return _config;
};