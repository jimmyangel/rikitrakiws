var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var mongoClient = mongo.MongoClient;
var MONGO_URL = process.env.MONGO_URL ? process.env.MONGO_URL : 'mongodb://127.0.0.1/rikitraki';

console.log(process.env.MONGO_URL);

mongoClient.connect(MONGO_URL, function(err, db) {
	if(err) throw err;

	router.use(function (req, res, next) {
		console.log('logging with use...');
		next();
	});

	// List of api resources below
	require('./tracks')(router, db);
	// require('./users')(router, db); // We will deal with users later
});

module.exports = router;