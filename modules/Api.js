var Api = function(app) {
	var self = this;

	this.getTickers = function(req, res) {
		res.send("ABCD");
	}

	this.getTicker = function(req, res) {
		res.send("ABCD");
	};
	
	this.postTicker = function(req, res) {
		res.send("ABCD");
	};
	
	this.toggleTicker = function(req, res) {
		res.send("ABCD");
	};
	
	this.putTicker = function(req, res) {
		res.send("ABCD");
	};

	return this;
};

module.exports = function(app) {
    return new Api(app)
}