var express = require('express');

module.exports = function(app) {
    var config = app.config;

    var Web = require('./Web')(app);
    var Api = require('./Api')(app);

    var authRoutes = express.Router();
    var apiRoutes = express.Router();

    var unauthStatic = express.static(config.root + 'web/public');
    var authStatic = express.static(config.root + 'web/auth');

    app.use(unauthStatic);
    app.use(function(req, res, next) {
        if (!req.isAuthorized()) {
            return next();
        }
        authStatic(req, res, next);
    });

    authRoutes.get('/login', Web.isNotAuthorized, Web.getLogin);
    authRoutes.post('/login', Web.isNotAuthorized, Web.doLogin);
    authRoutes.get('/logout', Web.isAuthorized, Web.doLogout);
    authRoutes.get('*', Web.isAuthorized, Web.getApp);

    apiRoutes.get('/equity', Web.isApiAuthorized, Api.getEquity);
    apiRoutes.get('/watchlist', Web.isApiAuthorized, Api.getWatchlist);
    apiRoutes.get('/statistics', Web.isApiAuthorized, Api.getConfig);
    apiRoutes.get('/open-prices', Web.isApiAuthorized, Api.getOpenPrices);
    apiRoutes.get('/holidays', Web.isApiAuthorized, Api.getHolidays);
    apiRoutes.get('/config', Web.isApiAuthorized, Api.getFullConfig);
    apiRoutes.get('/orders', Web.isApiAuthorized, Api.getOrders);
    apiRoutes.get('/log', Web.isApiAuthorized, Api.getLog);


    /**
     * Add middleware serving app static content for authorízed users
     */
    app.use('/api', apiRoutes);
    app.use('/', authRoutes);
}