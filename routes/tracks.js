// API router for track resources
var log4js = require('log4js');
var logger = log4js.getLogger();

module.exports = function (router, db) {
	// Get all tracks
	router.get('/v1/tracks', function(req, res) {
		logger.info('get tracks...');
		db.collection('tracks', function (err, collection) {
			// var first = true;
			collection.find({}, {_id: false,
									trackId: true,
								 	trackLatLng: true,
									trackRegionTags: true, 
								 	trackLevel: true,
								 	trackType: true,
								 	trackFav: true,
								 	trackGPX: true, 
								 	trackName: true, 
								 	trackDescription: true,
								 	hasPhotos: true}, function(err, stream) {
				// Build the response json document by document
				// Using send instead of streaming via writes works better for etag and caching
				// res.setHeader('Content-Type', 'application/json');
				var result = {};
				result.tracks = {};
				// res.write('{"tracks" : {');
				stream.on('data', function(data) {
					// res.write((first ? '' : ',') + '"' + data.trackId + '":');
					// res.write(JSON.stringify(data));
					result.tracks[data.trackId] = data;
					// first = false;
				});
				stream.on('end', function () {
					// res.write('}}');
					// res.end();
					res.send(result);
				});
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
