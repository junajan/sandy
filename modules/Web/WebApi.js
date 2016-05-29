var WebApi = function(app) {
    var Auth = require('./Auth')(app);
    var self = this;
    var config = app.get('conf');
    
    this.getApp = function(req, res, next) {
        res.render('app');
    };
    
    this.getLogin = function(req, res, next) {
        if (req.isAuthenticated())
            return res.redirect('/app/');

        res.render("login");
    };

    this.doLogin = function(req, res, next) {
        // when incomplete login request sent
        if (!req.body.username || !req.body.password)
            return res.json({error: 'ERR_WRONG_CREDENTIALS'});
        
        Auth.authenticate(req.body.username, req.body.password, function(authRes) {
            if(!authRes)
                return res.send({error:'ERR_WRONG_CREDENTIALS'});

            req.session.user = authRes;
            return res.send({ok:1});
        });
    };

    this.doLogout = function(req, res) {

        req.logout();
        res.redirect('/');
    };

    this.getError404 = function(req, res) {
        return res.redirect('/');
    };

    return this;
};

module.exports = function(app) {
    return new WebApi(app)
}