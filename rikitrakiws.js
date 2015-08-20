var log4js = require('log4js');
var logger = log4js.getLogger();
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var port = process.env.OPENSHIFT_NODEJS_PORT || 3000;
var ipaddress = process.env.OPENSHIFT_NODEJS_IP;
var loglevel = process.env.LOGLEVEL || 'DEBUG';

logger.setLevel(loglevel);

app.use(log4js.connectLogger(log4js.getLogger('http'), { level: 'auto' }));
app.use(bodyParser.json());

app.use('/api/', require('./routes/').router);

app.use(function(error, req, res, next) {
	if (error instanceof SyntaxError) {
		logger.error('input error', error);
		res.status(400).send({error: 'InvalidInput', description: 'syntax error in input'});
	} else {
		next();	
	}
});

app.listen(port, ipaddress, function () {
	logger.info('starting rikitrakiws', this.address());
});

