// var mysql = require("mysql");

// //    get ( resReport, "*", "u_prava", "1=1", null, "id", "ASC" );
// //    insert ( resReport,"u_prava", {const:"AAA"+ (new Date().getMilliseconds()), "popis": "popis" });
// //    update ( resReport, "u_prava", {const:"BBBB"}, "id IN (?)", [45,47,48] );
// //    sql ( resReport, "SELECT * FROM u_prava WHERE id IN (?)", [1,2,3] );

// function Mysql() {
//     var self = this;
//     self.client = null;
//     self.config = null;
//     self.showSQL = false;
//     self.showSQLSelect = true;
//     self.showSQLSelect = false;

//     self.init = function(config, done) {
//         self.config = config;

//         log.event("Pripojuji se k databazi", config);
//         mysql.connect(config, function(err, client) {
//             if (err) {
//                 log.error('Error fetching client from pool', err);
//             } else {
//                 log.event('Uspesne pripojeno k DB');

//                 self.client = client;
//             }
//             done(err, self);
//         });
//     };

//     self.print = function(err, res) {

//         console.dir("ERROR: ", err);
//         console.dir("RESULT: ", res);
//     };

//     self.getData = function(callback, what, where, cond, params, orderBy, orderDesc, limit) {

//         sql = "";
//         if (what)
//             sql = "SELECT " + what;

//         if (where)
//             sql += " FROM " + where;

//         if (cond)
//             sql += " WHERE " + cond;

//         if (orderBy)
//             sql += " ORDER BY " + orderBy;

//         if (orderBy && orderDesc)
//             sql += " " + orderDesc;

//         if (limit)
//             sql += " LIMIT " + limit;

//         if (Object.prototype.toString.call(params) !== "[object Array]")
//             params = [params];

//         if (self.showSQL && self.showSQLSelect)
//             console.log("SELECT: " + sql + " | PARAMS: " + JSON.stringify(params));

//         self.client.query(sql, params, function(err, rows) {
//             if (err)
//                 return callback(err, false, callback);
//             callback(err, rows.rows, callback);
//         });
//     };

//     self.get = function(callback, what, where, cond, params, orderBy, orderDesc) {

//         self.getData(
//             function(err, rows) {

//                 if (!err)
//                     rows = rows[0];

//                 callback(err, rows);
//             },
//             what, where, cond, params, orderBy, orderDesc, 1)
//     };

//     self.insert = function(callback, where, params) {

//         var sql = "INSERT INTO " + where;
//         var args = [];
//         var cols = [];
//         var vals = [];
//         var i = 0;
//         for (var j in params) {

//             cols.push(j);
//             args.push("$" + (++i));
//             vals.push(params[j]);
//         }

//         sql += " ( " + cols.join(", ") + " ) VALUES ( " + args.join(",") + " ) ";


//         if (self.showSQL)
//             console.log("INSERT: " + sql + " | PARAMS: " + JSON.stringify(params));

//         self.client.query(sql, vals, function(err, res) {

//             callback(err, res);
//         });
//     };

//     self.query = function(sql, vals, cb) {
//         return self.client.query(sql, vals, cb);
//     };

//     self.update = function(callback, where, values, cond, params) {

//         var sql = "UPDATE " + where + " SET ";
//         var cols = [];
//         var vals = [];
//         var i = 0;

//         for (j in values) {
//             vals.push(j + " = " + "'" + values[j] + "'");
//         }
//         sql += vals.join(",");

//         if (cond)
//             sql += " WHERE " + cond;

//         if (self.showSQL)
//             console.log("UPDATE: " + sql + " | PARAMS: " + JSON.stringify(vals));

//         // if (!(params instanceof Array))
//         //     params = [params];

//         // for (i in params)
//         //     vals.push(params[i]);

//         self.client.query(sql, function(err, res) {
//             callback(err, res);
//         });
//     };

//     self.sql = function(callback, sql, params) {

//         if (self.showSQL && self.showSQLSelect)
//             console.log("SQL: " + sql + " | PARAMS: " + JSON.stringify(params));

//         self.client.query(sql, params, function(err, res) {
//             if (err)
//                 return callback(err, false);
//             callback(err, res.rows);
//         });
//     };

//     self.serializeParams = function(params) {

//         var paramString = '';

//         if (params) {
//             if (!Array.isArray(params))
//                 params = [params];
//             paramString = "'" + params.join("','") + "'";
//         }

//         return paramString;
//     };

//     self.ps = function(done, ps, params) {
//         if (typeof params !== "undefined" && Object.prototype.toString.call(params) !== "[object Array]")
//             params = [params];

//         self.sql(function(err, res) {
//             done(err, res);
//         }, ps, params);
//     };
// };

// module.exports = new Mysql();