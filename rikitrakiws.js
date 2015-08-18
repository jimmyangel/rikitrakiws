var log4js = require('log4js');
var logger = log4js.getLogger();
var express = require('express');
var app = express();
var port = process.env.OPENSHIFT_NODEJS_PORT || 3000;
var loglevel = process.env.LOGLEVEL || 'DEBUG';

logger.setLevel(loglevel);

app.use(log4js.connectLogger(log4js.getLogger('http'), { level: 'auto' }));

app.use('/api/', require('./routes/'));

app.listen(port);

logger.info('starting');
