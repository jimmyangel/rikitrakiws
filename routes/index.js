var log4js = require('log4js');
var logger = log4js.getLogger();

var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var mongoClient = mongo.MongoClient;
var MONGO_URL = process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://127.0.0.1/rikitraki';

mongoClient.connect(MONGO_URL, function(err, db) {
	// if(err) throw err;
	if (err) {
		logger.error('cannot connect to database');
	}

	router.use(function (req, res, next) {
		// Set up CORS headers
		res.header("Access-Control-Allow-Origin", "*");
  		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		if (err) {
			logger.error('500 - cannot connect to database');
			res.status(500).send({error: 'DBError', description: 'cannot connect to database'});
		} else {
			next();
		}
	});

	// List of api resources below
	require('./tracks')(router, db);
	// require('./users')(router, db); // We will deal with users later
});

module.exports = router;