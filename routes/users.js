'use strict';

// API router for user resources
var passport = require('passport');
var jwt = require('jsonwebtoken');
var JWT_SECRET = require('./index').JWT_SECRET;
var JWT_ISSUER = 'rikitraki.com';

var mailgunApiKey = process.env.MAILGUN_API_KEY;
var mailgunDomain = 'rikitraki.com';
var mailgunFrom = 'RikiTraki<noreply@rikitraki.com>';
var mailgun = require('mailgun-js')({apiKey: mailgunApiKey, domain: mailgunDomain});
var mailcomposer = require('mailcomposer');

var log4js = require('log4js');
var logger = log4js.getLogger();

var schemas = require('../schemas/schemas').schemas;
var validator = require('is-my-json-valid');
var shortid = require('shortid');

var bcrypt = require('bcryptjs');

var path    = require("path");


module.exports = function (router, db) {

	//var isAuthenticated = passport.authenticate('basic', { session : false });

	var isValidToken = passport.authenticate('jwt', { session : false });

	router.get('/v1/token', function(req, res, next) {
		passport.authenticate('basic', { session : false }, function (err, user) {
			if(err) {
				logger.error('authentication error', err);
				return;
			}
			if(!user){
			    res.set('WWW-Authenticate', 'AJAXFormBased');
			    res.send(401);
			    return;
			} else {
				if(user.isInactive) {
					res.status(403).json({error: 'Inactive', description: 'account not activated'});
					return;
				}
			}
			logger.info('get token for user', user.username);
			var token = jwt.sign({iss: JWT_ISSUER, sub:  user.username}, JWT_SECRET);
			res.send(token);
		})(req, res, next);
	});

	// Get reset token for a given email (reset password)
	router.get('/v1/resettoken', function(req, res) {
		logger.info('get reset token for: ', req.query.email);
		db.collection('users', function (err, collection) {
			collection.findOne({'email' : req.query.email}, {_id: false, username: true}, function (err, item) {
				if (item) {
					logger.info('user found for email', item.username);
					var token = jwt.sign({iss: JWT_ISSUER, sub:  item.username, exp: (Math.floor(Date.now() / 1000) + 86400), aud: 'passwordreset'}, JWT_SECRET);
					var mail = mailcomposer({
					  from: mailgunFrom,
					  to: req.query.email,
					  subject: 'RikiTraki password reset',
					  text: 'This message is being sent at your request to reset your RikiTraki password.',
					  html: 'Follow <a href="' +
					  		req.query.rturl +
					  		'resetp.html?' + 'username=' +
					  		item.username +
					  		'&token=' +
					  		token +
					  		'">this</a> link to reset your RikiTraki password<br><br>Thank you'
					});
					mail.build(function (mberror, message) {
						var mailgunData = {
							to: req.query.email,
							message: message.toString('ascii')
						};
						mailgun.messages().sendMime(mailgunData, function (error, body) {
							if (error) {
								logger.error('mailgun error', error);
							} else {
								logger.info('reset password email sent', body);
							}
						});
					});
					res.send({message: 'email sent'});
				} else {
					logger.error('email not found');
					res.status(404).json({error: 'NotFound', description: 'user not found'});
				}
			});
		});
	});

	// Create a user
	router.post('/v1/users', function(req, res) {
		logger.info('add user', req.body);
		var v = validator(schemas.userRegistrationSchema);
		if (v(req.body)) {

			req.body.password = bcrypt.hashSync(req.body.password, 8);
			req.body.createdDate = new Date();
			req.body.isInactive = true;
			var rturl = req.body.rturl;
			delete req.body.rturl; // We don't want this to go to the database

			db.collection('users').insert(req.body, {w: 1}, function(err) {
				if (err) {
					if (err.code === 11000) {
						res.status(422).send({error: 'Duplicate', description: 'Username or email already exists'});
					} else {
						logger.error('database error', err.code);
						res.status(507).send({error: 'DatabaseInsertError', description: err.message});
					}
				} else {
					// var token = jwt.sign({iss: JWT_ISSUER, sub: req.body.username}, JWT_SECRET);
					// res.status(201).send(token);
					var token = jwt.sign({iss: JWT_ISSUER, sub:  req.body.username}, JWT_SECRET);

					var mail = mailcomposer({
					  from: mailgunFrom,
					  to: req.body.email,
					  subject: 'RikiTraki account activation',
					  text: 'This message is being sent at your request to register in RikiTraki.',
					  html: 'Follow <a href="' +
					  		rturl +
					  		'activate.html?' + 'username=' +
					  		req.body.username +
					  		'&token=' +
					  		token +
					  		'">this</a> link to activate your RikiTraki account<br><br>Thank you'
					});
					mail.build(function (mberror, message) {
						var mailgunData = {
							to: req.body.email,
							message: message.toString('ascii')
						};
						mailgun.messages().sendMime(mailgunData, function (error, body) {
							if (error) {
								logger.error('mailgun error', error);
							} else {
								logger.info('account activation email sent', body);
							}
						});
					});

					res.status(201).send({username: req.body.username});
				}
			});

		} else {
			logger.error('validator ', v.errors);
			res.status(400).send({error: 'InvalidInput','description': v.errors});
		}
	});

	// Get user info per user in valid token
	router.get('/v1/users/me', isValidToken, function(req, res) {
		var username = req.user;
		logger.info('get user profile for: ', username);
		db.collection('users', function (err, collection) {
			collection.findOne({'username' : username}, {_id: false, password: false, invitationCode: false}, function (err, item) {
				if (item) {
					res.send(item);
				} else {
					logger.error('user not found');
					res.status(404).json({error: 'NotFound', description: 'username not found'});
				}
			});
		});
	});

	// Update user profile per user credentials
	router.put('/v1/users/me', function(req, res, next) {
		passport.authenticate('basic', { session : false }, function (err, user) {
			logger.info('authenticating user:', user);
			if(err) {
				logger.error('authentication error', err);
				return;
			}
			if(!user){
			    res.set('WWW-Authenticate', 'AJAXFormBased');
			    res.send(401);
			    return;
			}
			var username = user;
			logger.info('update user profile for: ', username);
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
						updData.lastUpdatedDate = new Date();
						collection.updateOne({'username' : username}, {$set: updData}, {w: 1}, function (err) {
							if (err) {
								if (err.code === 11000) {
									res.status(422).send({error: 'Duplicate', description: 'Email already exists'});
								} else {
									logger.error('database error', err.code);
									res.status(507).send({error: 'DatabaseUpdateError', description: err.message});
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

		})(req, res, next);
	});

	// Reset user password per user valid reset token
	router.put('/v1/users/:username', isValidToken, function(req, res) {
		logger.info('reset password for ', req.user);
		var v = validator(schemas.userProfileUpdateSchema);
		if (v(req.body)) {
			req.body.password = bcrypt.hashSync(req.body.password, 8);
			req.body.lastUpdatedDate = new Date();
			db.collection('users', function (err, collection) {
				// Unset inactive to enable another way of activating an account
				collection.updateOne({'username' : req.user}, {$set: req.body, $unset: {'isInactive': ''}}, {w: 1}, function (err) {
					if (err) {
						logger.error('database error', err.code);
						res.status(507).send({error: 'DatabaseUpdateError', description: err.message});
					} else {
						res.status(204).send();
					}
				});
			});
		} else {
			logger.error('validator ', v.errors);
			res.status(400).send({error: 'InvalidInput', description: v.errors});
		}
	});

	// Activate account
	router.put('/v1/users/:username/activation', isValidToken, function(req, res) {
		logger.info('activate account for', req.user);

		var lastUpdatedDate = new Date();
		db.collection('users', function (err, collection) {
			collection.updateOne({'username' : req.user}, {$unset: {'isInactive': ''}, $set: {'lastUpdatedDate': lastUpdatedDate}}, {w: 1}, function (err) {
				if (err) {
					logger.error('database error', err.code);
					res.status(507).send({error: 'DatabaseUpdateError', description: err.message});
				} else {
					res.status(204).send();
				}
			});
		});
	});
};
