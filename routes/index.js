'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger();

var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var mongoClient = mongo.MongoClient;
var MONGO_URL = process.env.OPENSHIFT_MONGODB_DB_URL ? (process.env.OPENSHIFT_MONGODB_DB_URL + 'prod') : 'mongodb://127.0.0.1/rikitraki';
var JWT_SECRET = process.env.JWT_SECRET || 'eventually instead of this we will use a public key';

var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var JwtStrategy = require('passport-jwt').Strategy;

var bcrypt = require('bcryptjs');

mongoClient.connect(MONGO_URL, function(err, db) {
	logger.info('connecting to database:', MONGO_URL);

	if (err) {
		logger.error('cannot connect to database');
	}

	router.use(function (req, res, next) {
		// Set up CORS headers
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Credentials: true');
		res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  		res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

		if (err) {
			logger.error('500 - cannot connect to database');
			res.status(500).send({error: 'DBError', description: 'cannot connect to database'});
		} else {
			next();
		}
	});

	// Setup basic authentication middleware
	passport.use(new BasicStrategy(
		function(username, password, callback) {
			db.collection('users', function (err, collection) {
				collection.findOne({'username' : username}, function (err, user) {
					if (user) {
						if (bcrypt.compareSync(password, user.password)) {
						//if (user.password === password) {
							return callback(null, username);
						} else {
							return callback(null, false);
						}
					} else { 
						return callback(null, false);
					}
				});
			});
		}
	));

	// Setup JWT token authentication middleware
	var opts = {};
	opts.secretOrKey = JWT_SECRET;
	passport.use(new JwtStrategy(opts, 
		function(jwtPayload, callback) {
			callback(null, jwtPayload.sub, jwtPayload);
		}
	));

	// List of api resources below
	require('./users')(router, db); 
	require('./tracks')(router, db);

});

module.exports.router = router;
module.exports.JWT_SECRET = JWT_SECRET;
