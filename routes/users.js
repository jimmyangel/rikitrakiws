// API router for user resources
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var jwt = require('jsonwebtoken');
var JWT_SECRET = require('./index').JWT_SECRET;
var JWT_ISSUER = 'rikitraki.com';

var log4js = require('log4js');
var logger = log4js.getLogger();

module.exports = function (router, db) {
	// var api = router.route('/api/users');

	passport.use(new BasicStrategy(
		function(username, password, callback) {
			db.collection('users', function (err, collection) {
				collection.findOne({'username' : username}, function (err, user) {
					logger.info('looking for user' + user.username + ' ' + user.password);
					if (user) {
						if (user.password === password) {
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

	var isAuthenticated = passport.authenticate('basic', { session : false });

	router.get('/v1/token', isAuthenticated, function(req, res) {
		logger.info('get token...');
		var token = jwt.sign({iss: JWT_ISSUER, sub:  req.user}, JWT_SECRET);
		res.send(token);
	});

// We don't really need an API to get user info
/*
	router.get('/v1/users', function(req, res) {
		console.log('get users...');
		db.collection('users', function (err, collection) {
			collection.find().toArray(function (err, items) {
				res.send(items);
			});
		});
	});

	router.get('/v1/users/:username', function(req, res) {
		console.log('get user profile for: ' + req.params.username);
		var username = req.params.username;
		db.collection('users', function (err, collection) {
			collection.findOne({'username' : username}, function (err, item) {
				if (item) {
					res.send(item);
				} else { 
					console.log('not found');
					res.status(404).json({error: 'NotFound', description: 'username not found'});
				}
			});
		});
	}); 
*/

}