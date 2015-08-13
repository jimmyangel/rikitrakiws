var express = require('express');
var app = express();

app.use('/api/', require('./routes/'));

app.listen(3000);

console.log('starting');
