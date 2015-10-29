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
app.use(bodyParser.json({limit: '1mb'}));
app.use(bodyParser.raw({limit: '10mb', type: 'image/jpeg'}));


app.use('/api/', require('./routes/').router);

/* app.use(function(error, req, res, next) {
	if (error) {
		logger.error('InvalidInput', error.message);
		res.status(error.status).send({error: 'InvalidInput', description: error.message});		
	} else {
		next();
	}
}); */

app.listen(port, ipaddress, function () {
	logger.info('starting rikitrakiws', this.address());
});
