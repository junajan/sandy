var express = require('express');
var session = require('express-session');
var FileStore = require('session-file-store')(session);

module.exports = function(app) {

    var Web = require('./modules/Web')(app);
    var Auth = require('./modules/Auth')(app);
    var Api = require('./modules/Api')(app);

    var authRoutes = express.Router();
    var unauthRoutes = express.Router();
    var apiRoutes = express.Router();
    
    app.use(express.static(__dirname + '/web/unauth'));
    
    unauthRoutes.get('*', Web.getApp);
    
    apiRoutes.get('/equity', Api.getEquity);
    apiRoutes.get('/watchlist', Api.getWatchlist);
    apiRoutes.get('/trades', Api.getTrades);
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

    // app.use('/app/', this.addPrivateStaticMiddleware);

    // authRoutes.get('/api/ticker', Auth.onlyAuthenticated, Api.getTickers);
    // authRoutes.post('/api/ticker', Auth.onlyAuthenticated, Api.postTicker);
    // authRoutes.put('/api/ticker/:ticker', Auth.onlyAuthenticated, Api.putTicker);
    // authRoutes.put('/api/ticker/:ticker/state-toggle', Auth.onlyAuthenticated, Api.toggleTicker);

    // authRoutes.get('/api/config', Auth.onlyAuthenticated, Api.ticker);
    // authRoutes.post('/api/config', Auth.onlyAuthenticated, Api.ticker);
    // authRoutes.get('/api/config/:var', Auth.onlyAuthenticated, Api.ticker);
    // authRoutes.put('/api/config/:var', Auth.onlyAuthenticated, Api.ticker);
        
    // authRoutes.get('/api/actual-state', Auth.onlyAuthenticated, Api.ticker);
    // authRoutes.get('/api/history', Auth.onlyAuthenticated, Api.ticker);
    // authRoutes.get('/api/notification', Auth.onlyAuthenticated, Api.ticker);

    // authRoutes.get('/api/openings', Auth.onlyAuthenticated, Api.ticker);
    // authRoutes.put('/api/openings/:id', Auth.onlyAuthenticated, Api.ticker);
    // authRoutes.post('/api/openings', Auth.onlyAuthenticated, Api.ticker);
    // authRoutes.get('/api/indicator', Auth.onlyAuthenticated, Api.ticker);

    /**
     * Send app when on URL /app/*
     *  - angular will handle routing by its own
     */
    authRoutes.get('*', Auth.onlyAuthenticated, Web.getApp);

    // unauthRoutes.get('/', Web.getLogin);
    // unauthRoutes.get('/logout', Web.doLogout);

    // === all on landing page using modal windows
    // unauthRoutes.get('/login', Auth.onlyUnauthenticated, Web.getLogin);
    // unauthRoutes.get('*', Web.getError404);

    // unauthRoutes.post('/login', Web.doLogin);
    
    app.use('/api', apiRoutes);
    // app.use('/app', authRoutes);
    app.use('/', unauthRoutes);
}