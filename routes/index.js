var log4js = require('log4js');
var logger = log4js.getLogger();

var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var mongoClient = mongo.MongoClient;
var MONGO_URL = process.env.OPENSHIFT_MONGODB_DB_URL ? (process.env.OPENSHIFT_MONGODB_DB_URL + 'rikitrakiws') : 'mongodb://127.0.0.1/rikitraki';
var JWT_SECRET = 'eventually instead of this we will use a public key';

mongoClient.connect(MONGO_URL, function(err, db) {
	// if(err) throw err;

	if (err) {
		logger.error('cannot connect to database');
	}

	router.use(function (req, res, next) {
		// Set up CORS headers
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Credentials: true");
  		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
		if (err) {
			logger.error('500 - cannot connect to database');
			res.status(500).send({error: 'DBError', description: 'cannot connect to database'});
		} else {
			next();
		}
	});

	// List of api resources below
	require('./users')(router, db); 
	require('./tracks')(router, db);

});

module.exports.router = router;
module.exports.JWT_SECRET = JWT_SECRET;
