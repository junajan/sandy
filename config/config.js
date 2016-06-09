var _ = require('lodash');

var modules = __dirname+"/../modules/";

var _config = {
    scheduleHour: 5,
    dateOffset: 30,
    api: "/api",
    root: __dirname+"/../",
    dirCore: modules+"Core/",
    dirModule: modules,
    dirStrategy: modules+"Strategy/",
    dirWeb: modules+"Web/",
    dirLoader: modules+"Loader/",
    dirConnector: modules+"Connector/",
};

module.exports = _.merge(_config, require("./env"));


