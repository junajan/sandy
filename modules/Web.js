var Web = function(app) {
    var self = this;

    this.getApp = function(req, res, next) {
        res.render('app');
    };
    
    this.getError404 = function(req, res) {
        return res.redirect('/');
    };

    return this;
};

module.exports = function(app) {
    return new Web(app);
};