// API router for track resources

module.exports = function (router, db) {

	console.log ('require tracks');

	// Get all tracks
	router.get('/tracks', function(req, res) {
		console.log('get tracks...');
		db.collection('tracks', function (err, collection) {
			var first = true;
			var stream = collection.find({}, {_id: false,
												trackId: true,
								 				trackLatLng: true,
												trackRegionTags: true, 
								 				trackLevel: true, 
								 				trackFav: true,
								 				trackGPX: true, 
								 				trackName: true, 
								 				trackDescription: true,
								 				hasPhotos: true});
			// Build the response json document by document
			res.setHeader("Content-Type", "application/json");
			res.write('{"tracks" : {');
			stream.on('data', function(data) {
				res.write((first ? '' : ',') + '"' + data.trackId + '":');
				res.write(JSON.stringify(data));
				first = false;
			});
			stream.on('end', function () {
				res.write('}}');
				res.end();
			});
		}); 
	});

	// Get a single track
	router.get('/tracks/:trackId', function(req, res) {
		console.log('get track info for: ' + req.params.trackId);
		var trackId = req.params.trackId;
		db.collection('tracks', function (err, collection) {
			collection.findOne({'trackId' : trackId}, function (err, item) {
				if (item) {
					res.send(item);
				} else { 
					console.log('not found');
					res.status(404).send({error: 'NotFound', description: 'track id not found'});
				}
			});
		});
	}); 

	// Get the geotags structure for a single track
	// This getter is here for compatibility with static version of rikitraki
	router.get('/tracks/:trackId/geotags', function(req, res) {
		console.log('get geotags for: ' + req.params.trackId);
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
					console.log('not found');
					res.status(404).send({error: 'NotFound', description: 'track id not found'});
				}
			});
		});
	}); 
}
