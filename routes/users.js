// API router for user resources
module.exports = function (router, db) {
	// var api = router.route('/api/users');

	console.log ('require users');

	router.get('/users', function(req, res) {
		console.log('get users...');
		db.collection('users', function (err, collection) {
			collection.find().toArray(function (err, items) {
				res.send(items);
			});
		});
	});

	router.get('/users/:username', function(req, res) {
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
}