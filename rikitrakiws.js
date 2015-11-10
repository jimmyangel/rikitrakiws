var log4js = require('log4js');
var logger = log4js.getLogger();
var express = require('express');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var port = process.env.OPENSHIFT_NODEJS_PORT || 3000;
var ipaddress = process.env.OPENSHIFT_NODEJS_IP;
var loglevel = process.env.LOGLEVEL || 'DEBUG';

var app = express();
app.use(favicon(__dirname + '/public/favicon.ico'));

logger.setLevel(loglevel);
app.use(express.static('public'));

app.use(log4js.connectLogger(log4js.getLogger('http'), { level: 'auto' }));
app.use(bodyParser.json({limit: '5mb'}));
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
