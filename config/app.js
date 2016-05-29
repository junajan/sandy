var _ = require('lodash');
var cookieParser = require('cookie-parser');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');


module.exports = function(app) {

	app.set('views', __dirname + '/../web/views');
	app.set('view engine', 'ejs');
	app.set('view options', {
		layout: false
	});

	app.use(cookieParser());
	app.use(bodyParser.urlencoded({extended:false}));
	
	return app;
};