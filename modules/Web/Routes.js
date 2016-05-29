var express = require('express');

module.exports = function(app) {
    var config = app.config;

    var Web = require('./Web')(app);
    var Api = require('./Api')(app);

    var authRoutes = express.Router();
    var apiRoutes = express.Router();
    
    app.use(express.static(config.root + 'web/auth'));
    
    authRoutes.get('*', Web.getApp);
    
    apiRoutes.get('/equity', Api.getEquity);
    apiRoutes.get('/watchlist', Api.getWatchlist);
    apiRoutes.get('/statistics', Api.getConfig);
    apiRoutes.get('/open-prices', Api.getOpenPrices);
    apiRoutes.get('/orders', Api.getOrders);
    apiRoutes.get('/log', Api.getLog);


    /**
     * This will add static content provider for authenticated users
     * - alias serve SPA app only to authorized users
     */
    // this.addPrivateStaticMiddleware = function(req, res, next) {
    //     if(req.isAuthenticated()){
    //         console.log(__dirname + '/../web/auth');
    //         return express.static(__dirname + '/web/auth/')(req, res, next);
    //     }
    //     next();
    // };

    /**
     * Add middleware serving app static content for authorízed users
     */

    app.use('/api', apiRoutes);
    app.use('/', authRoutes);
}