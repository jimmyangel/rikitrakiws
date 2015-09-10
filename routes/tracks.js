// API router for track resources
var passport = require('passport');
var JwtStrategy = require('passport-jwt').Strategy;
var JWT_SECRET = require('./index').JWT_SECRET;

var log4js = require('log4js');
var logger = log4js.getLogger();

var shortid = require('shortid');
var schemas = require('../schemas/schemas').schemas;
var validator = require('is-my-json-valid');

module.exports = function (router, db) {

	var opts = {};
	opts.secretOrKey = JWT_SECRET;
	passport.use(new JwtStrategy(opts, 
		function(jwt_payload, callback) {
			logger.info('jwt subject is ' + jwt_payload.sub);
			callback(null, jwt_payload.sub);
		}
	));
	var isValidToken = passport.authenticate('jwt', { session : false });

	// Get all tracks
	router.get('/v1/tracks', function(req, res) {
		logger.info('get tracks...');
		db.collection('tracks', function (err, collection) {
			logger.info(req.query);
			var p;
			if (req.query.proj === 'small') {
				p = {_id: false,
						trackId: true,
						trackLatLng: true,
						trackRegionTags: true, 
					 	trackLevel: true,
					 	trackType: true,
					 	trackFav: true,
					 	trackName: true}
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
					 	hasPhotos: true}				
			}
			var query = {};
			if (req.query.latlng) {
				var latlng = req.query.latlng.split(',');
				var lnglat = [];
				var distance = 0;
				if (latlng.length === 2) {
					lnglat[1] = parseFloat(latlng[0]);
					lnglat[0] = parseFloat(latlng[1]);
					if ((lnglat[0] < 180) && (lnglat[0] > -180) && (lnglat[1] < 90) && (lnglat[1] > -90)) {
						if (req.query.distance) {
							var distance = parseInt(req.query.distance);
							distance = distance ? distance : 0;
						}
						query = {trackGeoJson: {$near: {$geometry: {type: "Point", coordinates: lnglat}, '$maxDistance': distance}}}
						logger.info('query', query);	
					} 
				}
			}
			collection.find(query, {limit: 1000, fields: p}, function(err, stream) {
				var result = {};
				result.tracks = {};
				stream.on('data', function(data) {
					result.tracks[data.trackId] = data;
				});
				stream.on('end', function () {
					if (Object.keys(result.tracks).length === 0) {
						res.status(404).send({error: 'NotFound', description: 'query returned no data'});
					} else {
						res.send(result);
					}
				});
			});
		}); 
	});

	// Create a new track (must have valid token to succeed)
	router.post('/v1/tracks', isValidToken, function (req, res) {
		logger.info('add track');
		var v = validator(schemas.trackSchema);

		if (v(req.body)) {
			req.body.trackId = shortid.generate();
			// Format trailhead location as GEOJson to enable geospatial queries (reverse lat/lon to lon/lat)
			req.body.trackGeoJson = {type: 'Point', coordinates: [req.body.trackLatLng[1], req.body.trackLatLng[0]]}

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
	})

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

	// Get motd
	router.get('/v1/motd', function(req, res) {
		logger.info('get motd');
		var trackId = req.params.trackId;
		db.collection('motd', function (err, collection) {
			collection.findOne({}, {_id: false}, function (err, item) {
				if (item) {
					var result = {};
					result.motd = item;
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
					res.setHeader("Content-Type", "application/gpx+xml");
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
							res.setHeader("Content-Type", "image/jpeg");
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
						res.setHeader("Content-Type", "image/jpeg");
						res.send(item.picBlob.buffer);
					} else { 
						logger.warn('not found');
						res.status(404).send({error: 'NotFound', description: 'picture not found'});
					}
				});
			});
		}
	}); 

}
