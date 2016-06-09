var Web = function(app) {
    var self = this;
    var config = app.config;

    app.use(function(req, res, next) {
        req.isAuthorized = function () {
            return !! req.session.authorized;
        };
        req.setAuthorized = function (auth, done) {
            req.session.authorized = auth;
            req.session.save(function(err) {
                if(err) throw err;
                done();
            })
        };

        return next();
    });

    this.getApp = function(req, res) {
        res.render('app');
    };

    this.getLogin = function(req, res) {
        res.render('login', {
            message: ''
        });
    };

    this.doLogout = function(req, res) {
        req.setAuthorized(false, function () {
            res.redirect("/login");
        });
    };

    this.doLogin = function(req, res) {
        var auth = config.auth;
        var credentials = req.body;
        if(credentials.password == auth.password && auth.username == credentials.name) {
            return req.setAuthorized(true, function () {
                res.redirect("/");
            });
        }

        res.render('login', {
            message: 'Wrong credentials..'
        });
    };

    this.isAuthorized = function (req, res, next) {
        if(req.isAuthorized())
            next();
        else
            res.status(401).redirect("/login");
    };

    this.isApiAuthorized = function (req, res, next) {
        if(req.isAuthorized())
            next();
        else
            res.status(401).json({error: "unauthorized"});
    };

    this.isNotAuthorized = function (req, res, next) {
        if(!req.isAuthorized())
            next();
        else
            res.redirect("/");
    };

    this.getError404 = function(req, res) {
        return res.redirect('/');
    };

    return this;
};

module.exports = function(app) {
    return new Web(app);
};