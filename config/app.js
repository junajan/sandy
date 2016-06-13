var _ = require('lodash');
var cookieParser = require('cookie-parser');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var FileStore = require('session-file-store')(session);


module.exports = function(app, config) {
	app.set('views', __dirname + '/../web/views');
	app.set('view engine', 'ejs');
	app.set('view options', {
		layout: false
	});

	app.use(cookieParser());
	app.use(session({
		secret: 'This was really big kind of stuff',
		saveUninitialized: true,
		resave: false,
		store: new FileStore({
			path: config.root+"/sessions",
			reapInterval: 800
		}),
		saveUninitialized: false,
		cookie: { maxAge: 31 * 24 * 60 * 60 * 1000 }
	}));

	app.use(bodyParser.urlencoded({extended:false}));

	app.config = config;
	app.logger = config.logger;
	app.memLogger = config.memLogger;
	app.getLogger = function (type) {
		return app.logger.getLogger(type);
	};

	return app;
};