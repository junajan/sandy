
var Auth = function(app) {
    var self = this;

    app.use(function(req, res, next) {
        req.isAuthenticated = function() {
            return true;
            // return (req.session && !!req.session.user);
        };
        req.logout = function() {
            if(req.session)
                req.session.user = false;
        };
        next();
    });

    self.authenticate = function(email, password, done) {
        var auth = app.get('conf').auth;
        if(email === auth.username && password === auth.password) {
            return done(1);
        }
        done(false);
    };
    
    this.onlyAuthenticated = function(req, res, next) {
        if(!req.isAuthenticated() && req.xhr)
            return res.send(401, '');

        if (!req.isAuthenticated())
            return res.redirect("/");
        next();
    };

    this.onlyUnauthenticated = function(req, res, next) {
        if(req.isAuthenticated() && req.xhr)
            return res.send('authenticated');

        if (req.isAuthenticated())
            return res.redirect("/app/");
        next();
    };

    return this;
}

module.exports = function(app) {
    return new Auth(app);
}