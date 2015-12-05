'use strict';

// API router for track resources
var MAX_TRACKS = 500;
var MAX_MOTD = 5;
var passport = require('passport');

var log4js = require('log4js');
var logger = log4js.getLogger();

var mongo = require('mongodb');

var shortid = require('shortid');
var schemas = require('../schemas/schemas').schemas;
var validator = require('is-my-json-valid');
var utils = require('../utils/utils');

module.exports = function (router, db) {

	var isValidToken = passport.authenticate('jwt', { session : false });

	function buildTracksQuery (queryparms) {
		var query = {};

		// TODO: include latlng query inside of filter
		if (queryparms.latlng) {
			var latlng = queryparms.latlng.split(',');
			var lnglat = [];
			var distance = 0;
			if (latlng.length === 2) {
				lnglat[1] = parseFloat(latlng[0]);
				lnglat[0] = parseFloat(latlng[1]);
				if ((lnglat[0] < 180) && (lnglat[0] > -180) && (lnglat[1] < 90) && (lnglat[1] > -90)) {
					if (queryparms.distance) {
						distance = parseInt(queryparms.distance);
						distance = distance ? distance : 0;
					}
					query = {trackGeoJson: {$near: {$geometry: {type: 'Point', coordinates: lnglat}, '$maxDistance': distance}}};
					logger.info('query', query);	
				} 
			}
		}

		if (queryparms.filter) {
			var filter = JSON.parse(queryparms.filter);
			if (filter.username) {
				query.username = {$regex : new RegExp('^' + filter.username)}; // Begins with
			}
			if (filter.trackFav) {
				query.trackFav = true;
			}
			var i = 0;
			if (filter.level) {
				var levels = filter.level.split(',');
				query.$and = [{$or: [] }];
				for (i=0; i<levels.length; i++) {
					query.$and[0].$or.push({trackLevel: levels[i]});
				}
			}
			if (filter.activity) {
				var activities = filter.activity.split(',');
				var j = 0;
				if (!query.$and) {
					query.$and = [{$or: [] }];
				} else {
					j = 1;
					query.$and.push({$or: [] });
				}
				for (i=0; i<activities.length; i++) {
					if (activities[i] === 'Hiking') {
						query.$and[j].$or.push({trackType: { $exists: false }});
					}
					query.$and[j].$or.push({trackType: activities[i]});
				}
			}
			if (filter.country) {
				query.trackRegionTags = {$in: [filter.country]};
			}
			if (filter.region) {
				query.trackRegionTags = {$in: [filter.region]};
			}
		} 
		logger.info('query', query);
		return query;
	}

	// Get all tracks
	router.get('/v1/tracks', function(req, res) {
		logger.info('get tracks...');
		db.collection('tracks', function (err, collection) {

			var p;
			if (req.query.proj === 'small') {
				p = {_id: false,
						trackId: true,
						trackLatLng: true,
						trackRegionTags: true, 
					 	trackLevel: true,
					 	trackType: true,
					 	trackFav: true,
					 	trackName: true,
					 	username: true,
					 	isDraft: true};
			} else {
				p = {_id: false,
						trackId: true,
						trackLatLng: true,
						trackRegionTags: true, 
					 	trackLevel: true,
					 	trackType: true,
					 	trackFav: true,
					 	trackGPX: true, 
					 	trackName: true, 
					 	trackDescription: true,
					 	hasPhotos: true,
					 	username: true,
					 	isDraft: true};			
			}

			var query = buildTracksQuery(req.query);

			collection.find(query, {limit: MAX_TRACKS, sort: {createdDate: -1}, fields: p}, function(err, stream) {
				var result = {};
				result.tracks = {};
				stream.on('data', function(data) {
					result.tracks[data.trackId] = data;
				});
				stream.on('end', function () {
					if (Object.keys(result.tracks).length === 0) {
						// res.status(404).send({error: 'NotFound', description: 'query returned no data'});
						// res.status(204).send();
						res.status(204).send({tracks: {}});
					} else {
						res.send(result);
					}
				});
			});
		}); 
	});

	router.get('/v1/tracks/number', function(req, res) {
		logger.info('get number of tracks...');
		db.collection('tracks', function (err, collection) {
			var query = buildTracksQuery(req.query);
			collection.find(query).count(function(err, count) {
				logger.info('number of tracks is...', count);
				if (err) {
					logger.error('database error', err.message);
					res.status(507).send({error: 'DatabaseQueryError', description: err.message});
				} else {
					res.send({numberOfTracks: count});
				}
			});
		});
	});

	// Create a new track (must have valid token to succeed)
	router.post('/v1/tracks', isValidToken, function (req, res) {

		//TODO: Sanitize text fields
		logger.info('add track for user ', req.user);

		var v = validator(schemas.trackSchema);

		if (v(req.body)) {
			req.body.trackId = shortid.generate();
			req.body.username = req.user;
			req.body.isDraft = true;
			// Format trailhead location as GEOJson to enable geospatial queries (reverse lat/lon to lon/lat)
			req.body.trackGeoJson = {type: 'Point', coordinates: [req.body.trackLatLng[1], req.body.trackLatLng[0]]};
			// logger.info('track photos data ', req.body.trackPhotos);
			// If we have pictures, go ahead and generate binary field from dataurl for every thumbnail
			var i = 0;
			if (req.body.trackPhotos) {
				for (i=0; i<req.body.trackPhotos.length; i++) {
					var buffer = new Buffer(req.body.trackPhotos[i].picThumbDataUrl.split(',')[1], 'base64');
					var bField = new mongo.Binary(buffer);
					req.body.trackPhotos[i].picThumbBlob = bField;
					delete req.body.trackPhotos[i].picThumbDataUrl;
				}
			}

			// Sanitize text fields
			req.body.trackName = utils.sanitize(req.body.trackName, true);
			req.body.trackDescription = utils.sanitize(req.body.trackDescription);
			for (i=0; i<req.body.trackRegionTags.length; i++) {
				req.body.trackRegionTags[i] = utils.sanitize(req.body.trackRegionTags[i], true);
			}

			req.body.createdDate = new Date();

			db.collection('tracks').insert(req.body, {w: 1}, function(err) {
				if (err) {
					logger.error('database error', err.message);
					res.status(507).send({error: 'DatabaseInsertError', description: err.message});			
				} else {
					res.status(201).send({trackId: req.body.trackId});
				}
			}); 

		} else {
			logger.error('validator ', v.errors);
			res.status(400).send({error: 'InvalidInput','description': v.errors});			
		}
	});

	// Add a new track picture (must have valid token to succeed)
	router.post('/v1/tracks/:trackId/picture/:picIndex', isValidToken, function (req, res) {
		logger.info('add picture for track ', req.params.trackId, ' index ', req.params.picIndex, ' size ', req.body.length);
		// TODO: Validate that we indeed received a jpeg file by using file-type
		var picDoc = {};
		picDoc.trackId = req.params.trackId;
		picDoc.picIndex = parseInt(req.params.picIndex);
		picDoc.picBlob = new mongo.Binary(req.body);
		picDoc.createdDate = new Date();

		db.collection('pictures').insert(picDoc, {w: 1}, function(err) {
			if (err) {
				logger.error('database error', err.message);
				res.status(507).send({error: 'DatabaseInsertError', description: err.message});			
			} else {
				res.status(201).send({trackId: req.params.trackId, picIndex: req.params.picIndex});
			}
		});
	});

	// Update track info (must have valid token to succeed)
	router.put('/v1/tracks/:trackId', isValidToken, function(req, res) {
		//TODO: Sanitize text fields

		logger.info('update track info for: ' + req.params.trackId);
		var trackId = req.params.trackId;


		var v = validator(schemas.trackEditSchema);

		if (v(req.body)) {
			// If we have pictures, go ahead and generate binary field from dataurl for every thumbnail
			var i = 0;
			if (req.body.trackPhotos) {
				for (i=0; i<req.body.trackPhotos.length; i++) {
					var buffer = new Buffer(req.body.trackPhotos[i].picThumbDataUrl.split(',')[1], 'base64');
					var bField = new mongo.Binary(buffer);
					req.body.trackPhotos[i].picThumbBlob = bField;
					delete req.body.trackPhotos[i].picThumbDataUrl;
				}
			}
			// Sanitize text fields
			if (req.body.trackName) {
				req.body.trackName = utils.sanitize(req.body.trackName, true);
			}
			if (req.body.trackDescription) {
				req.body.trackDescription = utils.sanitize(req.body.trackDescription);
			}
			if (req.body.trackRegionTags) {
				for (var i=0; i<req.body.trackRegionTags.length; i++) {
					req.body.trackRegionTags[i] = utils.sanitize(req.body.trackRegionTags[i], true);
				}
			}
			req.body.lastUpdatedDate = new Date();
			db.collection('tracks', function (err, collection) {
				collection.findOne({$and: [{'trackId' : trackId}, {'username' : req.user}]}, {_id: false, trackId: true}, function (err, item) {
					if (item) {
						collection.updateOne({'trackId' : trackId}, {$set: req.body}, {w: 1}, function (err) {
							if (err) {
								logger.error('database error', err.code);
								res.status(507).send({error: 'DatabaseUpdateError', description: err.message});		
							} else {
								res.status(200).send(item);
							}
						});
					} else { 
						logger.warn('not found');
						res.status(403).send({error: 'Forbidden', description: 'track does not belong to requesting user'});
					}
				});
			});
		} else {
			logger.error('validator ', v.errors);
			res.status(400).send({error: 'InvalidInput','description': v.errors});			
		}
	}); 

	// Delete track (must have valid token to succeed)
	router.delete('/v1/tracks/:trackId', isValidToken, function(req, res) {

		logger.info('delete track: ' + req.params.trackId);
		var trackId = req.params.trackId;

		db.collection('tracks', function (err, tracksCollection) {
			tracksCollection.findOne({$and: [{'trackId' : trackId}, {'username' : req.user}]}, {_id: false, trackId: true}, function (err, item) {
				if (item) {
					db.collection('pictures', function (err, picturesCollection) {
						picturesCollection.remove({'trackId' : trackId}, {w: 1}, function (err) {
							if (err) {
								logger.error('database error', err.code);
								res.status(507).send({error: 'DatabasePicRemoveError', description: err.message});		
							} else {
								logger.info('deleted pictures for track: ' + trackId);
								tracksCollection.remove({'trackId' : trackId}, {w: 1}, function (err) {
									if (err) {
										logger.error('database error', err.code);
										res.status(507).send({error: 'DatabaseDocRemoveError', description: err.message});
									} else {
										res.status(204).send();
									}
								});
							}
						});
					});	
				} else { 
					logger.warn('not found');
					res.status(403).send({error: 'Forbidden', description: 'track does not belong to requesting user'});
				}
			});
		});
	}); 

	// Get a single track
	router.get('/v1/tracks/:trackId', function(req, res) {
		logger.info('get track info for: ' + req.params.trackId);
		var trackId = req.params.trackId;
		db.collection('tracks', function (err, collection) {
			collection.findOne({'trackId' : trackId}, {_id: false, trackGPXBlob: false, trackPhotos: false}, function (err, item) {
				if (item) {
					res.send(item);
				} else { 
					logger.warn('not found');
					res.status(404).send({error: 'NotFound', description: 'track id not found'});
				}
			});
		});
	}); 

	// Get motd (MAX_MOTD most recently created tracks)	
	router.get('/v1/motd', function(req, res) {
		logger.info('get motd');
		db.collection('tracks', function (err, collection) {
			collection.find({'hasPhotos' : true}, {limit: MAX_MOTD, sort: {createdDate: -1}, fields: {_id: false, trackId: true, trackName: true}}).toArray(function(err, items) {
				if (items) {
					var motd = [];
					for (var i=0; i<items.length; i++) {
						var tuple = [items[i].trackId, 0, items[i].trackName]; // TrackId, thumbnail index, trackName
						motd.push(tuple);
					}
					var result = {motd: {motdTracks: {}}};
					result.motd.motdTracks = motd;
					res.send(result);
				} else { 
					logger.warn('motd not found');
					res.status(404).send({error: 'NotFound', description: 'motd not found'});
				}
			});
		});
	}); 

	// Get the geotags structure for a single track
	// This getter is here for compatibility with static version of rikitraki
	router.get('/v1/tracks/:trackId/geotags', function(req, res) {
		logger.info('get geotags for: ' + req.params.trackId);
		var trackId = req.params.trackId;
		db.collection('tracks', function (err, collection) {
			collection.findOne({'trackId' : trackId}, function (err, item) {
				if (item) {
					// Build the response json
					var result = {};
					result.geoTags = {};
					result.geoTags.trackId = item.trackId;
					result.geoTags.trackPhotos =  item.trackPhotos;
					res.send(result);
				} else { 
					logger.warn('not found');
					res.status(404).send({error: 'NotFound', description: 'track id not found'});
				}
			});
		});
	}); 

	// Get GPX for a track
	router.get('/v1/tracks/:trackId/GPX', function(req, res) {
		logger.info('get GPX for: ' + req.params.trackId);
		var trackId = req.params.trackId;
		db.collection('tracks', function (err, collection) {
			collection.findOne({'trackId' : trackId}, function (err, item) {
				if (item) {
					// Build the response 
					res.setHeader('Content-Type', 'application/gpx+xml');
					res.send(item.trackGPXBlob);
				} else { 
					logger.warn('not found');
					res.status(404).send({error: 'NotFound', description: 'track id not found'});
				}
			});
		});
	}); 

	// Get thumbnail for a track
	router.get('/v1/tracks/:trackId/thumbnail/:picIndex', function(req, res) {
		logger.info('get thumbnail for: ' + req.params.trackId);
		var trackId = req.params.trackId;
		var picIndex = parseInt(req.params.picIndex);
		if (isNaN(picIndex)) {
			logger.warn('invalid thumb index');
			res.status(404).send({error: 'NotFound', description: 'invalid thumbnail index'});
		} else {
			db.collection('tracks', function (err, collection) {
				collection.findOne({'trackId' : trackId}, function (err, item) {
					if (item) {
						if ((picIndex >= item.trackPhotos.length) || (picIndex < 0)) {
							logger.warn('thumb not found');
							res.status(404).send({error: 'NotFound', description: 'thumbnail not found'});
						} else {
							// Build the response 
							res.setHeader('Content-Type', 'image/jpeg');
							res.send(item.trackPhotos[picIndex].picThumbBlob.buffer);
						}
					} else { 
						logger.warn('not found');
						res.status(404).send({error: 'NotFound', description: 'track id not found'});
					}
				});
			});
		}
	}); 

	// Get picture for a track
	router.get('/v1/tracks/:trackId/picture/:picIndex', function(req, res) {
		logger.info('get picture for: ' + req.params.trackId);
		var trackId = req.params.trackId;
		var picIndex = parseInt(req.params.picIndex);
		if (isNaN(picIndex)) {
			logger.warn('invalid picture index');
			res.status(404).send({error: 'NotFound', description: 'invalid picture index'});
		} else {
			db.collection('pictures', function (err, collection) {
				collection.findOne({'trackId' : trackId, 'picIndex' : picIndex}, function (err, item) {
					if (item) {
						// Build the response 
						res.setHeader('Content-Type', 'image/jpeg');
						res.send(item.picBlob.buffer);
					} else { 
						logger.warn('not found');
						res.status(404).send({error: 'NotFound', description: 'picture not found'});
					}
				});
			});
		}
	});

	// Delete single picture for a track (must have valid token to succeed)
	router.delete('/v1/tracks/:trackId/picture/:picIndex', isValidToken, function(req, res) {
		logger.info('delete track picture: ' + req.params.trackId + ' ' + req.params.picIndex);
		var trackId = req.params.trackId;
		var picIndex = parseInt(req.params.picIndex);
		if (isNaN(picIndex)) {
			logger.warn('invalid picture index');
			res.status(404).send({error: 'NotFound', description: 'invalid picture index'});
		} else {
			db.collection('tracks', function (err, tracksCollection) {
				tracksCollection.findOne({$and: [{'trackId' : trackId}, {'username' : req.user}]}, {_id: false, trackId: true}, function (err, item) {
					if (item) {
						db.collection('pictures', function (err, picturesCollection) {
							picturesCollection.remove({'trackId' : trackId, 'picIndex' : picIndex}, {w: 1}, function (err) {
								if (err) {
									logger.error('database error', err.code);
									res.status(507).send({error: 'DatabasePicRemoveError', description: err.message});		
								} else {
									logger.info('deleted picture ' + picIndex +' for track: ' + trackId);
									res.status(204).send();
								}
							});
						});	
					} else { 
						logger.warn('not found');
						res.status(403).send({error: 'Forbidden', description: 'track does not belong to requesting user'});
					}
				});
			});
		}
	}); 
};
