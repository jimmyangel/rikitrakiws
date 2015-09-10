// API router for user resources
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var jwt = require('jsonwebtoken');
var JWT_SECRET = require('./index').JWT_SECRET;
var JWT_ISSUER = 'rikitraki.com';

var log4js = require('log4js');
var logger = log4js.getLogger();

var schemas = require('../schemas/schemas').schemas;
var validator = require('is-my-json-valid');

var bcrypt = require('bcryptjs');

module.exports = function (router, db) {
	// var api = router.route('/api/users');

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

	var isAuthenticated = passport.authenticate('basic', { session : false });

	// Authenticate and get a token for subsequent protected API access
	router.get('/v1/token', isAuthenticated, function(req, res) {
		logger.info('get token...');
		var token = jwt.sign({iss: JWT_ISSUER, sub:  req.user}, JWT_SECRET);
		res.send(token);
	});

	// Create a user via invitation
	router.post('/v1/users', function(req, res) {
		logger.info('add user', req.body);
		var v = validator(schemas.userRegistrationSchema);
		if (v(req.body)) {
			db.collection('invitations', function (err, collection) {
				collection.findOne({'invitationCode' : req.body.invitationCode}, function (err, item) {
					if ((!item) || (item.email != req.body.email)) {
						res.status(404).send({error: 'MissingInvitation', description: 'Only invited users can register'});
					} else {
						req.body.password = bcrypt.hashSync(req.body.password, 8);
						db.collection('users').insert(req.body, {w: 1}, function(err) {
							if (err) {
								if (err.code === 11000) {
									res.status(422).send({error: 'Duplicate', description: 'Username or email already exists'});			
								} else {
									logger.error('database error', err.code);
									res.status(507).send({error: 'DatabaseInsertError', description: err.message});		
								}	
							} else {
								var token = jwt.sign({iss: JWT_ISSUER, sub: req.body.username}, JWT_SECRET);
								res.status(201).send(token);
								// res.status(201).send({username: req.body.username});
							}
						}); 
					}
				});
			});

		} else {
			logger.error('validator ', v.errors);
			res.status(400).send({error: 'InvalidInput','description': v.errors});			
		}
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