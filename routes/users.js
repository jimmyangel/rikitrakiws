// API router for user resources
var passport = require('passport');
var jwt = require('jsonwebtoken');
var JWT_SECRET = require('./index').JWT_SECRET;
var JWT_ISSUER = 'rikitraki.com';

var log4js = require('log4js');
var logger = log4js.getLogger();

var schemas = require('../schemas/schemas').schemas;
var validator = require('is-my-json-valid');

var bcrypt = require('bcryptjs');

module.exports = function (router, db) {

	var isAuthenticated = passport.authenticate('basic', { session : false });
	var isValidToken = passport.authenticate('jwt', { session : false });

	// Authenticate and get a token for subsequent protected API access
	router.get('/v1/token', isAuthenticated, function(req, res) {
		logger.info('get token for user ', req.user);

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

	// Get user info per user in valid token
	router.get('/v1/users/me', isValidToken, function(req, res) {
		var username = req.user;
		console.log('get user profile for: ' + username);
		db.collection('users', function (err, collection) {
			collection.findOne({'username' : username}, {_id: false, password: false, invitationCode: false}, function (err, item) {
				if (item) {
					res.send(item);
				} else { 
					console.log('not found');
					res.status(404).json({error: 'NotFound', description: 'username not found'});
				}
			});
		});
	}); 

	// Update user profile per user valid token
	// TODO: if changing password, need to check that the old password matches
	router.put('/v1/users/me', isValidToken, function(req, res) {
		var username = req.user;
		console.log('update user profile for: ' + username);
		var v = validator(schemas.userProfileUpdateSchema);
		if (v(req.body)) {
			var updData = {};
			var isEmpty = true;
			if (req.body.email) {
				isEmpty = false;
				updData.email = req.body.email;
			}
			if (req.body.password) {
				isEmpty = false;
				updData.password = bcrypt.hashSync(req.body.password, 8);
			}
			if (isEmpty) {
				res.status(400).send({error: 'InvalidInput', description: 'No data'});			
			} else {
				db.collection('users', function (err, collection) {
					collection.updateOne({'username' : username}, {$set: updData}, {w: 1}, function (err, item) {
						if (err) {
							if (err.code === 11000) {
								res.status(422).send({error: 'Duplicate', description: 'Email already exists'});			
							} else {
								logger.error('database error', err.code);
								res.status(507).send({error: 'DatabaseInsertError', description: err.message});		
							}	
						} else {
							res.status(204).send();
						}
					});
				});
			}
		} else {
			logger.error('validator ', v.errors);
			res.status(400).send({error: 'InvalidInput', description: v.errors});			
		}
	});
}