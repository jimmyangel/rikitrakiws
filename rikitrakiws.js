'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger();
var express = require('express');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var port = process.env.OPENSHIFT_NODEJS_PORT || 3000;
var ipaddress = process.env.OPENSHIFT_NODEJS_IP;
var loglevel = process.env.LOGLEVEL || 'DEBUG';

var app = express();

// Enforce https redirect if appropriate
app.enable('trust proxy');
app.use(function (req, res, next) {
	// Redirect to https only if the app is deployed
	if (/rikitraki/i.test(req.headers.host)) {
		if (req.secure) {
			next();
		} else {
			res.redirect('https://' + req.headers.host + req.url);
		}
	} else {
		next();
	}
});

app.use(favicon(__dirname + '/public/favicon.ico'));

logger.setLevel(loglevel);
app.use(express.static('public'));

app.use(log4js.connectLogger(log4js.getLogger('http'), { level: 'auto' }));
app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.raw({limit: '10mb', type: 'image/jpeg'}));

app.use('/api/', require('./routes/').router);

app.listen(port, ipaddress, function () {
	logger.info('starting rikitrakiws', this.address());
});
