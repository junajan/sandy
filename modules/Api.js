var Api = function(app) {
	var self = this;

	this.getWatchlist = function(req, res) {
		res.send("ABCD");
	};

	this.getEquity = function(req, res) {
		res.send("ABCD");
	};

	this.getTrades = function(req, res) {
		res.send("ABCD");
	};

	this.getLog = function(req, res) {
		res.send("ABCD");
	};

	return this;
};

module.exports = function(app) {
    return new Api(app);
};